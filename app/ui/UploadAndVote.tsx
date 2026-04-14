"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import CaptionVoting from "./CaptionVoting";
import { useRouter } from "next/navigation";

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export default function UploadAndVote() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [captions, setCaptions] = useState<any[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  async function waitForUrl(url: string, attempts = 6, delayMs = 800) {
    for (let i = 0; i < attempts; i++) {
      try {
        const head = await fetch(url, { method: "HEAD" });
        if (head.ok) return true;
      } catch (err) {
        console.warn("HEAD check error:", err);
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
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ contentType: file.type }),
        }
      );

      if (!presignedRes.ok) {
        throw new Error(await presignedRes.text());
      }

      const presignedJson = await presignedRes.json();
      const presignedUrl =
        presignedJson.presignedUrl ??
        presignedJson.uploadUrl ??
        presignedJson.presignedURL;

      const cdnUrl =
        presignedJson.cdnUrl ??
        presignedJson.cdn_url ??
        presignedJson.cdn;

      if (!presignedUrl || !cdnUrl) {
        throw new Error("Missing upload URLs");
      }

      setStatus("Uploading file...");
      const putRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error(await putRes.text());
      }

      setStatus("Registering image...");
      const registerRes = await fetch(
        "https://api.almostcrackd.ai/pipeline/upload-image-from-url",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
        }
      );

      const registerJson = await registerRes.json();
      const imageId =
        registerJson.imageId ??
        registerJson.image_id ??
        registerJson.id;

      setStatus("Waiting for image...");
      await waitForUrl(cdnUrl);
      setImageUrl(cdnUrl);

      setStatus("Generating captions...");
      await fetch(
        "https://api.almostcrackd.ai/pipeline/generate-captions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageId }),
        }
      );

      setStatus("Fetching captions...");
      const { data: captionsFromDb } = await supabase
        .from("captions")
        .select("*")
        .eq("image_id", imageId)
        .order("created_datetime_utc", { ascending: false });

      const captionRows = captionsFromDb ?? [];

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
        scoreMap.set(
          v.caption_id,
          (scoreMap.get(v.caption_id) ?? 0) + v.vote_value
        );
        if (v.profile_id === currentUserId) {
          userVoteMap.set(v.caption_id, v.vote_value);
        }
      }

      const prepared = captionRows.map((c: any) => ({
        id: c.id,
        content:
          c.content ?? c.caption ?? c.text ?? "(no text)",
        initialScore: scoreMap.get(c.id) ?? 0,
        initialUserVote: userVoteMap.get(c.id) ?? null,
      }));

      setCaptions(prepared);
      setStatus("Done — vote below!");

      router.refresh();
    } catch (err: any) {
      console.error(err);
      setStatus("Upload failed: " + err.message);
    }
  }

  return (
    <div className="space-y-4 bg-white p-6 rounded border">
      <h2 className="text-lg font-semibold">
        Upload an image & vote on generated captions
      </h2>

      {/* ✅ NEW CLEAN FILE UPLOAD */}
      <div className="flex flex-col gap-3 items-start">
        <label
          htmlFor="file-upload"
          className="inline-flex cursor-pointer px-4 py-2 border rounded bg-slate-100 hover:bg-slate-200"
        >
          {file ? "Change Image" : "Choose Image"}
        </label>

        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={(e) =>
            setFile(e.target.files?.[0] ?? null)
          }
          style={{ display: "none" }}
        />

        {file && (
          <div className="text-sm text-gray-600">
            Selected: {file.name}
          </div>
        )}
      </div>

      {/* BUTTONS */}
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

      {status && (
        <div className="text-sm text-gray-600">{status}</div>
      )}

      {imageUrl && (
        <div className="mt-3 w-full border rounded-lg bg-white p-2">
          <img
            src={imageUrl}
            alt="Uploaded"
            className="w-full max-h-[55vh] object-contain rounded"
          />
        </div>
      )}

      {captions.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="font-medium">
            Generated captions — vote below
          </h3>
          {captions.map((c) => (
            <div
              key={c.id}
              className="border rounded p-3 bg-gray-50"
            >
              <div className="mb-2 text-sm text-gray-800">
                {c.content}
              </div>
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