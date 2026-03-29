"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    try {
      const { error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      const { data: admin } = await client
        .from("admin_users")
        .select("id, display_name")
        .eq("email", email)
        .single();

      if (!admin) {
        setError("管理者権限がありません");
        setLoading(false);
        return;
      }

      localStorage.setItem("admin_session", JSON.stringify({
        email,
        admin_id: admin.id,
        name: admin.display_name,
        ts: Date.now(),
      }));

      // router.pushではなくlocation.hrefで確実に遷移
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "#faf6f0" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>指とま</h1>
          <p style={{ color: "#888", fontSize: "0.875rem" }}>管理画面</p>
        </div>
        <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1.5rem" }}>ログイン</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem" }}>メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: "100%", padding: "0.625rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.875rem", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem" }}>パスワード</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: "100%", padding: "0.625rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.875rem", boxSizing: "border-box" }} />
            </div>
            {error && <div style={{ color: "red", fontSize: "0.875rem", marginBottom: "1rem", padding: "0.5rem", background: "#fee", borderRadius: "8px" }}>{error}</div>}
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "0.625rem", borderRadius: "8px", background: loading ? "#ccc" : "#c75c2a", color: "white", border: "none", fontSize: "0.875rem", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
