"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

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

  const addBookmark = useCallback((bookmark: Bookmark) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === bookmark.id)) return prev;
      return [bookmark, ...prev];
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let channelInstance: ReturnType<typeof supabase.channel> | null = null;

    async function setupRealtime() {
      // Get the session and set auth BEFORE subscribing
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }

      // Now subscribe — the Realtime connection is authenticated
      channelInstance = supabase
        .channel("bookmarks-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bookmarks",
          },
          (payload) => {
            const newBookmark = payload.new as Bookmark;
            if (newBookmark.user_id === userId) {
              setBookmarks((prev) => {
                if (prev.some((b) => b.id === newBookmark.id)) return prev;
                return [newBookmark, ...prev];
              });
            }
          }
        )
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
    }

    setupRealtime();

    // Keep auth token in sync on refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.access_token) {
          supabase.realtime.setAuth(session.access_token);
        }
      }
    );

    return () => {
      if (channelInstance) {
        supabase.removeChannel(channelInstance);
      }
      subscription.unsubscribe();
    };
  }, [userId]);

  return { bookmarks, addBookmark, removeBookmark };
}
