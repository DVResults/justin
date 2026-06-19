/**
 * E-Mail-Validierung per DNS.
 *
 * Prüft die Syntax und – wichtiger für die Lead-Qualität – ob die Domain
 * tatsächlich E-Mails empfangen kann (MX-Record, ersatzweise A/AAAA-Record).
 * So lassen sich Tippfehler und tote Domains vor dem CRM-Import aussortieren.
 */

import { resolveMx, resolve4 } from "dns/promises";

const cache = new Map<string, boolean>();

const SYNTAX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Liefert true, wenn die E-Mail syntaktisch gültig ist und die Domain Mail annehmen kann. */
export async function verifyEmail(email: string): Promise<boolean> {
  if (!email || !SYNTAX.test(email)) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  if (cache.has(domain)) return cache.get(domain)!;

  let ok = false;
  try {
    const mx = await resolveMx(domain);
    ok = mx.length > 0;
  } catch {
    ok = false;
  }
  if (!ok) {
    // Kein MX → laut RFC 5321 darf der A-Record als Mail-Ziel dienen.
    try {
      const a = await resolve4(domain);
      ok = a.length > 0;
    } catch {
      ok = false;
    }
  }

  cache.set(domain, ok);
  return ok;
}
