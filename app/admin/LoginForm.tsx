"use client";
import { useState } from "react";

const REGIONS = [
  { value: "tokyo",   label: "東京・神奈川" },
  { value: "osaka",   label: "大阪・神戸" },
  { value: "nagoya",  label: "名古屋" },
  { value: "sapporo", label: "札幌" },
  { value: "fukuoka", label: "福岡" },
  { value: "admin",   label: "全エリア管理" },
];

export default function LoginForm() {
  const [region, setRegion] = useState("tokyo");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, password }),
      });
      if (!res.ok) {
        setError("エリアまたはパスワードが正しくありません");
        setLoading(false);
        return;
      }
      window.location.href = "/admin/dashboard";
    } catch {
      setError("通信エラーが発生しました");
      setLoading(false);
    }
  }

  const baseInput: React.CSSProperties = {
    width: "100%", border: "1.5px solid #E4E9F3", borderRadius: 10,
    padding: "13px 14px", fontSize: 15, fontFamily: "inherit",
    color: "#0F3D6B", background: "#FAFBFD", outline: "none",
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0F3D6B", marginBottom: 6 }}>エリア</label>
        <select value={region} onChange={e => setRegion(e.target.value)} style={baseInput}>
          {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0F3D6B", marginBottom: 6 }}>パスワード</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={baseInput} required autoFocus />
      </div>
      {error && <div style={{ color: "#DC2626", fontSize: 13, background: "#FEF2F2", padding: "10px 14px", borderRadius: 8 }}>{error}</div>}
      <button
        type="submit" disabled={loading}
        style={{
          background: "linear-gradient(135deg,#F2822C,#F5A263)", color: "#fff",
          border: "none", padding: "14px", borderRadius: 10, fontWeight: 800, fontSize: 15.5,
          boxShadow: "0 8px 22px rgba(242,130,44,.35)", marginTop: 6, opacity: loading ? .6 : 1,
        }}
      >{loading ? "ログイン中…" : "ログイン"}</button>
    </form>
  );
}
