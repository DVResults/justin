import { NextRequest, NextResponse } from "next/server";
import { searchCompanies } from "@/lib/opencorporates";
import { filterDemoLeads } from "@/lib/mockData";
import type { SearchResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/leads?q=Automotive&country=de&limit=20
 * Sucht Firmen im Handelsregister (OpenCorporates). Fällt bei Fehlern bzw.
 * fehlendem Netzwerk auf Demo-Daten zurück, damit die UI immer funktioniert.
 */
export async function GET(req: NextRequest): Promise<NextResponse<SearchResponse>> {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "Automotive").trim();
  const country = (searchParams.get("country") || process.env.DEFAULT_COUNTRY_CODE || "de").trim();
  const limit = Math.min(Number(searchParams.get("limit") || 20) || 20, 100);
  const token = process.env.OPENCORPORATES_API_TOKEN || undefined;
  const demoParam = searchParams.get("demo") === "1";

  if (demoParam) {
    return NextResponse.json({
      leads: filterDemoLeads(query),
      demo: true,
      message: "Demo-Modus: fiktive Beispieldaten.",
    });
  }

  try {
    const leads = await searchCompanies(query, { country, perPage: limit, token });
    if (!leads.length) {
      return NextResponse.json({
        leads: filterDemoLeads(query),
        demo: true,
        message: "Keine Registertreffer – es werden Demo-Daten angezeigt.",
      });
    }
    return NextResponse.json({
      leads,
      demo: false,
      message: token
        ? undefined
        : "Kein API-Token gesetzt – Suche läuft im anonymen Modus mit Rate-Limits.",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unbekannter Fehler bei der Registersuche.";
    return NextResponse.json({
      leads: filterDemoLeads(query),
      demo: true,
      message: `Registersuche nicht verfügbar (${message}). Es werden Demo-Daten angezeigt.`,
    });
  }
}
