// 管理画面 ログインページ
import { getSession, REGION_LABELS } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export const metadata = { title: "管理画面ログイン｜リタウン" };

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect("/admin/dashboard");

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#1F3A5F 0%,#0F3D6B 100%)" }}>
      <div style={{ width: "100%", maxWidth: 460, background: "#fff", borderRadius: 16, padding: 40, boxShadow: "0 18px 50px rgba(0,0,0,.25)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: "#F2822C", letterSpacing: ".1em", fontWeight: 700, margin: 0 }}>RETOWN ADMIN</p>
          <h1 style={{ fontSize: 24, margin: "8px 0 0", color: "#0F3D6B" }}>管理画面ログイン</h1>
          <p style={{ margin: "10px 0 0", fontSize: 13, color: "#6B7280" }}>エリアを選択してパスワードを入力してください</p>
        </div>
        <LoginForm />
        <p style={{ marginTop: 22, fontSize: 11.5, color: "#9CA3AF", textAlign: "center", lineHeight: 1.7 }}>
          ※ 各エリアの担当者は該当エリアのパスワード、<br/>本部スタッフは「全エリア管理」パスワードでログインしてください
        </p>
      </div>
    </main>
  );
}
