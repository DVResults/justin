/**
 * Demo-Datensatz (frei erfunden) für die Automotive-Branche.
 *
 * Diese Daten dienen ausschließlich dazu, die Oberfläche auch ohne Netzwerk-
 * zugriff bzw. ohne API-Token vollständig demonstrieren zu können. Firmen,
 * Personen und Kontaktdaten sind FIKTIV und beziehen sich nicht auf reale
 * Unternehmen oder Personen.
 */

import type { Lead } from "./types";

export const demoLeads: Lead[] = [
  {
    id: "demo:1",
    company: "Nordstern Automobile GmbH",
    managingDirector: "Markus Westphal",
    phone: "+49 40 1234560",
    email: "kontakt@nordstern-automobile.example",
    website: "https://www.nordstern-automobile.example",
    address: "Industriestraße 12, 22045 Hamburg",
    industry: "Automobilhandel",
    registerNumber: "HRB 100001",
    jurisdiction: "de_hh",
    sources: ["Demo"],
  },
  {
    id: "demo:2",
    company: "Rheinland Kfz-Technik AG",
    managingDirector: "Sabine Hofer, Thomas Berg",
    phone: "+49 221 9876540",
    email: "info@rheinland-kfz.example",
    website: "https://www.rheinland-kfz.example",
    address: "Aachener Str. 88, 50674 Köln",
    industry: "Kfz-Werkstatt / Zulieferer",
    registerNumber: "HRB 100002",
    jurisdiction: "de_nw",
    sources: ["Demo"],
  },
  {
    id: "demo:3",
    company: "Südwerk Mobility Solutions GmbH",
    managingDirector: "Dr. Eva Brandt",
    phone: "+49 711 5550120",
    email: "hello@suedwerk-mobility.example",
    website: "https://www.suedwerk-mobility.example",
    address: "Heilbronner Str. 150, 70191 Stuttgart",
    industry: "Automotive Engineering",
    registerNumber: "HRB 100003",
    jurisdiction: "de_bw",
    sources: ["Demo"],
  },
  {
    id: "demo:4",
    company: "Hanseatic E-Drive UG",
    managingDirector: "Jonas Kettler",
    phone: "+49 421 4400230",
    email: "team@hanseatic-edrive.example",
    website: "https://www.hanseatic-edrive.example",
    address: "Am Speicher 3, 28217 Bremen",
    industry: "E-Mobilität",
    registerNumber: "HRB 100004",
    jurisdiction: "de_hb",
    sources: ["Demo"],
  },
  {
    id: "demo:5",
    company: "Bayern Fahrzeugteile GmbH & Co. KG",
    managingDirector: "Andreas Huber",
    phone: "+49 89 2200340",
    email: "vertrieb@bayern-fahrzeugteile.example",
    website: "https://www.bayern-fahrzeugteile.example",
    address: "Landsberger Allee 21, 80339 München",
    industry: "Automobilzulieferer",
    registerNumber: "HRA 100005",
    jurisdiction: "de_by",
    sources: ["Demo"],
  },
  {
    id: "demo:6",
    company: "Ostsee Autohaus Gruppe GmbH",
    managingDirector: "Claudia Reimer",
    phone: "+49 381 7700450",
    email: "service@ostsee-autohaus.example",
    website: "https://www.ostsee-autohaus.example",
    address: "Werftstraße 5, 18057 Rostock",
    industry: "Autohaus",
    registerNumber: "HRB 100006",
    jurisdiction: "de_mv",
    sources: ["Demo"],
  },
];

/** Filtert die Demo-Daten nach einem Stichwort (Firma/Branche). */
export function filterDemoLeads(query: string): Lead[] {
  const q = query.trim().toLowerCase();
  if (!q) return demoLeads;
  return demoLeads.filter(
    (l) =>
      l.company.toLowerCase().includes(q) ||
      (l.industry || "").toLowerCase().includes(q) ||
      // "Automotive"/"Auto"/"Kfz" matchen breit auf die Demo-Branche.
      ["auto", "kfz", "mobil", "fahrzeug", "automotive"].some(
        (kw) => q.includes(kw) && (l.industry || "").toLowerCase().match(/auto|kfz|mobil|fahrzeug/)
      )
  );
}
