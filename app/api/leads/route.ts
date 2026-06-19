import { NextRequest, NextResponse } from "next/server";
import { searchOsm } from "@/lib/overpass";
import { searchPlaces } from "@/lib/googlePlaces";
import type { SearchResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/leads?location=Berlin&categories=autohaus,werkstatt&limit=60&source=osm
 * Sucht REALE Firmen inkl. Website/Telefon/E-Mail.
 *   source=osm    → OpenStreetMap (kostenlos, Standard)
 *   source=google → Google Places (erfordert GOOGLE_PLACES_API_KEY)
 */
export async function GET(req: NextRequest): Promise<NextResponse<SearchResponse>> {
  const { searchParams } = new URL(req.url);
  const location = (searchParams.get("location") || "").trim();
  const categories = (searchParams.get("categories") || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const limit = Math.min(Number(searchParams.get("limit") || 60) || 60, 200);
  const source = (searchParams.get("source") || "osm").trim();

  if (!location) {
    return NextResponse.json(
      { leads: [], demo: false, message: "Bitte einen Ort/eine Region angeben." },
      { status: 400 }
    );
  }

  try {
    if (source === "google") {
      const key = process.env.GOOGLE_PLACES_API_KEY;
      if (!key) {
        return NextResponse.json(
          {
            leads: [],
            demo: false,
            message:
              "Google Places ist nicht konfiguriert. GOOGLE_PLACES_API_KEY in .env.local hinterlegen.",
          },
          { status: 400 }
        );
      }
      const leads = await searchPlaces({ location, categories, limit, key });
      return NextResponse.json({
        leads,
        demo: false,
        message: leads.length
          ? `${leads.length} reale Firma(en) gefunden · Quelle: Google Places.`
          : "Keine Treffer. Tipp: anderen Ort/Region oder weitere Kategorien wählen.",
      });
    }

    const leads = await searchOsm({ location, categories, limit });
    return NextResponse.json({
      leads,
      demo: false,
      message: leads.length
        ? `${leads.length} reale Firma(en) gefunden · Quelle: © OpenStreetMap-Mitwirkende (ODbL).`
        : "Keine Treffer. Tipp: anderen Ort/Region oder weitere Kategorien wählen.",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unbekannter Fehler bei der Firmen-Suche.";
    return NextResponse.json({ leads: [], demo: false, message }, { status: 502 });
  }
}
