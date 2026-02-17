import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import BookmarkList from "./_components/bookmark-list";
import UserDropdown from "./_components/user-dropdown";

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

  const userName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Bookmarks"
              width={36}
              height={36}
              className="h-12 w-12"
            />
            <span className="hidden text-lg font-semibold text-gray-900 sm:block">
              Bookmarks
            </span>
          </div>
          <UserDropdown name={userName} email={user.email || ""} />
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <BookmarkList initialBookmarks={bookmarks ?? []} userId={user.id} />
      </main>
    </div>
  );
}
