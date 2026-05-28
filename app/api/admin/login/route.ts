import { NextRequest, NextResponse } from "next/server";
import { authenticate, setSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const region = String(body.region ?? "");
  const password = String(body.password ?? "");

  const ok = authenticate(region, password);
  if (!ok) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }
  await setSession(ok);
  return NextResponse.json({ ok: true, region: ok });
}
