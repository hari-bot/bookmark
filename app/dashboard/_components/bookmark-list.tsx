"use client";

import {
  useBookmarksRealtime,
  type Bookmark,
} from "@/hooks/use-bookmarks-realtime";
import BookmarkCard from "./bookmark-card";
import AddBookmarkForm from "./add-bookmark-form";

interface Props {
  initialBookmarks: Bookmark[];
  userId: string;
}

export default function BookmarkList({ initialBookmarks, userId }: Props) {
  const { bookmarks, addBookmark, removeBookmark } = useBookmarksRealtime(
    initialBookmarks,
    userId
  );

  return (
    <>
      <AddBookmarkForm onAdd={addBookmark} />

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Your Bookmarks{" "}
          {bookmarks.length > 0 && (
            <span className="text-gray-400">({bookmarks.length})</span>
          )}
        </h2>

        {bookmarks.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
              <svg
                className="h-8 w-8 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-500">
              No bookmarks yet
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Start adding bookmarks to get organized
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            {bookmarks.map((bookmark, index) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={removeBookmark}
                isLast={index === bookmarks.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
