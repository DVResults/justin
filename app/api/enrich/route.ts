import { NextRequest, NextResponse } from "next/server";
import { scrapeImpressum, normalizeUrl } from "@/lib/impressum";
import { verifyEmail } from "@/lib/email";
import type { EnrichResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/enrich  { "url": "musterauto.de" }
 * Reichert einen Lead an, indem das (gesetzlich vorgeschriebene) Impressum der
 * Firmen-Website ausgelesen wird: Geschäftsführer, Telefon, E-Mail.
 */
export async function POST(req: NextRequest): Promise<NextResponse<EnrichResponse>> {
  let url = "";
  try {
    const body = await req.json();
    url = normalizeUrl(String(body?.url || ""));
  } catch {
    return NextResponse.json(
      { lead: {}, message: "Ungültige oder fehlende URL." },
      { status: 400 }
    );
  }

  try {
    const { data, impressumUrl } = await scrapeImpressum(url);
    // Gefundene E-Mail per DNS (MX/A) verifizieren.
    if (data.email) {
      data.emailVerified = await verifyEmail(data.email);
    }
    const hasData = data.managingDirector || data.email || data.phone;
    return NextResponse.json({
      lead: data,
      impressumUrl,
      message: hasData
        ? undefined
        : "Impressum geladen, aber keine eindeutigen Kontaktdaten gefunden.",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Impressum konnte nicht geladen werden.";
    return NextResponse.json({ lead: {}, message }, { status: 502 });
  }
}
