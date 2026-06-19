/**
 * Minimaler, höflicher robots.txt-Prüfer.
 *
 * Vor jedem Abruf einer fremden Seite (Impressum-Scraping) wird geprüft, ob der
 * Pfad laut robots.txt für unseren User-Agent erlaubt ist. Ergebnisse werden pro
 * Origin gecacht. Bei fehlender/unlesbarer robots.txt gilt: erlaubt (Standard).
 *
 * Unterstützt User-agent-Gruppen, Allow/Disallow mit Längen-Präzedenz sowie
 * einfache `*`- und `$`-Wildcards (gängige Praxis, kein vollständiger RFC-9309).
 */

const TTL_MS = 60 * 60 * 1000; // 1 Stunde
const FETCH_TIMEOUT_MS = 6000;

/** Produkt-Token unseres User-Agents (für robots-Group-Matching). */
export const ROBOTS_AGENT = "leadfinder";

interface Rule {
  allow: boolean;
  pattern: string;
}

interface CacheEntry {
  rules: Rule[];
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();

/** Wählt die passende User-agent-Gruppe (spezifisch vor `*`) und gibt deren Regeln. */
export function parseRobots(txt: string, agent: string): Rule[] {
  const lines = txt.split(/\r?\n/);
  const groups: { agents: string[]; rules: Rule[] }[] = [];
  let current: { agents: string[]; rules: Rule[] } | null = null;
  let lastWasAgent = false;

  for (const raw of lines) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((field === "allow" || field === "disallow") && current) {
      current.rules.push({ allow: field === "allow", pattern: value });
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }

  const ours = groups.find((g) => g.agents.some((a) => a !== "*" && agent.includes(a)));
  const star = groups.find((g) => g.agents.includes("*"));
  return (ours || star)?.rules ?? [];
}

/** Prüft, ob ein Pfad gegen ein robots-Muster matcht (mit `*`/`$`-Wildcards). */
function matches(pattern: string, path: string): boolean {
  if (pattern === "") return false; // leeres Disallow = nichts gesperrt
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\\\$$/, "$"); // abschließendes $ als Anker
  try {
    return new RegExp("^" + escaped).test(path);
  } catch {
    return path.startsWith(pattern.replace(/[*$]/g, ""));
  }
}

/** Wertet Regeln gegen einen Pfad aus (längstes Muster gewinnt, Gleichstand → Allow). */
export function isPathAllowed(rules: Rule[], path: string): boolean {
  if (!rules.length) return true;
  let best: { len: number; allow: boolean } | null = null;
  for (const r of rules) {
    if (matches(r.pattern, path)) {
      const len = r.pattern.length;
      if (!best || len > best.len || (len === best.len && r.allow)) {
        best = { len, allow: r.allow };
      }
    }
  }
  return best ? best.allow : true;
}

async function getRules(origin: string, agent: string): Promise<Rule[]> {
  const cached = cache.get(origin);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached.rules;

  let rules: Rule[] = [];
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { "User-Agent": `${ROBOTS_AGENT}/1.0` },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    if (res.ok) rules = parseRobots(await res.text(), agent);
  } catch {
    rules = []; // nicht erreichbar → erlaubt
  }
  cache.set(origin, { rules, fetchedAt: Date.now() });
  return rules;
}

/** True, wenn der Abruf der URL laut robots.txt erlaubt ist. */
export async function isAllowed(url: string, agent: string = ROBOTS_AGENT): Promise<boolean> {
  let origin: string;
  let path: string;
  try {
    const u = new URL(url);
    origin = u.origin;
    path = u.pathname + u.search;
  } catch {
    return true;
  }

  const rules = await getRules(origin, agent.toLowerCase());
  return isPathAllowed(rules, path);
}
