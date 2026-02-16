import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookmarkList from "./_components/bookmark-list";
import LogoutButton from "./_components/logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookmarks</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <LogoutButton />
      </header>
      <BookmarkList initialBookmarks={bookmarks ?? []} userId={user.id} />
    </main>
  );
}
