/**
 * Lokaler Persistenz-Store (Mini-CRM).
 *
 * Speichert gemerkte Leads als JSON-Datei unter `.data/leads.json` (atomare
 * Schreibvorgänge via temp + rename). Bewusst ohne native Datenbank-Abhängigkeit,
 * damit das Tool auf jeder Maschine sofort läuft. Für Mehrbenutzer-/Server-
 * betrieb kann der Store später gegen SQLite/Postgres getauscht werden – die
 * öffentliche API dieses Moduls bleibt dabei gleich.
 */

import fs from "fs";
import path from "path";
import type { Lead } from "./types";

export type LeadStatus = "neu" | "kontaktiert" | "termin" | "gewonnen" | "verloren";

export const LEAD_STATUSES: LeadStatus[] = [
  "neu",
  "kontaktiert",
  "termin",
  "gewonnen",
  "verloren",
];

export interface SavedLead extends Lead {
  status: LeadStatus;
  savedAt: string;
  updatedAt: string;
  dedupKey: string;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "leads.json");

function ensure(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]", "utf8");
}

function readAll(): SavedLead[] {
  ensure();
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedLead[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: SavedLead[]): void {
  ensure();
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2), "utf8");
  fs.renameSync(tmp, FILE);
}

function hostname(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

/** Eindeutiger Schlüssel zur Dubletten-Erkennung über mehrere Suchläufe hinweg. */
export function dedupKey(l: Lead): string {
  const name = l.company.toLowerCase().replace(/\s+/g, " ").trim();
  const discriminator = hostname(l.website) || (l.address || "").toLowerCase().slice(0, 24).trim();
  return `${name}|${discriminator}`;
}

/** Listet gespeicherte Leads (optional nach Status gefiltert). */
export function listLeads(status?: LeadStatus): SavedLead[] {
  const all = readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return status ? all.filter((l) => l.status === status) : all;
}

/**
 * Speichert einen Lead (Upsert). Existiert bereits ein Lead mit gleichem
 * dedupKey, werden nur leere Felder ergänzt und der Status beibehalten.
 */
export function saveLead(lead: Lead): SavedLead {
  const list = readAll();
  const key = dedupKey(lead);
  const now = new Date().toISOString();
  const existing = list.find((l) => l.dedupKey === key);

  if (existing) {
    const fields: (keyof Lead)[] = [
      "managingDirector",
      "phone",
      "email",
      "website",
      "address",
      "industry",
      "registerNumber",
      "jurisdiction",
      "profileUrl",
    ];
    const target = existing as unknown as Record<string, unknown>;
    for (const f of fields) {
      if (!existing[f] && lead[f]) target[f] = lead[f];
    }
    existing.sources = Array.from(new Set([...existing.sources, ...lead.sources]));
    existing.updatedAt = now;
    writeAll(list);
    return existing;
  }

  const saved: SavedLead = {
    ...lead,
    status: "neu",
    savedAt: now,
    updatedAt: now,
    dedupKey: key,
  };
  list.push(saved);
  writeAll(list);
  return saved;
}

/** Aktualisiert Status/Notiz eines gespeicherten Leads. */
export function updateLead(
  id: string,
  patch: { status?: LeadStatus; notes?: string }
): SavedLead | null {
  const list = readAll();
  const lead = list.find((l) => l.id === id);
  if (!lead) return null;
  if (patch.status) lead.status = patch.status;
  if (patch.notes !== undefined) lead.notes = patch.notes;
  lead.updatedAt = new Date().toISOString();
  writeAll(list);
  return lead;
}

/** Löscht einen gespeicherten Lead. */
export function deleteLead(id: string): boolean {
  const list = readAll();
  const next = list.filter((l) => l.id !== id);
  if (next.length === list.length) return false;
  writeAll(next);
  return true;
}
