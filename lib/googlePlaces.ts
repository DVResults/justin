/**
 * Client für die Google Places API (New) – Text Search.
 *
 * Liefert reale Firmen inkl. Name, Adresse, Telefonnummer und Website mit sehr
 * hoher Abdeckung. Erfordert einen API-Key (GOOGLE_PLACES_API_KEY) und ist nach
 * dem monatlichen Freikontingent kostenpflichtig.
 *
 * Doku: https://developers.google.com/maps/documentation/places/web-service/text-search
 */

import type { Lead } from "./types";
import { CATEGORY_FILTERS, ALL_CATEGORIES } from "./overpass";

const TEXT_SEARCH = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.internationalPhoneNumber",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.primaryTypeDisplayName",
  "places.googleMapsUri",
  "nextPageToken",
].join(",");

interface PlaceText {
  text?: string;
}

interface Place {
  id: string;
  displayName?: PlaceText;
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  primaryTypeDisplayName?: PlaceText;
  googleMapsUri?: string;
}

interface TextSearchResponse {
  places?: Place[];
  nextPageToken?: string;
}

export interface PlacesSearchOptions {
  location: string;
  categories?: string[];
  limit?: number;
  key: string;
}

function mapPlace(p: Place, categoryLabel?: string): Lead | null {
  const name = p.displayName?.text;
  if (!name) return null;
  return {
    id: `gp:${p.id}`,
    company: name,
    website: p.websiteUri,
    phone: p.internationalPhoneNumber || p.nationalPhoneNumber,
    address: p.formattedAddress,
    industry: categoryLabel || p.primaryTypeDisplayName?.text,
    profileUrl: p.googleMapsUri,
    sources: ["Google Places"],
  };
}

async function textSearch(
  query: string,
  key: string,
  pageToken?: string
): Promise<TextSearchResponse> {
  const res = await fetch(TEXT_SEARCH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "de",
      regionCode: "DE",
      ...(pageToken ? { pageToken } : {}),
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google Places-Anfrage fehlgeschlagen (HTTP ${res.status}). ${body.slice(0, 200)}`);
  }
  return (await res.json()) as TextSearchResponse;
}

/** Sucht reale Firmen über Google Places (pro Kategorie eine Text-Suche). */
export async function searchPlaces(opts: PlacesSearchOptions): Promise<Lead[]> {
  const { location, categories, limit = 60, key } = opts;
  if (!key) throw new Error("Kein GOOGLE_PLACES_API_KEY konfiguriert.");
  const cats = categories?.length ? categories : ALL_CATEGORIES;

  const perCategory = Math.max(20, Math.ceil(limit / cats.length));
  const collected: Lead[] = [];
  const seen = new Set<string>();

  for (const cat of cats) {
    const label = CATEGORY_FILTERS[cat]?.label || cat;
    const query = `${label} in ${location}`;
    let pageToken: string | undefined;
    let fetched = 0;

    // Bis zu 3 Seiten à 20 Treffer pro Kategorie (Google-Limit).
    for (let page = 0; page < 3 && fetched < perCategory; page++) {
      const data: TextSearchResponse = await textSearch(query, key, pageToken);
      for (const p of data.places ?? []) {
        const lead = mapPlace(p, label);
        if (!lead) continue;
        const dkey = lead.company.toLowerCase().trim();
        if (seen.has(dkey)) continue;
        seen.add(dkey);
        collected.push(lead);
        fetched++;
      }
      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }
    if (collected.length >= limit) break;
  }

  // Lead-Qualität: Website/Telefon nach oben.
  collected.sort((a, b) => score(b) - score(a));
  return collected.slice(0, limit);
}

function score(l: Lead): number {
  return (l.website ? 2 : 0) + (l.phone ? 1 : 0);
}
