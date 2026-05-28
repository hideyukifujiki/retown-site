// 管理画面ダッシュボード（認証必須）
import { getSession, REGION_LABELS, Region } from "@/lib/auth";
import { redirect } from "next/navigation";
import Dashboard from "./Dashboard";

export const metadata = { title: "管理画面ダッシュボード｜リタウン" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/admin");
  const sessionLabel = REGION_LABELS[session];
  return <Dashboard session={session} sessionLabel={sessionLabel} />;
}
