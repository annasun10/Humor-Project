// // lib/votes.ts
// // client-side helper that calls your server-side /api/vote endpoint
// export async function submitVote(captionId: string, voteValue: number) {
//   console.log('submitVote called', { captionId, voteValue });

//   try {
//     const res = await fetch('/api/vote', {
//       method: 'POST',
//       credentials: 'same-origin', // <--- THIS ENSURES THE BROWSER SENDS COOKIES
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ captionId, vote: voteValue }),
//     });

//     console.log('fetch completed, status:', res.status);

//     // try to parse JSON response
//     const json = await res.json().catch(() => ({}));
//     console.log('fetch response json:', json);

//     if (!res.ok) {
//       return { ok: false, error: json?.error ?? res.statusText };
//     }
//     return { ok: true };
//   } catch (err: any) {
//     console.error('submitVote network error', err);
//     return { ok: false, error: err?.message ?? 'network_error' };
//   }
// }

// lib/votes.ts
export async function submitVote(captionId: string, voteValue: number) {
  try {
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ captionId, voteValue })
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || `status ${res.status}` };
    }

    const json = await res.json().catch(() => ({}));
    return { ok: true, data: json };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}