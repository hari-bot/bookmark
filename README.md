# Smart Bookmark

A real-time bookmark manager built with Next.js, Supabase, and Tailwind CSS. Users sign in with Google OAuth, save bookmarks (URL + title), and see changes sync across browser tabs instantly.

## Live Demo

[Deployed on Vercel](https://bookmark-omega-pink.vercel.app/)

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

### 1. Google OAuth redirect URI mismatch

**Problem:** Google login failed with a `redirect_uri_mismatch` error — the redirect URL my app was sending didn't match what was configured in Google Cloud Console.

**Solution:** I had to add the exact Supabase callback URL (`https://<ref>.supabase.co/auth/v1/callback`) as an authorized redirect URI in Google Cloud Console. I also had to add my app's callback (`/auth/callback`) to Supabase's Redirect URLs under Authentication settings. Both need to match for the OAuth flow to work.

### 2. Realtime updates not showing across tabs

**Problem:** When I added a bookmark in one tab, it wouldn't appear in the other tab. The Supabase Realtime `postgres_changes` subscription for INSERT events wasn't delivering updates reliably.

**Solution:** I used Supabase's **Broadcast** feature instead. When a bookmark is added, the app broadcasts a message on a shared channel. Other tabs listen for this broadcast and add the bookmark to their list. DELETE events still work fine through `postgres_changes`, so I kept that as-is. This hybrid approach (Broadcast for adds, postgres_changes for deletes) made cross-tab sync reliable.

### 3. Duplicate bookmarks appearing in the list

**Problem:** When adding a bookmark, it would sometimes appear twice — once from the immediate insert response (optimistic update) and once from the Realtime/Broadcast event.

**Solution:** Added a simple deduplication check before adding to state: `if (prev.some((b) => b.id === newBookmark.id)) return prev`. If a bookmark with the same ID already exists in the list, we skip adding it again. This prevents duplicates regardless of which event arrives first.
