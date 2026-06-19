/**
 * Impressum-Scraper.
 *
 * Das Impressum ist in Deutschland eine gesetzliche Pflichtangabe (§ 5 DDG /
 * ehem. § 5 TMG) und damit öffentlich zugänglich. Diese Funktion liest
 * ausschließlich diese Pflichtangaben (Geschäftsführer, Telefon, E-Mail) aus.
 *
 * Rechtlicher Hinweis: Auch öffentlich zugängliche personenbezogene Daten
 * unterliegen der DSGVO. Verarbeite die Ergebnisse nur für legitime Zwecke
 * (z. B. B2B-Erstkontakt mit berechtigtem Interesse, Art. 6 Abs. 1 lit. f),
 * informiere Betroffene und respektiere Widersprüche/robots.txt.
 */

import * as cheerio from "cheerio";
import type { Lead } from "./types";
import { isAllowed, ROBOTS_AGENT } from "./robots";

const USER_AGENT =
  "Leadfinder/1.0 (+legaler Impressum-Research; respektiert robots.txt)";
const FETCH_TIMEOUT_MS = 12000;

/** Normalisiert eine Nutzereingabe zu einer gültigen https-URL. */
export function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return new URL(url).toString();
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

/** Findet den Link zum Impressum/zur Kontaktseite auf einer Startseite. */
function findImpressumUrl($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
  const keywords = ["impressum", "imprint", "legal-notice", "legal", "kontakt", "contact"];
  let best: string | undefined;
  let bestScore = -1;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = ($(el).text() || "").toLowerCase();
    const hay = `${href.toLowerCase()} ${text}`;
    const score = keywords.findIndex((kw) => hay.includes(kw));
    // Niedriger Index = relevanteres Keyword (Impressum vor Kontakt).
    const weight = score === -1 ? -1 : keywords.length - score;
    if (weight > bestScore) {
      try {
        best = new URL(href, baseUrl).toString();
        bestScore = weight;
      } catch {
        /* ungültiges href ignorieren */
      }
    }
  });
  return best;
}

/** Wandelt obfuskierte E-Mails (foo(at)bar.de) in normale um und extrahiert sie. */
function extractEmail($: cheerio.CheerioAPI, text: string): string | undefined {
  // 1) mailto-Links bevorzugen.
  let found: string | undefined;
  $("a[href^='mailto:']").each((_, el) => {
    if (found) return;
    const href = $(el).attr("href") || "";
    const addr = href.replace(/^mailto:/i, "").split("?")[0].trim();
    if (addr.includes("@")) found = addr;
  });
  if (found) return found.toLowerCase();

  // 2) Deobfuskierung gängiger Schreibweisen.
  const deob = text
    .replace(/\s*\(\s*at\s*\)\s*/gi, "@")
    .replace(/\s*\[\s*at\s*\]\s*/gi, "@")
    .replace(/\s+at\s+/gi, "@")
    .replace(/\s*\(\s*dot\s*\)\s*/gi, ".")
    .replace(/\s*\[\s*dot\s*\]\s*/gi, ".")
    .replace(/\s+dot\s+/gi, ".");

  const match = deob.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  // Tracking-/Wildcard-Adressen aussortieren.
  if (match && !/sentry|example\.|@2x|\.png|\.jpg/i.test(match[0])) {
    return match[0].toLowerCase();
  }
  return undefined;
}

/** Extrahiert eine Telefonnummer (tel:-Links bevorzugt, dann Regex). */
function extractPhone($: cheerio.CheerioAPI, text: string): string | undefined {
  let found: string | undefined;
  $("a[href^='tel:']").each((_, el) => {
    if (found) return;
    const href = $(el).attr("href") || "";
    const num = href.replace(/^tel:/i, "").trim();
    if (num) found = num;
  });
  if (found) return found;

  // Nummer in der Nähe von Telefon-Labels suchen.
  const labelMatch = text.match(
    /(?:Telefon|Tel\.?|Fon|Phone|Mobil)\s*[:.]?\s*((?:\+49|0)[\d\s/().-]{6,}\d)/i
  );
  if (labelMatch) return labelMatch[1].replace(/\s{2,}/g, " ").trim();

  const generic = text.match(/(?:\+49|0)[\d\s/().-]{8,}\d/);
  return generic ? generic[0].replace(/\s{2,}/g, " ").trim() : undefined;
}

/** Extrahiert den/die Geschäftsführer aus dem Impressum-Text. */
function extractManagingDirector(text: string): string | undefined {
  const labels = [
    "Geschäftsführerin(?:nen)?",
    "Geschäftsführer(?:in)?(?:innen)?",
    "Geschäftsführung",
    "Vertretungsberechtigte[rn]?",
    "Vertreten durch",
    "Inhaber(?:in)?",
    "Vorstand",
  ];
  const re = new RegExp(
    `(?:${labels.join("|")})\\s*[:\\-–]?\\s*([A-ZÄÖÜ][^\\n;|]{2,80})`,
    "i"
  );
  const m = text.match(re);
  if (!m) return undefined;

  let name = m[1].trim();
  // Falls ein Doppelpunkt enthalten ist (z. B. "den Geschäftsführer: Max Mustermann"),
  // nur den Teil nach dem Doppelpunkt verwenden.
  if (name.includes(":")) name = name.split(":").pop()!.trim();
  // Abschneiden an typischen Folgewörtern/Trennern.
  name = name.split(
    /\s{2,}|(?:\b(?:Registergericht|Handelsregister|USt|UID|Sitz|Adresse|Telefon|E-?Mail|Tel\.?)\b)/i
  )[0];
  // Führende Artikel, Anreden und Rollenbezeichnungen entfernen.
  for (let i = 0; i < 3; i++) {
    name = name.replace(
      /^(?:den|die|der|das|dem|durch|Herrn?|Frau|Geschäftsführer(?:in)?|Geschäftsführung|vertretungsberechtigte[rn]?|Inhaber(?:in)?|Vorstand|Vorstände?)\s+/i,
      ""
    );
  }
  name = name.replace(/^[\s:,\-–]+/, "").replace(/[.,;]+\s*$/, "").trim();
  return name.length >= 3 ? name : undefined;
}

/** Sammelt sichtbaren Text (ohne script/style). */
function visibleText($: cheerio.CheerioAPI): string {
  $("script, style, noscript").remove();
  return $("body").text().replace(/ /g, " ").replace(/[ \t]+/g, " ");
}

export interface ImpressumResult {
  data: Partial<Lead>;
  impressumUrl: string;
}

/**
 * Lädt eine Website, findet das Impressum und extrahiert die Pflichtangaben.
 * @param rawUrl Domain oder URL der Firma (z. B. "musterauto.de").
 */
export async function scrapeImpressum(rawUrl: string): Promise<ImpressumResult> {
  const homepage = normalizeUrl(rawUrl);
  const origin = new URL(homepage).origin;

  // robots.txt respektieren, bevor wir die Startseite abrufen.
  if (!(await isAllowed(homepage, ROBOTS_AGENT))) {
    throw new Error("Abruf durch robots.txt untersagt.");
  }

  // Startseite laden und Impressum-Link finden.
  const homeHtml = await fetchHtml(homepage);
  const $home = cheerio.load(homeHtml);
  const impressumUrl = findImpressumUrl($home, homepage) || `${origin}/impressum`;

  // Impressum-Seite laden (Fallback: Startseite). robots.txt erneut prüfen.
  let $: cheerio.CheerioAPI;
  let usedUrl = impressumUrl;
  try {
    if (!(await isAllowed(impressumUrl, ROBOTS_AGENT))) throw new Error("robots-disallow");
    $ = cheerio.load(await fetchHtml(impressumUrl));
  } catch {
    $ = $home;
    usedUrl = homepage;
  }

  const text = visibleText($);

  const data: Partial<Lead> = {
    website: origin,
    managingDirector: extractManagingDirector(text),
    email: extractEmail($, text),
    phone: extractPhone($, text),
    sources: ["Impressum"],
  };

  return { data, impressumUrl: usedUrl };
}
