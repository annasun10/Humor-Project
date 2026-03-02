// app/ui/CaptionPlayer.tsx
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { submitVote } from '@/lib/votes';

type Item = {
  id: string;
  content?: string | null;
  imageUrl?: string | null;
  created?: string | null;
  initialScore?: number;
  initialUserVote?: number | null; // 1, -1, or null
};

export default function CaptionPlayer({ items, datasetKey }: { items: Item[], datasetKey: string }) {
  const [index, setIndex] = useState(0);
  const [localItems, setLocalItems] = useState<Item[]>(items ?? []);
  const [loading, setLoading] = useState(false);
  
  console.log("CaptionPlayer props:", { items, datasetKey });

  // Keep localItems synced if server props change
  useEffect(() => {
    // HARD reset state when dataset changes
    setLocalItems(JSON.parse(JSON.stringify(items ?? [])));
    setIndex(0);
  }, [datasetKey]);

  const handleVote = useCallback(
    async (voteVal: number) => {
      console.log("vote clicked:", voteVal);
      if (!localItems.length) return;
      if (loading) return;
      setLoading(true);

      const current = localItems[index];
      const prevScore = current.initialScore ?? 0;
      const prevUserVote = current.initialUserVote ?? null;

      // calculate newVote (toggle off if clicking same)
      let newVote = voteVal;
      if (prevUserVote === voteVal) newVote = 0;

      // optimistic score calculation
      let newScore = prevScore;
      if (prevUserVote === null) {
        newScore = prevScore + newVote;
      } else if (newVote === 0) {
        newScore = prevScore - (prevUserVote || 0);
      } else {
        newScore = prevScore - (prevUserVote || 0) + newVote;
      }

      // optimistic update local state
      setLocalItems((arr) =>
        arr.map((it, i) =>
          i === index ? { ...it, initialScore: newScore, initialUserVote: newVote === 0 ? null : newVote } : it
        )
      );

      // call server
      const res = await submitVote(current.id, newVote);
      if (!res.ok) {
        // rollback on error
        setLocalItems((arr) =>
          arr.map((it, i) =>
            i === index ? { ...it, initialScore: prevScore, initialUserVote: prevUserVote } : it
          )
        );
        alert('Failed to submit vote: ' + res.error);
        setLoading(false);
        return;
      }

      // advance to next item
      setIndex((i) => (i + 1 < localItems.length ? i + 1 : 0));
      setLoading(false);
    },
    [index, localItems, loading]
  );

  // keyboard shortcuts: ArrowRight = upvote, ArrowLeft = downvote
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // avoid capturing when user is typing in an input/textarea
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleVote(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleVote(-1);
      } else if (e.key === 'ArrowUp') {
        // optional: treat ArrowUp as upvote too
        e.preventDefault();
        handleVote(1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleVote(-1);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleVote]);

  const goPrev = () => {
    if (index === 0) return;
    setIndex((i) => i - 1);
  };

  const goNext = () => {
    setIndex((i) => (i + 1 < localItems.length ? i + 1 : 0));
  };

  if (!localItems || localItems.length === 0) {
    return <div className="text-center py-12 text-sm text-zinc-600">No captions to rate.</div>;
  }

  const current = localItems[index];

  return (
    <div className="w-full max-w-6xl flex flex-col items-center">
      <div className="w-full bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row md:items-start gap-6">
        {/* LEFT: image column (flex-1) */}
        <div className="flex-1 flex items-center justify-center">
          {current.imageUrl ? (
            // wrapper constrains width so image won't grow too large
            <div className="w-full max-w-[60vw]">
              <img
                src={current.imageUrl}
                alt={current.content ?? 'caption image'}
                className="w-full max-h-[65vh] object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="h-80 w-80 rounded bg-zinc-100 flex items-center justify-center text-xs text-zinc-500">
              No image
            </div>
          )}
        </div>

        {/* RIGHT: caption + controls (fixed width on md+) */}
        <aside className="w-full md:w-80 flex-shrink-0 flex flex-col items-center md:items-start">
          <div className="text-lg md:text-2xl font-medium text-center md:text-left mb-6 px-4">
            {current.content}
          </div>

          {/* ---- replace the old vote buttons block with this ----
          <div className="flex items-center gap-8">
            <button
              onClick={(e) => {
                console.log("button downvote clicked - DOM onClick fired");
                e.stopPropagation();
                // also log the active element for debugging
                console.log("active element:", document.activeElement);
                handleVote(-1);
              }}
              disabled={loading}
              aria-pressed={current.initialUserVote === -1}
              className="text-6xl md:text-7xl transform hover:scale-110 active:scale-95 transition outline-none focus:ring-2 focus:ring-offset-2"
              title="Downvote (← / ↓)"
              style={{ outline: "1px solid rgba(255,0,0,0.15)" }} // visual debug outline
            >
              👎
            </button>

            <div className="text-center">
              <div className="text-sm text-zinc-500 mb-1">Score</div>
              <div className="text-2xl font-semibold">{current.initialScore ?? 0}</div>
            </div>

            <button
              onClick={(e) => {
                console.log("button upvote clicked - DOM onClick fired");
                e.stopPropagation();
                console.log("active element:", document.activeElement);
                handleVote(1);
              }}
              disabled={loading}
              aria-pressed={current.initialUserVote === 1}
              className="text-6xl md:text-7xl transform hover:scale-110 active:scale-95 transition outline-none focus:ring-2 focus:ring-offset-2"
              title="Upvote (→ / ↑)"
              style={{ outline: "1px solid rgba(255,0,0,0.15)" }}
            >
              👍
            </button>
          </div> */}

          <div className="flex items-center gap-8">
            <button
              onClick={() => handleVote(-1)}
              disabled={loading}
              aria-pressed={current.initialUserVote === -1}
              className="text-6xl md:text-7xl transform hover:scale-110 active:scale-95 transition"
              title="Downvote (← / ↓)"
            >
              👎
            </button>

            <div className="text-center">
              <div className="text-sm text-zinc-500 mb-1">Score</div>
              <div className="text-2xl font-semibold">{current.initialScore ?? 0}</div>
            </div>

            <button
              onClick={() => handleVote(1)}
              disabled={loading}
              aria-pressed={current.initialUserVote === 1}
              className="text-6xl md:text-7xl transform hover:scale-110 active:scale-95 transition"
              title="Upvote (→ / ↑)"
            >
              👍
            </button>
          </div>

          {/* nav controls */}
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={goPrev}
              disabled={index === 0}
              className={
                "rounded px-3 py-1 transition " +
                (index === 0
                  ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                  : "bg-zinc-100 hover:bg-zinc-200")
              }
              aria-label="Previous"
            >
              Prev
            </button>

            <div className="ml-4 text-sm text-zinc-500">
              {index + 1} / {localItems.length}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}