// app/api/vote/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { captionId, vote } = body ?? {};

    if (!captionId || (vote !== 1 && vote !== -1 && vote !== 0)) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    // server-side supabase client reads cookies to get the user's session
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();

    if (authErr) {
      console.error("auth.getUser error:", authErr);
      return NextResponse.json({ error: "auth_error" }, { status: 500 });
    }
    if (!authData?.user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const profileId = authData.user.id;

    // Option A: insert new vote row
    // If you want to allow multiple votes per user per caption you can leave this.
    // If you want exactly one vote per (profile_id, caption_id) then use upsert:
    const { data: insertData, error: insertErr } = await supabase
      .from("caption_votes")
      .insert([
        {
          profile_id: profileId,
          caption_id: captionId,
          vote_value: vote,
        },
      ]);

    if (insertErr) {
      console.error("insert caption_votes error:", insertErr);
      return NextResponse.json({ error: insertErr.message ?? "insert_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("API /api/vote error:", err);
    return NextResponse.json({ error: err?.message ?? "server_error" }, { status: 500 });
  }
}