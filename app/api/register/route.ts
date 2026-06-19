import { NextRequest, NextResponse } from "next/server";
import { searchCompanies, lookupRegister } from "@/lib/opencorporates";
import type { SearchResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/register?q=Automobile&country=de&limit=20
 *   → Registersuche (OpenCorporates): Firmen + Geschäftsführer.
 * GET /api/register?name=Muster%20GmbH&country=de
 *   → Einzel-Lookup (Geschäftsführer/Profil) zu einem Firmennamen.
 */
export async function GET(req: NextRequest): Promise<NextResponse<SearchResponse>> {
  const { searchParams } = new URL(req.url);
  const country = (searchParams.get("country") || process.env.DEFAULT_COUNTRY_CODE || "de").trim();
  const token = process.env.OPENCORPORATES_API_TOKEN || undefined;

  // Einzel-Lookup-Modus (Anreicherung eines bestehenden Leads).
  const name = searchParams.get("name");
  if (name) {
    try {
      const match = await lookupRegister(name, { country, token });
      if (!match) {
        return NextResponse.json({ leads: [], demo: false, message: "Kein Registertreffer." });
      }
      return NextResponse.json({
        leads: [
          {
            id: `oc-lookup:${name}`,
            company: match.matchedName,
            managingDirector: match.managingDirector,
            address: match.address,
            registerNumber: match.registerNumber,
            jurisdiction: match.jurisdiction,
            profileUrl: match.profileUrl,
            sources: ["OpenCorporates"],
          },
        ],
        demo: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Register-Lookup fehlgeschlagen.";
      return NextResponse.json({ leads: [], demo: false, message }, { status: 502 });
    }
  }

  // Such-Modus.
  const query = (searchParams.get("q") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit") || 20) || 20, 100);
  if (!query) {
    return NextResponse.json(
      { leads: [], demo: false, message: "Bitte ein Stichwort eingeben." },
      { status: 400 }
    );
  }

  try {
    const leads = await searchCompanies(query, { country, perPage: limit, token });
    return NextResponse.json({
      leads,
      demo: false,
      message: token
        ? leads.length
          ? undefined
          : "Keine Registertreffer."
        : "Hinweis: Ohne OPENCORPORATES_API_TOKEN gelten strenge Rate-Limits.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registersuche fehlgeschlagen.";
    return NextResponse.json({ leads: [], demo: false, message }, { status: 502 });
  }
}
