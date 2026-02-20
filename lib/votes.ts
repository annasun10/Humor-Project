// lib/votes.ts
import { supabase } from './supabaseClient';

export type VoteResult = { ok: true } | { ok: false; error: string };

// voteValue: 1 (upvote), -1 (downvote), 0 (remove)
export async function submitVote(captionId: string, voteValue: number): Promise<VoteResult> {
  // ensure user is signed in:
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'not_authenticated' };

  try {
    if (voteValue === 0) {
      // remove vote
      const { error } = await supabase
        .from('caption_votes')
        .delete()
        .match({ caption_id: captionId, profile_id: user.id });

      if (error) throw error;
      return { ok: true };
    } else {
      // upsert (insert or update) using schema column names:
      const payload = {
        caption_id: captionId,
        profile_id: user.id,
        vote_value: voteValue,
        modified_datetime_utc: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('caption_votes')
        .upsert(payload, { onConflict: 'caption_id,profile_id' });

      if (error) throw error;
      return { ok: true };
    }
  } catch (e: any) {
    return { ok: false, error: e.message ?? String(e) };
  }
}