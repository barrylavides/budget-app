import { supabase } from "./supabase";

/**
 * DEV-ONLY auto sign-in.
 *
 * Every table is RLS-gated through `user_household_ids()`, which is derived from
 * `auth.uid()`. Real authentication (Google OAuth) arrives in issue #11; until
 * then, tickets #3–#10 need an authenticated session locally or every query
 * comes back empty. This signs in the seeded dev user (see supabase/seed.sql)
 * when running the Vite dev server, so seed data is actually visible.
 *
 * It is a no-op in production builds. Delete this module (and its call in
 * main.tsx) once issue #11 wires real auth.
 */
const DEV_EMAIL = (import.meta.env.VITE_DEV_USER_EMAIL as string) || "dev@familybudget.local";
const DEV_PASSWORD = (import.meta.env.VITE_DEV_USER_PASSWORD as string) || "devpass123456";

export async function ensureDevSession(): Promise<void> {
  if (!import.meta.env.DEV) return;
  if (import.meta.env.VITE_DISABLE_DEV_AUTOLOGIN === "true") return;

  const { data } = await supabase.auth.getSession();
  if (data.session) return;

  const { error } = await supabase.auth.signInWithPassword({
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
  });
  if (error) {
    // Surface loudly in the console — a failed dev sign-in means RLS will hide
    // all data, which would otherwise look like "no data" rather than an error.
    console.error("[devAuth] dev sign-in failed — seed data will be hidden by RLS:", error.message);
  }
}
