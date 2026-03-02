// app/ui/CaptionVoting.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { submitVote } from '@/lib/votes';

type Props = {
  captionId: string; // uuid
  initialScore?: number | null;
  initialUserVote?: number | null; // 1, -1, or null
};

export default function CaptionVoting({
  captionId,
  initialScore = null,
  initialUserVote = null,
}: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const [score, setScore] = useState<number>(initialScore ?? 0);
  const [userVote, setUserVote] = useState<number | null>(initialUserVote ?? null);
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  // fetch user auth + (optional) user vote if not provided
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;
        setSignedIn(!!user);

        if ((initialUserVote === null || typeof initialUserVote === 'undefined') && user) {
          // fetch this user's vote for the caption
          const { data: uv, error: uvErr } = await supabase
            .from('caption_votes')
            .select('vote_value')
            .eq('caption_id', captionId)
            .eq('profile_id', user.id)
            .single();

          if (!uvErr && uv && typeof uv.vote_value !== 'undefined') {
            setUserVote(Number(uv.vote_value));
          } else {
            setUserVote(null);
          }
        }
      } catch (err) {
        console.warn('supabase getUser / vote check failed', err);
        if (mounted) setSignedIn(null);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captionId]);

  // handle vote toggle: clicking same vote removes it (toggle)
  async function handleVoteClick(v: number) {
    if (signedIn === false) {
      alert('Please sign in to vote.');
      return;
    }
    if (loading) return;
    setLoading(true);

    const prevVote = userVote;
    const prevScore = score;

    let newVote = v;
    if (prevVote === v) newVote = 0; // toggle off

    // compute optimistic score
    let optimistic = prevScore;
    if (prevVote === null || typeof prevVote === 'undefined') {
      optimistic = prevScore + newVote;
    } else if (newVote === 0) {
      optimistic = prevScore - (prevVote || 0);
    } else {
      optimistic = prevScore - (prevVote || 0) + newVote;
    }

    // optimistic UI update
    setUserVote(newVote === 0 ? null : newVote);
    setScore(optimistic);

    // call API (uses your lib/votes.ts)
    const res = await submitVote(captionId, newVote);
    if (!res.ok) {
      // rollback
      setUserVote(prevVote);
      setScore(prevScore);
      console.error('submitVote error', res.error);
      alert('Failed to submit vote: ' + res.error);
    } else {
      // success — optionally re-sync from server here (not required)
    }

    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handleVoteClick(1)}
        disabled={loading || signedIn === false}
        aria-pressed={userVote === 1}
        title={signedIn ? 'Upvote' : 'Sign in to upvote'}
        className={'rounded px-2 py-1 text-sm ' + (userVote === 1 ? 'bg-green-100' : 'hover:bg-zinc-100')}
      >
        ▲
      </button>

      <div className="min-w-[2rem] text-center text-sm" aria-live="polite">
        {score}
      </div>

      <button
        onClick={() => handleVoteClick(-1)}
        disabled={loading || signedIn === false}
        aria-pressed={userVote === -1}
        title={signedIn ? 'Downvote' : 'Sign in to downvote'}
        className={'rounded px-2 py-1 text-sm ' + (userVote === -1 ? 'bg-red-100' : 'hover:bg-zinc-100')}
      >
        ▼
      </button>
    </div>
  );
}

// // app/ui/CaptionVoting.tsx
// 'use client';
// import React, { useEffect, useState } from 'react';
// import { supabase } from '@/lib/supabaseClient';
// import { submitVote } from '@/lib/votes';

// type Props = {
//   captionId: string; // uuid
//   initialScore?: number | null;
//   initialUserVote?: number | null; // 1, -1, or null
// };

// export default function CaptionVoting({
//   captionId,
//   initialScore = null,
//   initialUserVote = null,
// }: Props) {
//   const [score, setScore] = useState<number>(initialScore ?? 0);
//   const [userVote, setUserVote] = useState<number | null>(initialUserVote ?? null);
//   const [loading, setLoading] = useState(false);
//   const [signedIn, setSignedIn] = useState<boolean | null>(null);

//   // fetch user auth + (optional) user vote if not provided
//   useEffect(() => {
//     let mounted = true;

//     (async () => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (!mounted) return;
//       setSignedIn(!!user);

//       if (initialUserVote === null && user) {
//         // fetch this user's vote for the caption
//         const { data: uv, error: uvErr } = await supabase
//           .from('caption_votes')
//           .select('vote_value')
//           .eq('caption_id', captionId)
//           .eq('profile_id', user.id)
//           .single();

//         if (!uvErr && uv && typeof uv.vote_value !== 'undefined') {
//           setUserVote(Number(uv.vote_value));
//         } else {
//           setUserVote(null);
//         }
//       }
//     })();

//     return () => {
//       mounted = false;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [captionId]);

//   // handle vote toggle: clicking same vote removes it (toggle)
//   async function handleVoteClick(v: number) {
//     if (signedIn === false) {
//       alert('Please sign in to vote.');
//       return;
//     }
//     if (loading) return;
//     setLoading(true);

//     const prevVote = userVote;
//     const prevScore = score;

//     let newVote = v;
//     if (prevVote === v) newVote = 0; // toggle off

//     // compute optimistic score
//     let optimistic = prevScore;
//     if (prevVote === null || typeof prevVote === 'undefined') {
//       optimistic = prevScore + newVote;
//     } else if (newVote === 0) {
//       optimistic = prevScore - (prevVote || 0);
//     } else {
//       optimistic = prevScore - (prevVote || 0) + newVote;
//     }

//     setUserVote(newVote === 0 ? null : newVote);
//     setScore(optimistic);

//     const res = await submitVote(captionId, newVote);
//     if (!res.ok) {
//       // rollback
//       setUserVote(prevVote);
//       setScore(prevScore);
//       console.error('submitVote error', res.error);
//       alert('Failed to submit vote: ' + res.error);
//     } else {
//       // optionally, we could re-fetch server-side aggregated score here
//     }

//     setLoading(false);
//   }

//   return (
//     <div className="flex items-center gap-3">
//       <button
//         onClick={() => handleVoteClick(1)}
//         disabled={loading || signedIn === false}
//         aria-pressed={userVote === 1}
//         title={signedIn ? 'Upvote' : 'Sign in to upvote'}
//         className={
//           'rounded px-2 py-1 text-sm ' + (userVote === 1 ? 'bg-green-100' : 'hover:bg-zinc-100')
//         }
//       >
//         ▲
//       </button>

//       <div className="min-w-[2rem] text-center text-sm" aria-live="polite">
//         {score}
//       </div>

//       <button
//         onClick={() => handleVoteClick(-1)}
//         disabled={loading || signedIn === false}
//         aria-pressed={userVote === -1}
//         title={signedIn ? 'Downvote' : 'Sign in to downvote'}
//         className={
//           'rounded px-2 py-1 text-sm ' + (userVote === -1 ? 'bg-red-100' : 'hover:bg-zinc-100')
//         }
//       >
//         ▼
//       </button>
//     </div>
//   );
// }