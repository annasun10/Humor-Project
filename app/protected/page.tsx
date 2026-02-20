// app/protected/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SignOutButton from "@/app/ui/SignOutButton";
import CaptionPlayer from "@/app/ui/CaptionPlayer";

export default async function ProtectedPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const user = data.user;

  // -------- fetch captions --------
  const { data: captions } = await supabase
    .from("captions")
    .select("id, content, image_id, created_datetime_utc")
    .order("created_datetime_utc", { ascending: false });

  const captionRows = captions ?? [];

  // -------- fetch images --------
  const imageIds = captionRows.map(c => c.image_id).filter(Boolean);

  const { data: images } = imageIds.length
    ? await supabase.from("images").select("id, url").in("id", imageIds)
    : { data: [] };

  const imageMap = new Map(images?.map(i => [i.id, i.url]) ?? []);

  // -------- fetch votes --------
  const captionIds = captionRows.map(c => c.id);

  const { data: votes } = captionIds.length
    ? await supabase
        .from("caption_votes")
        .select("caption_id, vote_value, profile_id")
        .in("caption_id", captionIds)
    : { data: [] };

  const scoreMap = new Map<string, number>();
  const userVoteMap = new Map<string, number | null>();

  for (const v of votes ?? []) {
    scoreMap.set(v.caption_id, (scoreMap.get(v.caption_id) ?? 0) + v.vote_value);
    if (v.profile_id === user.id) userVoteMap.set(v.caption_id, v.vote_value);
  }

  // -------- build items --------
  const items = captionRows.map(c => ({
    id: c.id,
    content: c.content,
    imageUrl: imageMap.get(c.image_id) ?? null,
    created: c.created_datetime_utc,
    initialScore: scoreMap.get(c.id) ?? 0,
    initialUserVote: userVoteMap.get(c.id) ?? null
  }));

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* minimal header */}
      <header className="flex justify-end p-4 border-b bg-white">
        <SignOutButton />
      </header>

      {/* full screen viewer */}
      <main className="flex-1 flex items-center justify-center p-6">
        {/* @ts-ignore */}
        <CaptionPlayer items={items} />
      </main>
    </div>
  );
}