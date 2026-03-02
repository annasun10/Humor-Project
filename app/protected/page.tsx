// app/protected/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SignOutButton from "@/app/ui/SignOutButton";
import CaptionPlayer from "@/app/ui/CaptionPlayer";
import ImageUploadTester from "@/app/ui/ImageUploadTester";
import Header from "@/app/ui/Header";

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

  // -------- fetch images (normalize common url fields) --------
  const imageIds = captionRows.map((c) => c.image_id).filter(Boolean);

  let imageMap = new Map<string, string | null>();
  if (imageIds.length) {
    const { data: imagesRows, error: imagesErr } = await supabase
      .from("images")
      .select("id, url")   // <-- only 'url'
      .in("id", imageIds);

    if (imagesErr) {
      console.warn("images fetch error:", imagesErr);
    } else {
      for (const img of imagesRows ?? []) {
        imageMap.set(String(img.id).toLowerCase(), (img as any).url ?? null);
      }
    }
  }

  //   // -------- fetch images (normalize common url fields) --------
  // const imageIds = captionRows.map((c) => c.image_id).filter(Boolean);

  // let imageMap = new Map<string, string | null>();
  // if (imageIds.length) {
  //   const { data: imagesRows, error: imagesErr } = await supabase
  //     .from("images")
  //     // select several likely url fields the pipeline might have written
  //     .select("id, url, url, cdn_url, cdnUrl, src, file_url")
  //     .in("id", imageIds);

  //   if (imagesErr) {
  //     console.warn("images fetch error:", imagesErr);
  //   } else {
  //     for (const img of imagesRows ?? []) {
  //       const anyImg = img as any;
  //       const url =
  //         anyImg.url ??
  //         anyImg.url ??
  //         anyImg.cdn_url ??
  //         anyImg.cdnUrl ??
  //         anyImg.src ??
  //         anyImg.file_url ??
  //         null;
  //       imageMap.set(String(img.id).toLowerCase(), url);
  //     }
  //   }
  // }

  // -------- fetch votes --------
  const captionIds = captionRows.map((c) => c.id);

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

  // -------- build items (ensure imageUrl is set) --------
  const items = captionRows.map((c) => ({
    id: c.id,
    content: c.content,
    imageUrl: imageMap.get(String(c.image_id ?? "").toLowerCase()) ?? null,
    created: c.created_datetime_utc,
    initialScore: scoreMap.get(c.id) ?? 0,
    initialUserVote: userVoteMap.get(c.id) ?? null,
  }));

  // // -------- fetch images --------
  // const imageIds = captionRows.map(c => c.image_id).filter(Boolean);

  // const { data: images } = imageIds.length
  //   ? await supabase.from("images").select("id, url").in("id", imageIds)
  //   : { data: [] };

  // const imageMap = new Map(images?.map(i => [i.id, i.url]) ?? []);

  // // -------- fetch votes --------
  // const captionIds = captionRows.map(c => c.id);

  // const { data: votes } = captionIds.length
  //   ? await supabase
  //       .from("caption_votes")
  //       .select("caption_id, vote_value, profile_id")
  //       .in("caption_id", captionIds)
  //   : { data: [] };

  // const scoreMap = new Map<string, number>();
  // const userVoteMap = new Map<string, number | null>();

  // for (const v of votes ?? []) {
  //   scoreMap.set(v.caption_id, (scoreMap.get(v.caption_id) ?? 0) + v.vote_value);
  //   if (v.profile_id === user.id) userVoteMap.set(v.caption_id, v.vote_value);
  // }

  // // -------- build items --------
  // const items = captionRows.map(c => ({
  //   id: c.id,
  //   content: c.content,
  //   imageUrl: imageMap.get(c.image_id) ?? null,
  //   created: c.created_datetime_utc,
  //   initialScore: scoreMap.get(c.id) ?? 0,
  //   initialUserVote: userVoteMap.get(c.id) ?? null
  // }));

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* minimal header */}
      <Header />

      {/* full screen viewer */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
        {/* @ts-ignore */}
        <CaptionPlayer items={items} datasetKey={items.map(i => i.id).join('-')} />

        {/* --- TEMP DEBUG TOOL (STEP 1 TEST) --- */}
        {/* <div className="bg-white border rounded-xl p-4 shadow">
          <h2 className="font-semibold mb-2">API Test</h2>
          <ImageUploadTester />
        </div> */}
      </main>
    </div>
  );
}