// 静的HTML/アセットを public/ から配信する catch-all route handler
// next.config.js の trailingSlash: true により、ディレクトリURLは /xxx/ に正規化される

import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const PUBLIC_DIR = path.join(process.cwd(), "public");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".webp": "image/webp",
  ".ico":  "image/x-icon",
  ".txt":  "text/plain; charset=utf-8",
  ".xml":  "application/xml; charset=utf-8",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
  ".otf":  "font/otf",
};

function contentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] ?? "application/octet-stream";
}

function safeResolve(rel: string): string | null {
  const resolved = path.resolve(PUBLIC_DIR, "." + rel);
  if (!resolved.startsWith(PUBLIC_DIR)) return null;
  return resolved;
}

async function tryFile(p: string): Promise<{ data: Buffer; type: string } | null> {
  try {
    const st = await fs.stat(p);
    if (!st.isFile()) return null;
    const data = await fs.readFile(p);
    return { data, type: contentType(p) };
  } catch {
    return null;
  }
}

function fileResponse(r: { data: Buffer; type: string }): Response {
  return new Response(new Uint8Array(r.data), {
    status: 200,
    headers: { "Content-Type": r.type },
  });
}

export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 候補パスを順に試す
  const candidates: string[] = [];
  const base = safeResolve(pathname);
  if (base) {
    // 1. ファイル直指定（拡張子あり）
    candidates.push(base);
    // 2. ディレクトリの index.html
    candidates.push(path.join(base, "index.html"));
  }

  for (const candidate of candidates) {
    const r = await tryFile(candidate);
    if (r) return fileResponse(r);
  }

  return new Response("Not Found", { status: 404 });
}
