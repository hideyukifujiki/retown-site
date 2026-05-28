// ストレージ抽象化レイヤー
// - Vercel本番: Upstash Redis を使用（環境変数 UPSTASH_REDIS_REST_URL があれば自動切替）
// - ローカル開発: JSONファイル保存（data/submissions.json）
//
// 保存形式：単一キー "submissions" に Submission[] を JSON で格納
//   - 件数が多くなりすぎると性能影響あり（数千件程度なら問題なし）
//   - 将来的にスケールが必要になったら個別キー + sorted set 方式に移行可

import { promises as fs } from "fs";
import path from "path";

export type SubmissionType = "quote" | "partner";

export type Submission = {
  id: string;
  type: SubmissionType;
  region: string;             // tokyo|osaka|nagoya|sapporo|fukuoka
  createdAt: string;          // ISO8601
  name: string;
  company?: string;
  email: string;
  tel?: string;
  address?: string;
  service?: string;           // 見積：家財一式・遺品整理・店舗閉店
  items?: string[];
  message?: string;
  // partner専用
  kobutsushou?: string;
  years?: string;
  capacity?: string;
  channels?: string[];
  desiredAreas?: string[];
  website?: string;
  // raw全保存（柔軟に）
  raw?: Record<string, unknown>;
  // 管理
  read?: boolean;
  archived?: boolean;
  notes?: string;
};

const KV_KEY = "submissions";
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "submissions.json");

// Upstash Redis が使えるかチェック（環境変数の有無で判定）
// Vercel Marketplaceから Upstash Redis を接続すると以下の環境変数が自動付与される
const USE_REDIS = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// ====== Upstash Redis 実装 ======
async function redisRead(): Promise<Submission[]> {
  const { Redis } = await import("@upstash/redis");
  const redis = Redis.fromEnv();
  const data = await redis.get<Submission[]>(KV_KEY);
  return data ?? [];
}
async function redisWrite(items: Submission[]) {
  const { Redis } = await import("@upstash/redis");
  const redis = Redis.fromEnv();
  await redis.set(KV_KEY, items);
}

// ====== ファイル実装（ローカル開発用） ======
async function fileEnsure() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf-8");
  }
}
async function fileRead(): Promise<Submission[]> {
  await fileEnsure();
  const txt = await fs.readFile(DATA_FILE, "utf-8");
  try { return JSON.parse(txt); } catch { return []; }
}
async function fileWrite(items: Submission[]) {
  await fileEnsure();
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), "utf-8");
}

// ====== 共通インターフェース ======
export async function readAll(): Promise<Submission[]> {
  return USE_REDIS ? redisRead() : fileRead();
}

export async function writeAll(items: Submission[]) {
  return USE_REDIS ? redisWrite(items) : fileWrite(items);
}

export async function append(item: Omit<Submission, "id" | "createdAt">): Promise<Submission> {
  const list = await readAll();
  const id = `${item.type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const fullItem: Submission = {
    ...item,
    id,
    createdAt: new Date().toISOString(),
    read: false,
    archived: false,
  };
  list.unshift(fullItem); // 新着が先頭
  await writeAll(list);
  return fullItem;
}

export async function updateById(id: string, patch: Partial<Submission>): Promise<Submission | null> {
  const list = await readAll();
  const idx = list.findIndex(s => s.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch };
  await writeAll(list);
  return list[idx];
}

export async function deleteById(id: string): Promise<boolean> {
  const list = await readAll();
  const next = list.filter(s => s.id !== id);
  if (next.length === list.length) return false;
  await writeAll(next);
  return true;
}
