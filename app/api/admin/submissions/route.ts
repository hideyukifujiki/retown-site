// 管理API: 一覧取得 / 更新 / 削除
import { NextRequest, NextResponse } from "next/server";
import { getSession, canSeeRegion } from "@/lib/auth";
import { readAll, updateById, deleteById } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type");      // quote|partner|all
  const region = url.searchParams.get("region");  // 自分のリージョンのみ
  const status = url.searchParams.get("status");  // new|read|archived

  const all = await readAll();
  const filtered = all.filter(s => {
    if (!canSeeRegion(session, s.region)) return false;
    if (region && region !== "all" && s.region !== region) return false;
    if (type && type !== "all" && s.type !== type) return false;
    if (status === "new" && s.read) return false;
    if (status === "read" && !s.read) return false;
    if (status === "archived" && !s.archived) return false;
    if (!status && s.archived) return false; // デフォルトはアーカイブ除外
    return true;
  });

  return NextResponse.json({ session, count: filtered.length, items: filtered });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  const all = await readAll();
  const target = all.find(s => s.id === id);
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!canSeeRegion(session, target.region)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updated = await updateById(id, {
    read:     typeof body.read === "boolean" ? body.read : target.read,
    archived: typeof body.archived === "boolean" ? body.archived : target.archived,
    notes:    typeof body.notes === "string" ? body.notes : target.notes,
  });
  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session !== "admin") {
    return NextResponse.json({ error: "admin_only" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });
  const ok = await deleteById(id);
  return NextResponse.json({ ok });
}
