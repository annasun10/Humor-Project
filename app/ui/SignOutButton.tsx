"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const onSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      onClick={onSignOut}
      className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
    >
      Sign out
    </button>
  );
}
