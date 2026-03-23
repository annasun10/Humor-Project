"use client";

import React, { useState } from "react";

type Props = {
  captionId: number;
  initialScore: number;
};

export default function CaptionVotes({ captionId, initialScore }: Props) {
  const [score, setScore] = useState<number>(initialScore);
  const [loading, setLoading] = useState(false);

  async function submitVote(v: 1 | -1) {
    if (loading) return;
    // optimistic update
    setScore((s) => s + v);
    setLoading(true);

    try {
      const res = await fetch("/api/caption-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captionId, vote: v }),
      });

      if (!res.ok) {
        // revert optimistic update on failure
        setScore((s) => s - v);
        const json = await res.json().catch(() => ({}));
        console.error("Vote failed:", json);
        alert(json?.error ?? "Vote failed");
      }
    } catch (err) {
      setScore((s) => s - v);
      console.error("Network error voting:", err);
      alert("Network error while voting");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => submitVote(1)}
        disabled={loading}
        aria-label="Upvote"
        className="rounded px-2 py-1 hover:bg-zinc-100 disabled:opacity-50"
      >
        ▲
      </button>

      <div className="min-w-[2rem] text-center font-medium">{score}</div>

      <button
        onClick={() => submitVote(-1)}
        disabled={loading}
        aria-label="Downvote"
        className="rounded px-2 py-1 hover:bg-zinc-100 disabled:opacity-50"
      >
        ▼
      </button>
    </div>
  );
}