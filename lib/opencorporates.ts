/**
 * Client für die OpenCorporates-API (v0.4).
 *
 * OpenCorporates aggregiert offizielle Handelsregisterdaten. Die Nutzung der
 * öffentlichen API ist legal; für höhere Rate-Limits wird ein kostenloser/
 * kommerzieller API-Token empfohlen (OPENCORPORATES_API_TOKEN).
 *
 * Doku: https://api.opencorporates.com/documentation/API-Reference
 */

import type { Lead } from "./types";

const BASE = "https://api.opencorporates.com/v0.4";
const USER_AGENT =
  "Leadfinder/1.0 (legaler Lead-Research; Kontakt: betreiber@example.com)";

interface OCAddress {
  street_address?: string;
  locality?: string;
  postal_code?: string;
  country?: string;
}

interface OCCompany {
  name: string;
  company_number: string;
  jurisdiction_code: string;
  registered_address_in_full?: string;
  registered_address?: OCAddress;
  opencorporates_url?: string;
  homepage_url?: string;
  industry_codes?: { industry_code?: { description?: string } }[];
  officers?: { officer?: OCOfficer }[];
}

interface OCOfficer {
  name: string;
  position?: string;
  inactive?: boolean;
}

interface SearchOptions {
  country?: string;
  perPage?: number;
  token?: string;
  /** Wie viele Treffer zusätzlich mit Geschäftsführer-Daten angereichert werden. */
  enrichOfficers?: number;
}

function buildUrl(path: string, params: Record<string, string | undefined>): string {
  const url = new URL(`${BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

async function ocFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    // Keine Caches auf der Serverseite – Daten sollen aktuell sein.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`OpenCorporates-Anfrage fehlgeschlagen (HTTP ${res.status}).`);
  }
  return (await res.json()) as T;
}

/** Extrahiert den/die Geschäftsführer aus einer Officer-Liste. */
function pickManagingDirector(officers?: { officer?: OCOfficer }[]): string | undefined {
  if (!officers?.length) return undefined;
  const active = officers
    .map((o) => o.officer)
    .filter((o): o is OCOfficer => Boolean(o) && !o!.inactive);

  const directorKeywords = ["geschäftsführer", "director", "managing", "inhaber", "vorstand"];
  const directors = active.filter((o) =>
    directorKeywords.some((kw) => (o.position || "").toLowerCase().includes(kw))
  );
  const chosen = (directors.length ? directors : active).slice(0, 3);
  return chosen.length ? chosen.map((o) => o.name).join(", ") : undefined;
}

function mapCompany(c: OCCompany): Lead {
  const industry = c.industry_codes?.find((i) => i.industry_code?.description)?.industry_code
    ?.description;
  return {
    id: `oc:${c.jurisdiction_code}:${c.company_number}`,
    company: c.name,
    managingDirector: pickManagingDirector(c.officers),
    website: c.homepage_url || undefined,
    address: c.registered_address_in_full || undefined,
    industry,
    registerNumber: c.company_number,
    jurisdiction: c.jurisdiction_code,
    profileUrl: c.opencorporates_url || undefined,
    sources: ["OpenCorporates"],
  };
}

/** Holt Detaildaten (inkl. Officers/Geschäftsführer) für eine Firma. */
async function fetchOfficers(lead: Lead, token?: string): Promise<void> {
  if (!lead.jurisdiction || !lead.registerNumber) return;
  try {
    const url = buildUrl(`/companies/${lead.jurisdiction}/${lead.registerNumber}`, {
      api_token: token,
    });
    const data = await ocFetch<{ results?: { company?: OCCompany } }>(url);
    const company = data.results?.company;
    if (company) {
      lead.managingDirector = lead.managingDirector || pickManagingDirector(company.officers);
      lead.website = lead.website || company.homepage_url || undefined;
    }
  } catch {
    // Officer-Anreicherung ist best-effort – Fehler hier sind nicht kritisch.
  }
}

/**
 * Sucht Firmen im Handelsregister (über OpenCorporates).
 * @param query Branche/Stichwort, z. B. "Automotive", "Autohaus", "Kfz".
 */
export async function searchCompanies(query: string, opts: SearchOptions = {}): Promise<Lead[]> {
  const { country = "de", perPage = 20, token, enrichOfficers = 8 } = opts;

  const url = buildUrl("/companies/search", {
    q: query,
    country_code: country,
    per_page: String(Math.min(perPage, 100)),
    order: "score",
    api_token: token,
  });

  const data = await ocFetch<{ results?: { companies?: { company: OCCompany }[] } }>(url);
  const companies = data.results?.companies ?? [];
  const leads = companies.map((c) => mapCompany(c.company));

  // Geschäftsführer für die ersten N Treffer nachladen (Rate-Limit schonen).
  const toEnrich = leads.slice(0, enrichOfficers);
  await Promise.all(toEnrich.map((lead) => fetchOfficers(lead, token)));

  return leads;
}

export interface RegisterMatch {
  managingDirector?: string;
  registerNumber?: string;
  jurisdiction?: string;
  profileUrl?: string;
  address?: string;
  matchedName: string;
}

/**
 * Sucht im Register den besten Treffer zu einem Firmennamen und liefert
 * Geschäftsführer + Registerprofil. Für die Anreicherung einzelner Leads
 * (z. B. eines OSM-Treffers) gedacht.
 */
export async function lookupRegister(
  name: string,
  opts: { country?: string; token?: string } = {}
): Promise<RegisterMatch | null> {
  const { country = "de", token } = opts;
  const url = buildUrl("/companies/search", {
    q: name,
    country_code: country,
    per_page: "1",
    order: "score",
    api_token: token,
  });
  const data = await ocFetch<{ results?: { companies?: { company: OCCompany }[] } }>(url);
  const company = data.results?.companies?.[0]?.company;
  if (!company) return null;

  const lead = mapCompany(company);
  await fetchOfficers(lead, token);
  return {
    managingDirector: lead.managingDirector,
    registerNumber: lead.registerNumber,
    jurisdiction: lead.jurisdiction,
    profileUrl: lead.profileUrl,
    address: lead.address,
    matchedName: company.name,
  };
}
