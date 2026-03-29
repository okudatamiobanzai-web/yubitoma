import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 管理画面専用クライアント（LIFFのauthと競合しないよう別ストレージキーを使用）
export function createAdminBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: "supabase-admin-auth",
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}
