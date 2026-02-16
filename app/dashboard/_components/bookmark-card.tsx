"use client";

import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/hooks/use-bookmarks-realtime";

interface Props {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
}

export default function BookmarkCard({ bookmark, onDelete }: Props) {
  const handleDelete = async () => {
    onDelete(bookmark.id);
    const supabase = createClient();
    await supabase.from("bookmarks").delete().eq("id", bookmark.id);
  };

  return (
    <li className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="min-w-0 flex-1">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 hover:underline"
        >
          {bookmark.title}
        </a>
        <p className="mt-0.5 truncate text-sm text-gray-400">{bookmark.url}</p>
      </div>
      <button
        onClick={handleDelete}
        className="ml-4 shrink-0 rounded-md px-3 py-1.5 text-sm text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
      >
        Delete
      </button>
    </li>
  );
}
