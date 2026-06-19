import { NextRequest, NextResponse } from "next/server";
import { searchOsm } from "@/lib/overpass";
import type { SearchResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/leads?location=Berlin&categories=autohaus,werkstatt&limit=60
 * Sucht REALE Firmen in OpenStreetMap (Overpass) inkl. Website/Telefon/E-Mail.
 */
export async function GET(req: NextRequest): Promise<NextResponse<SearchResponse>> {
  const { searchParams } = new URL(req.url);
  const location = (searchParams.get("location") || "").trim();
  const categories = (searchParams.get("categories") || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const limit = Math.min(Number(searchParams.get("limit") || 60) || 60, 200);

  if (!location) {
    return NextResponse.json(
      { leads: [], demo: false, message: "Bitte einen Ort/eine Region angeben." },
      { status: 400 }
    );
  }

  try {
    const leads = await searchOsm({ location, categories, limit });
    return NextResponse.json({
      leads,
      demo: false,
      message: leads.length
        ? `${leads.length} reale Firma(en) gefunden · Datenquelle: © OpenStreetMap-Mitwirkende (ODbL).`
        : "Keine Treffer. Tipp: anderen Ort/Region oder weitere Kategorien wählen.",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unbekannter Fehler bei der Firmen-Suche.";
    return NextResponse.json({ leads: [], demo: false, message }, { status: 502 });
  }
}
