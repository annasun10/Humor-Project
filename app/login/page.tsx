"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const signInWithGoogle = async () => {
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback`; // EXACTLY this
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700">
              Protected route demo
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">
              Sign in to continue
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              You’ll be redirected to <span className="font-medium">/protected</span> after
              authentication.
            </p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <GoogleIcon className="h-5 w-5" />
            Continue with Google
          </button>

          <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600">
            <div className="font-medium text-zinc-800">Debug tip</div>
            <div className="mt-1">
              If login fails, confirm Supabase redirect URL includes{" "}
              <span className="font-mono">/auth/callback</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.4H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.6z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.4 35.1 26.8 36 24 36c-5.3 0-9.8-3.4-11.4-8.1l-6.6 5.1C9.2 39.7 16.1 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.4H42V20H24v8h11.3c-0.8 2.2-2.3 4.1-4 5.4l6.3 5.2C40.9 35.6 44 30.3 44 24c0-1.3-.1-2.7-.4-3.6z"
      />
    </svg>
  );
}
