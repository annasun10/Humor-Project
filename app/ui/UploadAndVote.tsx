// app/ui/UploadAndVote.tsx
"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import CaptionVoting from "./CaptionVoting"; // adjust path if needed
import { useRouter } from "next/navigation";

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export default function UploadAndVote() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [captions, setCaptions] = useState<any[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // HEAD-check with retries
  async function waitForUrl(url: string, attempts = 6, delayMs = 800) {
    for (let i = 0; i < attempts; i++) {
      try {
        const head = await fetch(url, { method: "HEAD" });
        if (head.ok) return true;
      } catch (err) {
        console.warn("HEAD check error (will retry):", err);
      }
      await sleep(delayMs);
    }
    return false;
  }

  async function handleUploadAndGenerate() {
    if (!file) return;
    setStatus("Getting session...");
    setCaptions([]);
    setImageUrl(null);

    const { data: sData } = await supabase.auth.getSession();
    const token = sData?.session?.access_token;
    if (!token) {
      setStatus("Not logged in");
      return;
    }

    try {
      setStatus("Generating presigned URL...");
      const presignedRes = await fetch(
        "https://api.almostcrackd.ai/pipeline/generate-presigned-url",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: file.type })
        }
      );

      if (!presignedRes.ok) {
        const txt = await presignedRes.text();
        throw new Error("Presigned URL error: " + presignedRes.status + " " + txt);
      }

      const presignedJson = await presignedRes.json();
      const presignedUrl = presignedJson.presignedUrl ?? presignedJson.presigned_url ?? presignedJson.uploadUrl ?? presignedJson.presignedURL;
      const cdnUrl = presignedJson.cdnUrl ?? presignedJson.cdn_url ?? presignedJson.cdn;

      // *** LOG presigned and cdn URLs (important) ***
      console.log("presigned response raw:", presignedJson);
      console.log("presignedUrl:", presignedUrl);
      console.log("cdnUrl:", cdnUrl);

      if (!presignedUrl || !cdnUrl) {
        throw new Error("presigned response missing presignedUrl or cdnUrl");
      }

      setStatus("Uploading file...");
      const putRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });

      if (!putRes.ok) {
        const text = await putRes.text();
        throw new Error("Upload PUT failed: " + putRes.status + " " + text);
      }

      setStatus("Registering image...");
      const registerRes = await fetch("https://api.almostcrackd.ai/pipeline/upload-image-from-url", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false })
      });

      if (!registerRes.ok) {
        const text = await registerRes.text();
        throw new Error("Register image failed: " + registerRes.status + " " + text);
      }

      const registerJson = await registerRes.json();
      const imageId = registerJson.imageId ?? registerJson.image_id ?? registerJson.id;
      console.log("registered imageId:", registerJson);

      // Wait for the CDN URL to be reachable (HEAD)
      setStatus("Waiting for image to be available...");
      const ok = await waitForUrl(cdnUrl, 6, 800);
      if (!ok) {
        console.warn("cdnUrl did not respond to HEAD; continuing anyway. cdnUrl:", cdnUrl);
        setStatus("Image may not be instantly available — continuing.");
      } else {
        setStatus("Image reachable, showing preview.");
      }
      setImageUrl(cdnUrl);

      setStatus("Generating captions...");
      const captionRes = await fetch("https://api.almostcrackd.ai/pipeline/generate-captions", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ imageId })
      });

      if (!captionRes.ok) {
        const txt = await captionRes.text();
        throw new Error("Generate captions failed: " + captionRes.status + " " + txt);
      }

      const captionJson = await captionRes.json();
      console.log("generate-captions response:", captionJson);

      // fetch captions from Supabase; log raw response
      setStatus("Fetching generated captions from DB...");
      const { data: captionsFromDb, error } = await supabase
        .from("captions")
        .select("*")
        .eq("image_id", imageId)
        .order("created_datetime_utc", { ascending: false });

      console.log("captionsFromDb raw:", { captionsFromDb, error });

      if (error) throw new Error("Error fetching captions from DB: " + error.message);

      const captionRows = captionsFromDb ?? [];
      if (!captionRows.length) {
        setStatus("No captions found in DB yet. Try refreshing in a moment.");
        setCaptions([]);
        return;
      }

      // get votes
      const captionIds = captionRows.map((c: any) => c.id);
      const { data: votes } = captionIds.length
        ? await supabase
            .from("caption_votes")
            .select("caption_id, vote_value, profile_id")
            .in("caption_id", captionIds)
        : { data: [] };

      const scoreMap = new Map<string, number>();
      const sessionNow = await supabase.auth.getSession();
      const currentUserId = sessionNow.data?.session?.user?.id ?? null;
      const userVoteMap = new Map<string, number | null>();
      for (const v of votes ?? []) {
        scoreMap.set(v.caption_id, (scoreMap.get(v.caption_id) ?? 0) + v.vote_value);
        if (v.profile_id === currentUserId) userVoteMap.set(v.caption_id, v.vote_value);
      }

      // Defensive mapping — try several common field names and log the prepared array
      const prepared = captionRows.map((c: any) => {
        const textField = c.content ?? c.caption ?? c.text ?? c.body ?? c.caption_text ?? "(no text)";
        return {
          id: c.id,
          content: textField,
          initialScore: scoreMap.get(c.id) ?? 0,
          initialUserVote: userVoteMap.get(c.id) ?? null
        };
      });

      console.log("prepared captions to render:", prepared);
      setCaptions(prepared);
      setStatus("Done — vote on the captions below!");

      // refresh the server-side feed (/vote) so new items appear there if desired
      try {
        router.refresh();
      } catch (e) {
        // ignore if not available
      }
    } catch (err: any) {
      console.error("Upload/generate error:", err);
      setStatus("Upload or generate failed — check console: " + (err?.message ?? String(err)));
    }
  }

  return (
    <div className="space-y-4 bg-white p-6 rounded border">
      <h2 className="text-lg font-semibold">Upload an image & vote on generated captions</h2>

      <div>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleUploadAndGenerate}
          className="px-3 py-1 border rounded bg-slate-100 hover:bg-slate-200"
          disabled={!file}
        >
          Upload & Generate Captions
        </button>

        <button
          onClick={() => {
            setFile(null);
            setCaptions([]);
            setStatus("");
            setImageUrl(null);
          }}
          className="px-3 py-1 border rounded"
        >
          Reset
        </button>
      </div>

      {status && <div className="text-sm text-gray-600">{status}</div>}

      {imageUrl && (
        <div className="mt-3 w-full border rounded-lg bg-white p-2">
          <img
            src={imageUrl}
            alt="Uploaded"
            className="w-full max-h-[55vh] object-contain rounded"
            onError={(e) => console.error("Failed to load preview image:", (e.target as HTMLImageElement).src)}
          />
        </div>
      )}

      {captions.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="font-medium">Generated captions — vote below</h3>
          {captions.map((c) => (
            <div key={c.id} className="border rounded p-3 bg-gray-50">
              <div className="mb-2 text-sm text-gray-800">{c.content}</div>
              <CaptionVoting
                captionId={c.id}
                content={c.content}
                initialScore={c.initialScore}
                initialUserVote={c.initialUserVote}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}