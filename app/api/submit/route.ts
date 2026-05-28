// フォーム送信受付API
// POST /api/submit
// body: { type: "quote" | "partner", region: "tokyo|osaka|...", ...formdata }

import { NextRequest, NextResponse } from "next/server";
import { append, SubmissionType } from "@/lib/storage";

const VALID_REGIONS = ["tokyo", "osaka", "nagoya", "sapporo", "fukuoka"];
const VALID_TYPES: SubmissionType[] = ["quote", "partner"];

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const type = body.type as SubmissionType;
  const region = body.region as string;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }
  if (!VALID_REGIONS.includes(region)) {
    return NextResponse.json({ error: "invalid_region" }, { status: 400 });
  }
  if (!body.name || !body.email) {
    return NextResponse.json({ error: "name_email_required" }, { status: 400 });
  }

  const saved = await append({
    type,
    region,
    name: String(body.name).slice(0, 100),
    email: String(body.email).slice(0, 200),
    tel: body.tel ? String(body.tel).slice(0, 30) : undefined,
    company: body.company ? String(body.company).slice(0, 200) : undefined,
    address: body.address ? String(body.address).slice(0, 300) : undefined,
    service: body.service ? String(body.service).slice(0, 100) : undefined,
    items: Array.isArray(body.items) ? body.items.map(String).slice(0, 30) : undefined,
    message: body.message ? String(body.message).slice(0, 4000) : undefined,
    kobutsushou: body.kobutsushou ? String(body.kobutsushou).slice(0, 80) : undefined,
    years: body.years ? String(body.years).slice(0, 30) : undefined,
    capacity: body.capacity ? String(body.capacity).slice(0, 30) : undefined,
    channels: Array.isArray(body.channels) ? body.channels.map(String).slice(0, 10) : undefined,
    desiredAreas: Array.isArray(body.desiredAreas) ? body.desiredAreas.map(String).slice(0, 20) : undefined,
    website: body.website ? String(body.website).slice(0, 300) : undefined,
    raw: body,
  });

  return NextResponse.json({ ok: true, id: saved.id }, {
    status: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
