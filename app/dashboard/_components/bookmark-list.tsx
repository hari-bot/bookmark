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
      {bookmarks.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-400">No bookmarks yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Add your first bookmark above!
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onDelete={removeBookmark}
            />
          ))}
        </ul>
      )}
    </>
  );
}
