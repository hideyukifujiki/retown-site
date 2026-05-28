// 管理画面認証・パスワード設定
// 本番運用時は環境変数に移行してください（.env.local）

import { cookies } from "next/headers";

export type Region = "tokyo" | "osaka" | "nagoya" | "sapporo" | "fukuoka" | "admin";

export const REGION_LABELS: Record<Region, string> = {
  tokyo:   "東京・神奈川",
  osaka:   "大阪・神戸",
  nagoya:  "名古屋",
  sapporo: "札幌",
  fukuoka: "福岡",
  admin:   "全エリア管理",
};

// パスワード（変更可能）— 本番では process.env.PASSWORD_TOKYO 等を使用
const PASSWORDS: Record<Region, string> = {
  tokyo:   process.env.PASSWORD_TOKYO   ?? "tokyo2026",
  osaka:   process.env.PASSWORD_OSAKA   ?? "osaka2026",
  nagoya:  process.env.PASSWORD_NAGOYA  ?? "nagoya2026",
  sapporo: process.env.PASSWORD_SAPPORO ?? "sapporo2026",
  fukuoka: process.env.PASSWORD_FUKUOKA ?? "fukuoka2026",
  admin:   process.env.PASSWORD_ADMIN   ?? "admin2026",
};

const COOKIE_NAME = "retown_admin";
const SECRET = process.env.AUTH_SECRET ?? "retown-secret-2026-change-me";

// シンプルなHMAC署名（本番はjose等を使用してください）
function sign(payload: string): string {
  // 簡易: payload + ":" + sha256(payload+SECRET) のhex
  const crypto = require("crypto") as typeof import("crypto");
  const hmac = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

function verify(token: string): string | null {
  if (!token || !token.includes(".")) return null;
  const lastDot = token.lastIndexOf(".");
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const crypto = require("crypto") as typeof import("crypto");
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  if (sig !== expected) return null;
  return payload;
}

export function authenticate(region: string, password: string): Region | null {
  const r = region as Region;
  if (!(r in PASSWORDS)) return null;
  if (PASSWORDS[r] !== password) return null;
  return r;
}

export async function setSession(region: Region) {
  const token = sign(`${region}:${Date.now()}`);
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8時間
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getSession(): Promise<Region | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  const region = payload.split(":")[0] as Region;
  if (!(region in PASSWORDS)) return null;
  return region;
}

// 表示権限：admin は全件、他は自エリアのみ
export function canSeeRegion(session: Region, target: string): boolean {
  if (session === "admin") return true;
  return session === target;
}
