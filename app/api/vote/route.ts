// app/api/vote/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    console.log("/api/vote invoked at", new Date().toISOString());

    // debug: raw body
    const raw = await req.text();
    console.log("/api/vote raw body:", raw);
    let body: any;
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn("could not parse body as json", err);
      body = {};
    }
    console.log("/api/vote parsed body:", body);

    // accept multiple possible property names for compatibility
    const captionId = body?.captionId ?? body?.caption_id ?? body?.id;
    // accept either 'vote' (server naming) or 'voteValue' (client naming)
    const voteRaw = body?.vote ?? body?.voteValue ?? body?.value;

    // normalize types
    const vote = typeof voteRaw === "string" ? Number(voteRaw) : voteRaw;

    if (!captionId || typeof captionId !== "string") {
      return NextResponse.json({ error: "invalid_request_missing_captionId" }, { status: 400 });
    }
    if (typeof vote !== "number" || ![1, -1, 0].includes(vote)) {
      return NextResponse.json({ error: "invalid_request_bad_vote", received: voteRaw }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // get authenticated user from server supabase client
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr) {
      console.error("auth.getUser error:", authErr);
      return NextResponse.json({ error: "auth_error" }, { status: 500 });
    }
    if (!authData?.user) {
      console.log("no authenticated user found for request");
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const profileId = authData.user.id;

    // check for existing vote by this user on this caption
    const { data: existingVotes, error: existingErr } = await supabase
      .from("caption_votes")
      .select("id, vote_value")
      .eq("profile_id", profileId)
      .eq("caption_id", captionId)
      .limit(1);

    if (existingErr) {
      console.error("error checking existing vote:", existingErr);
      return NextResponse.json({ error: existingErr.message ?? "check_existing_failed" }, { status: 500 });
    }

    const existing = (existingVotes && existingVotes.length > 0) ? existingVotes[0] : null;

    // If vote === 0 => toggle off (delete existing vote if any)
    if (vote === 0) {
      if (!existing) {
        return NextResponse.json({ ok: true });
      }

      const { error: delErr } = await supabase
        .from("caption_votes")
        .delete()
        .eq("id", existing.id);

      if (delErr) {
        console.error("failed to delete vote:", delErr);
        return NextResponse.json({ error: delErr.message ?? "delete_failed" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, action: "deleted" });
    }

    // vote is 1 or -1 -> update existing vote or insert new one
    if (existing) {
      const { error: updErr } = await supabase
        .from("caption_votes")
        .update({
          vote_value: vote,
          modified_by_user_id: profileId,
        })
        .eq("id", existing.id);

      if (updErr) {
        console.error("failed to update existing vote:", updErr);
        return NextResponse.json({ error: updErr.message ?? "update_failed" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, action: "updated" });
    } else {
      const { data: insertData, error: insertErr } = await supabase
        .from("caption_votes")
        .insert([
          {
            profile_id: profileId,
            caption_id: captionId,
            vote_value: vote,
            created_by_user_id: profileId,
            modified_by_user_id: profileId,
          },
        ]);

      if (insertErr) {
        console.error("insert caption_votes error:", insertErr);
        if ((insertErr as any)?.code === "23505" || (insertErr as any)?.message?.includes("duplicate key")) {
          return NextResponse.json({ error: "duplicate_vote" }, { status: 409 });
        }
        return NextResponse.json({ error: insertErr.message ?? "insert_failed" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, action: "inserted" });
    }
  } catch (err: any) {
    console.error("/api/vote unexpected error:", err);
    return NextResponse.json({ error: err?.message ?? "server_error" }, { status: 500 });
  }
}