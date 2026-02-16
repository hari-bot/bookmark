# Smart Bookmark

A real-time bookmark manager built with Next.js, Supabase, and Tailwind CSS. Users sign in with Google OAuth, save bookmarks (URL + title), and see changes sync across browser tabs instantly.

## Live Demo

[Deployed on Vercel](https://your-vercel-url.vercel.app) *(update after deployment)*

## Features

- **Google OAuth** — Sign in with your Google account (no email/password)
- **Add bookmarks** — Save any URL with a title
- **Private bookmarks** — Each user only sees their own bookmarks (enforced by Row Level Security)
- **Real-time sync** — Open two tabs; add or delete a bookmark in one, and it appears/disappears in the other instantly
- **Delete bookmarks** — Remove bookmarks you no longer need

## Tech Stack

- **Next.js 15** (App Router)
- **Supabase** (Auth, PostgreSQL Database, Realtime)
- **Tailwind CSS** for styling
- **TypeScript**
- **Vercel** for deployment

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- Google OAuth credentials (from [Google Cloud Console](https://console.cloud.google.com))

### 1. Clone the repo

```bash
git clone https://github.com/your-username/smart-bookmark.git
cd smart-bookmark
npm install
```

### 2. Set up Supabase

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);
```

Then enable **Realtime** for the `bookmarks` table:
- Go to **Database → Replication** in the Supabase Dashboard
- Toggle on the `bookmarks` table

### 3. Configure Google OAuth

1. In [Google Cloud Console](https://console.cloud.google.com), create OAuth 2.0 credentials
2. Set the authorized redirect URI to: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
3. In Supabase Dashboard → **Authentication → Providers → Google**, enable it and paste your Client ID and Client Secret

### 4. Environment variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Deploy to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add the two environment variables in Vercel project settings
4. Deploy
5. After deployment, update:
   - **Supabase → Authentication → URL Configuration**: Set Site URL to your Vercel URL and add `https://your-vercel-url.vercel.app/auth/callback` to Redirect URLs
   - **Google Cloud Console**: Add the Vercel URL to authorized JavaScript origins

## Problems Encountered & Solutions

### 1. Supabase cookies not setting in Server Components

**Problem:** `createServerClient` from `@supabase/ssr` calls `setAll` to update auth cookies, but Server Components in Next.js are read-only and cannot set cookies.

**Solution:** Wrapped the `setAll` method in a `try/catch` block in `lib/supabase/server.ts`. Cookie writes silently fail in Server Components (which is expected), while they succeed in Route Handlers and Middleware where they actually matter for session management.

### 2. Realtime DELETE events cannot be filtered by column

**Problem:** Supabase Realtime supports `filter` on `INSERT` and `UPDATE` events (e.g., `filter: 'user_id=eq.xxx'`), but DELETE events cannot be filtered by column value — the filter is ignored.

**Solution:** Relied on Row Level Security (RLS) to ensure that only events for the authenticated user's rows are delivered. The client-side handler matches by `payload.old.id` to remove the correct bookmark from state. This is both secure and correct.

### 3. Session expiring / user appearing logged out

**Problem:** After some time, the Supabase auth token would expire, and protected pages would redirect to login even though the user hadn't signed out.

**Solution:** Added middleware (`middleware.ts`) that runs on every request and calls `supabase.auth.getUser()`. This automatically refreshes the session token and sets updated cookies, keeping the user authenticated as long as the refresh token is valid.

### 4. Google OAuth redirect URI mismatch

**Problem:** After deploying to Vercel, Google OAuth would fail with a "redirect_uri_mismatch" error because the callback URL didn't match what was configured in Google Cloud Console.

**Solution:** The Supabase auth callback URL (`https://<ref>.supabase.co/auth/v1/callback`) must be added as an authorized redirect URI in Google Cloud Console. Additionally, the app's own callback (`/auth/callback`) must be added to Supabase's Redirect URLs in Authentication → URL Configuration. Both must be configured for OAuth to work.

### 5. Duplicate bookmarks appearing in real-time list

**Problem:** When adding a bookmark, it would sometimes appear twice — once from the optimistic/immediate Supabase insert response and once from the Realtime subscription.

**Solution:** Added a deduplication check in the Realtime INSERT handler: `if (prev.some((b) => b.id === newBookmark.id)) return prev`. This ensures the same bookmark is never added to state twice, regardless of event ordering.
