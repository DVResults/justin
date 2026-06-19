/**
 * OpenStreetMap-basierte Firmen-Suche (echte Daten).
 *
 * Quelle: OpenStreetMap via Nominatim (Geocoding) + Overpass-API (POI-Abfrage).
 * Daten stehen unter der ODbL-Lizenz – bei Weiterverwendung ist die Namensnennung
 * „© OpenStreetMap-Mitwirkende" erforderlich (https://www.openstreetmap.org/copyright).
 *
 * Liefert reale Unternehmen inkl. Name, Website, Telefon, E-Mail und Adresse,
 * sofern in OSM erfasst. Geschäftsführer-Namen sind in OSM nicht enthalten und
 * werden über Impressum-/Register-Anreicherung ergänzt.
 */

import type { Lead } from "./types";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OVERPASS = process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter";
const USER_AGENT =
  "Leadfinder/1.0 (legaler Lead-Research; respektiert OSM-Nutzungsregeln)";

/** Verfügbare Branchen-Kategorien (Automotive) → OSM-Tag-Filter. */
export const CATEGORY_FILTERS: Record<string, { label: string; tags: string[] }> = {
  autohaus: { label: "Autohaus / Händler", tags: ["shop=car"] },
  werkstatt: { label: "Kfz-Werkstatt", tags: ["shop=car_repair", "craft=car_repair"] },
  autoteile: { label: "Autoteile", tags: ["shop=car_parts"] },
  reifen: { label: "Reifenhandel", tags: ["shop=tyres"] },
  autovermietung: { label: "Autovermietung", tags: ["amenity=car_rental"] },
  motorrad: { label: "Motorrad", tags: ["shop=motorcycle"] },
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_FILTERS);

interface NominatimResult {
  osm_type: "relation" | "way" | "node";
  osm_id: number;
  boundingbox: [string, string, string, string]; // [south, north, west, east]
  display_name: string;
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface OverpassSearchOptions {
  /** Ort/Region, z. B. "Berlin", "Bayern", "Deutschland". */
  location: string;
  /** Kategorien-Keys aus CATEGORY_FILTERS (leer = alle). */
  categories?: string[];
  /** Max. Anzahl Treffer. */
  limit?: number;
}

/** Geocodet einen Ort via Nominatim und liefert die Overpass-Area-ID + BBox. */
async function geocodeArea(location: string): Promise<{
  areaId?: number;
  bbox?: [number, number, number, number];
  displayName: string;
}> {
  const url = new URL(NOMINATIM);
  url.searchParams.set("q", location);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "de,at,ch");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Geocoding fehlgeschlagen (HTTP ${res.status}).`);
  const data = (await res.json()) as NominatimResult[];
  if (!data.length) throw new Error(`Ort „${location}" nicht gefunden.`);

  const hit = data[0];
  // Overpass-Area-IDs: Relation = 3600000000 + id, Way = 2400000000 + id.
  let areaId: number | undefined;
  if (hit.osm_type === "relation") areaId = 3600000000 + hit.osm_id;
  else if (hit.osm_type === "way") areaId = 2400000000 + hit.osm_id;

  const [south, north, west, east] = hit.boundingbox.map(Number);
  return {
    areaId,
    bbox: [south, west, north, east],
    displayName: hit.display_name,
  };
}

/** Baut die Overpass-QL-Abfrage. */
function buildQuery(
  filters: string[],
  area: { areaId?: number; bbox?: [number, number, number, number] },
  limit: number
): string {
  const scope = area.areaId
    ? `area(${area.areaId})->.a;`
    : ""; // bei fehlender Area über BBox-Filter pro Statement.
  const bbox = area.bbox && !area.areaId ? `(${area.bbox.join(",")})` : "";
  const regionFilter = area.areaId ? "(area.a)" : bbox;

  const statements = filters
    .map((f) => {
      const [key, value] = f.split("=");
      return `  nwr["${key}"="${value}"]["name"]${regionFilter};`;
    })
    .join("\n");

  return `[out:json][timeout:60];
${scope}
(
${statements}
);
out tags center ${limit};`;
}

function tag(tags: Record<string, string>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    if (tags[k]) return tags[k];
  }
  return undefined;
}

function buildAddress(t: Record<string, string>): string | undefined {
  const street = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ");
  const city = [t["addr:postcode"], t["addr:city"]].filter(Boolean).join(" ");
  const full = [street, city].filter(Boolean).join(", ");
  return full || undefined;
}

function categoryLabel(t: Record<string, string>): string | undefined {
  const map: Record<string, string> = {
    car: "Autohaus / Händler",
    car_repair: "Kfz-Werkstatt",
    car_parts: "Autoteile",
    tyres: "Reifenhandel",
    car_rental: "Autovermietung",
    motorcycle: "Motorrad",
  };
  const key = t["shop"] || t["amenity"] || t["craft"];
  return key ? map[key] || key : undefined;
}

function normalizeWebsite(url?: string): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function mapElement(el: OverpassElement): Lead | null {
  const t = el.tags;
  if (!t || !t.name) return null;
  return {
    id: `osm:${el.type}/${el.id}`,
    company: t.name,
    website: normalizeWebsite(tag(t, "website", "contact:website", "url")),
    phone: tag(t, "phone", "contact:phone", "contact:mobile"),
    email: tag(t, "email", "contact:email"),
    address: buildAddress(t),
    industry: categoryLabel(t),
    profileUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    sources: ["OpenStreetMap"],
  };
}

/** Sucht reale Firmen in OpenStreetMap. */
export async function searchOsm(opts: OverpassSearchOptions): Promise<Lead[]> {
  const { location, categories, limit = 60 } = opts;
  const cats = categories?.length ? categories : ALL_CATEGORIES;
  const filters = cats.flatMap((c) => CATEGORY_FILTERS[c]?.tags ?? []);
  if (!filters.length) throw new Error("Keine gültige Kategorie ausgewählt.");

  const area = await geocodeArea(location);
  const query = buildQuery(filters, area, Math.min(limit, 200));

  const res = await fetch(OVERPASS, {
    method: "POST",
    headers: { "User-Agent": USER_AGENT, "Content-Type": "text/plain" },
    body: query,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Overpass-Abfrage fehlgeschlagen (HTTP ${res.status}).`);

  const data = (await res.json()) as { elements?: OverpassElement[] };
  const leads = (data.elements ?? [])
    .map(mapElement)
    .filter((l): l is Lead => l !== null);

  // Deduplizieren (gleiche Firma an mehreren OSM-Objekten) und sortieren:
  // Leads mit Website/Telefon nach oben (höhere Lead-Qualität).
  const seen = new Set<string>();
  const unique = leads.filter((l) => {
    const key = l.company.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => score(b) - score(a));
  return unique;
}

function score(l: Lead): number {
  return (l.website ? 2 : 0) + (l.phone ? 1 : 0) + (l.email ? 1 : 0);
}
