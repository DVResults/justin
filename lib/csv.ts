import type { Lead } from "./types";

/** Escaped einen Wert für CSV (RFC 4180). */
function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[";\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Erzeugt eine CSV-Datei aus Leads.
 * Trennzeichen ";" + BOM, damit Excel (DE) die Datei sauber öffnet.
 */
export function leadsToCsv(leads: Lead[]): string {
  const headers = [
    "Firma",
    "Geschäftsführer",
    "Telefon",
    "E-Mail",
    "E-Mail geprüft",
    "Website",
    "Adresse",
    "Branche",
    "Registernummer",
    "Jurisdiktion",
    "Quelle",
    "Registerprofil",
    "Notiz",
  ];

  const rows = leads.map((l) =>
    [
      l.company,
      l.managingDirector,
      l.phone,
      l.email,
      l.email ? (l.emailVerified ? "ja" : "nein") : "",
      l.website,
      l.address,
      l.industry,
      l.registerNumber,
      l.jurisdiction,
      l.sources.join(" / "),
      l.profileUrl,
      l.notes,
    ]
      .map(csvCell)
      .join(";")
  );

  const bom = "﻿";
  return bom + [headers.join(";"), ...rows].join("\r\n");
}
