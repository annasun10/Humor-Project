import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies(); // <-- IMPORTANT in newer Next.js

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // In route handlers this works; in some server component contexts it may not.
            try {
              cookieStore.set(name, value, options);
            } catch {
              // ignore if not allowed in this context
            }
          });
        },
      },
    }
  );
}
