import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SignOutButton from "@/app/ui/SignOutButton";

export default async function ProtectedPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const email = data.user.email ?? "Signed in";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-zinc-900" />
            <div>
              <div className="text-sm font-semibold leading-5">Gated UI</div>
              <div className="text-xs text-zinc-600">Protected route: /protected</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              Home
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          <Card
            title="You’re authenticated"
            subtitle="Session was created from /auth/callback."
          >
            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs text-zinc-500">Signed in as</div>
              <div className="mt-1 font-mono text-sm">{email}</div>
            </div>
          </Card>

          <Card
            title="Gated content"
            subtitle="Only visible when a user session exists."
          >
            <ul className="mt-4 space-y-2 text-sm text-zinc-700">
              <li className="flex items-start gap-2">
                <Check /> Server-side auth check using <span className="font-mono">@supabase/ssr</span>
              </li>
              <li className="flex items-start gap-2">
                <Check /> Redirects unauthenticated users to <span className="font-mono">/login</span>
              </li>
              <li className="flex items-start gap-2">
                <Check /> OAuth returns to <span className="font-mono">/auth/callback</span> exactly
              </li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="text-base font-semibold">{title}</div>
      <div className="mt-1 text-sm text-zinc-600">{subtitle}</div>
      {children}
    </div>
  );
}

function Check() {
  return (
    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white">
      <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7.7 13.6 4.6 10.5l1.1-1.1 2 2 6-6 1.1 1.1-7.1 7.1z"
        />
      </svg>
    </span>
  );
}
