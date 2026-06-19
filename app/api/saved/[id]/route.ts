import { NextRequest, NextResponse } from "next/server";
import { updateLead, deleteLead, LEAD_STATUSES, type LeadStatus } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PATCH /api/saved/:id { status?, notes? } → Status/Notiz aktualisieren. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  let body: { status?: LeadStatus; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }
  if (body.status && !LEAD_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
  }
  const updated = updateLead(decodeURIComponent(params.id), body);
  if (!updated) return NextResponse.json({ error: "Lead nicht gefunden." }, { status: 404 });
  return NextResponse.json({ lead: updated });
}

/** DELETE /api/saved/:id → Lead entfernen. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const ok = deleteLead(decodeURIComponent(params.id));
  if (!ok) return NextResponse.json({ error: "Lead nicht gefunden." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
