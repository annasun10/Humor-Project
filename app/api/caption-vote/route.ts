// app/api/caption-vote/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ReqBody = { captionId: number | string; vote: 1 | -1 };

export async function POST(req: NextRequest) {
  try {
    const body: ReqBody = await req.json();
    const { captionId, vote } = body ?? {};
    if (!captionId || (vote !== 1 && vote !== -1)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // create server client (async helper)
    const supabase = await createSupabaseServerClient();

    // get current auth user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // profiles.id === auth.users.id in your schema, so select by user.id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // insert new vote row (assignment expects inserts)
    const { error: insertError } = await supabase.from("caption_votes").insert({
      profile_id: profile.id,
      caption_id: Number(captionId),
      vote_value: vote,
      created_by_user_id: profile.id,
      modified_by_user_id: profile.id,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}