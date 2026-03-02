// app/upload/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SignOutButton from "@/app/ui/SignOutButton";
import UploadAndVote from "@/app/ui/UploadAndVote";
import Header from "@/app/ui/Header";

export default async function UploadPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Header />

      <main className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* client uploader */}
          {/* @ts-ignore */}
          <UploadAndVote />
        </div>
      </main>
    </div>
  );
}