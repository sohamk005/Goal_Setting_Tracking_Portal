import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
  );
}

// Browser-side singleton — safe to call in Client Components
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Convenience export for use in client-side service files
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
