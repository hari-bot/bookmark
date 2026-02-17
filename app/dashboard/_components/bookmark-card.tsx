"use client";

import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/hooks/use-bookmarks-realtime";

interface Props {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  isLast: boolean;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export default function BookmarkCard({ bookmark, onDelete, isLast }: Props) {
  const handleDelete = async () => {
    onDelete(bookmark.id);
    const supabase = createClient();
    await supabase.from("bookmarks").delete().eq("id", bookmark.id);
  };

  return (
    <div
      className={`flex items-center justify-between px-5 py-4 ${
        !isLast ? "border-b border-gray-100" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
          <svg
            className="h-5 w-5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        </div>
        <div>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-900 hover:text-blue-600"
          >
            {bookmark.title}
          </a>
          <p className="text-xs text-blue-500">{getDomain(bookmark.url)}</p>
        </div>
      </div>
      <button
        onClick={handleDelete}
        className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
        title="Delete bookmark"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}
