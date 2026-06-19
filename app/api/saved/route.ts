import { NextRequest, NextResponse } from "next/server";
import { listLeads, saveLead, LEAD_STATUSES, type LeadStatus } from "@/lib/store";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/saved?status=neu → Liste gespeicherter Leads. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as LeadStatus | null;
  const filter = status && LEAD_STATUSES.includes(status) ? status : undefined;
  return NextResponse.json({ leads: listLeads(filter) });
}

/** POST /api/saved { ...Lead } → Lead speichern (Upsert mit Dubletten-Erkennung). */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let lead: Lead;
  try {
    lead = (await req.json()) as Lead;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }
  if (!lead?.company || !lead?.id) {
    return NextResponse.json({ error: "Lead benötigt id und company." }, { status: 400 });
  }
  const saved = saveLead({ ...lead, sources: lead.sources?.length ? lead.sources : [] });
  return NextResponse.json({ lead: saved });
}
