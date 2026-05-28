// /sitemap.xml を動的生成
// public/ 配下の全 *.html ファイルをスキャンしてサイトマップに含める
//
// 生成例：
//   public/index.html              -> https://retown.jp/
//   public/cases.html              -> https://retown.jp/cases.html
//   public/osaka-kobe/index.html   -> https://retown.jp/osaka-kobe/
//   public/guide/tokyo/index.html  -> https://retown.jp/guide/tokyo/

import type { MetadataRoute } from "next";
import { promises as fs } from "fs";
import path from "path";

const BASE_URL = "https://retown.jp";
const PUBLIC_DIR = path.join(process.cwd(), "public");

async function getAllHtmlFiles(dir: string, baseRel = ""): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    // 隠しフォルダ・特殊フォルダは除外
    if (entry.name.startsWith(".")) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = baseRel ? `${baseRel}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const sub = await getAllHtmlFiles(fullPath, relPath);
      files.push(...sub);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(relPath);
    }
  }
  return files;
}

function fileToUrl(rel: string): string {
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) {
    return "/" + rel.replace(/\/index\.html$/, "/");
  }
  return "/" + rel;
}

// URLパターンごとの優先度
function getPriority(urlPath: string): number {
  if (urlPath === "/") return 1.0;
  // 地域TOP
  if (/^\/(osaka-kobe|nagoya|sapporo|fukuoka)\/$/.test(urlPath)) return 0.9;
  // 主要サービスページ
  if (/^\/(kazai|ihin-seiri|tenpo-haigyou|pricing|cases|flow|area|reasons|faq|contact)\.html$/.test(urlPath)) return 0.8;
  // ガイド記事
  if (/^\/guide\//.test(urlPath)) return 0.7;
  // エリアページ
  if (/^\/area-/.test(urlPath) || /\/area-/.test(urlPath)) return 0.6;
  return 0.5;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const files = await getAllHtmlFiles(PUBLIC_DIR);
  const now = new Date();

  return files
    .map((file) => fileToUrl(file))
    .filter((urlPath) => {
      // プライバシーポリシー以外の管理系/sitemap自体は除外
      if (urlPath === "/sitemap.xml") return false;
      return true;
    })
    .sort()
    .map((urlPath) => ({
      url: `${BASE_URL}${urlPath}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: getPriority(urlPath),
    }));
}
