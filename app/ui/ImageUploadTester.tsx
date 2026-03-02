"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

export default function ImageUploadTester() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const [file, setFile] = useState<File | null>(null);
  const [captions, setCaptions] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  async function handleUpload() {
    if (!file) return;

    setStatus("Getting auth...");
    setCaptions([]);

    // get token
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setStatus("Not logged in");
      return;
    }

    try {
      // STEP 1 — get presigned URL
      setStatus("Generating upload URL...");
      const presignedRes = await fetch(
        "https://api.almostcrackd.ai/pipeline/generate-presigned-url",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ contentType: file.type })
        }
      );

      const { presignedUrl, cdnUrl } = await presignedRes.json();
      console.log("CDN URL:", cdnUrl);

      // STEP 2 — upload image to storage
      setStatus("Uploading image...");
      await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });

      // STEP 3 — register image
      setStatus("Registering image...");
      const registerRes = await fetch(
        "https://api.almostcrackd.ai/pipeline/upload-image-from-url",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            imageUrl: cdnUrl,
            isCommonUse: false
          })
        }
      );

      const { imageId } = await registerRes.json();

      // STEP 4 — generate captions
      setStatus("Generating captions...");
      const captionRes = await fetch(
        "https://api.almostcrackd.ai/pipeline/generate-captions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ imageId })
        }
      );

      const captionData = await captionRes.json();

      setCaptions(captionData);
      setStatus("Done!");
    } catch (err) {
      console.error(err);
      setStatus("Something failed — check console");
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <button
        onClick={handleUpload}
        className="px-3 py-1 border rounded bg-slate-100 hover:bg-slate-200"
      >
        Upload & Generate Captions
      </button>

      <p className="text-sm text-gray-600">{status}</p>

      {captions.length > 0 && (
        <div className="mt-2 border rounded p-2 bg-white">
          <h3 className="font-semibold mb-2">Generated Captions</h3>
          {captions.map((c: any) => (
            <p key={c.id}>• {c.content}</p>
          ))}
        </div>
      )}
    </div>
  );
}