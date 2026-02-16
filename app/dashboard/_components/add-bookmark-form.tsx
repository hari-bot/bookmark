"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/hooks/use-bookmarks-realtime";

interface Props {
  onAdd: (bookmark: Bookmark) => void;
}

export default function AddBookmarkForm({ onAdd }: Props) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !title) return;

    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("bookmarks")
      .insert({ url, title, user_id: user.id })
      .select()
      .single();

    if (insertError) {
      setError("Failed to add bookmark");
    } else if (data) {
      onAdd(data as Bookmark);
      setUrl("");
      setTitle("");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:flex-1"
        required
      />
      <input
        type="url"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:flex-1"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add"}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
}
