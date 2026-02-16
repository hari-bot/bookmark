"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type Bookmark = {
  id: string;
  user_id: string;
  url: string;
  title: string;
  created_at: string;
};

export function useBookmarksRealtime(
  initialBookmarks: Bookmark[],
  userId: string
) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const addBookmark = useCallback((bookmark: Bookmark) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === bookmark.id)) return prev;
      return [bookmark, ...prev];
    });
    // Broadcast to other tabs
    channelRef.current?.send({
      type: "broadcast",
      event: "bookmark-added",
      payload: bookmark,
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`bookmarks-${userId}`)
      .on("broadcast", { event: "bookmark-added" }, (message) => {
        const newBookmark = message.payload as Bookmark;
        setBookmarks((prev) => {
          if (prev.some((b) => b.id === newBookmark.id)) return prev;
          return [newBookmark, ...prev];
        });
      })
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bookmarks",
        },
        (payload) => {
          const old = payload.old as Partial<Bookmark>;
          if (old.id) {
            setBookmarks((prev) => prev.filter((b) => b.id !== old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { bookmarks, addBookmark, removeBookmark };
}
