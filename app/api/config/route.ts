import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/config
 * Meldet der UI, welche optionalen Provider konfiguriert sind (ohne Secrets
 * preiszugeben), damit nicht verfügbare Optionen ausgegraut werden können.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    googlePlaces: Boolean(process.env.GOOGLE_PLACES_API_KEY),
    openCorporates: Boolean(process.env.OPENCORPORATES_API_TOKEN),
  });
}
