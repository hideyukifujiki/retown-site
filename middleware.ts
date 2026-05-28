// middleware は使わない。配信は app/[[...slug]]/route.ts で実装。
// 何も import せずに空のmiddlewareにしておくと Next.js が「不要」と判断する。
import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [], // 何もマッチさせない（実質無効）
};
