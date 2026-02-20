// lib/votes.ts
// client-side helper that calls your server-side /api/vote endpoint
export async function submitVote(captionId: string, voteValue: number) {
  console.log('submitVote called', { captionId, voteValue });

  try {
    const res = await fetch('/api/vote', {
      method: 'POST',
      credentials: 'same-origin', // <--- THIS ENSURES THE BROWSER SENDS COOKIES
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ captionId, vote: voteValue }),
    });

    console.log('fetch completed, status:', res.status);

    // try to parse JSON response
    const json = await res.json().catch(() => ({}));
    console.log('fetch response json:', json);

    if (!res.ok) {
      return { ok: false, error: json?.error ?? res.statusText };
    }
    return { ok: true };
  } catch (err: any) {
    console.error('submitVote network error', err);
    return { ok: false, error: err?.message ?? 'network_error' };
  }
}