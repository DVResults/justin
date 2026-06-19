/**
 * Zentrale Datentypen des Leadfinders.
 */

export type LeadSource = "OpenStreetMap" | "Google Places" | "OpenCorporates" | "Impressum";

export interface Lead {
  /** Stabile ID (clientseitig generiert oder aus Registernummer abgeleitet). */
  id: string;
  /** Firmenname. */
  company: string;
  /** Name des/der Geschäftsführer(in) bzw. vertretungsberechtigten Person. */
  managingDirector?: string;
  /** Telefonnummer. */
  phone?: string;
  /** Kontakt-E-Mail. */
  email?: string;
  /** E-Mail-Domain per DNS (MX/A) verifiziert? */
  emailVerified?: boolean;
  /** Website (vollständige URL, https). */
  website?: string;
  /** Geschäftsadresse. */
  address?: string;
  /** Branche / Klassifikation, falls bekannt. */
  industry?: string;
  /** Handelsregisternummer o. Ä. */
  registerNumber?: string;
  /** Jurisdiktion (z. B. de_be für Berlin). */
  jurisdiction?: string;
  /** Link zum öffentlichen Registerprofil (OpenCorporates). */
  profileUrl?: string;
  /** Herkunft der Daten. */
  sources: LeadSource[];
  /** Freitext-Notiz (nur lokal). */
  notes?: string;
}

export interface SearchResponse {
  leads: Lead[];
  /** True, wenn Demo-/Fallback-Daten zurückgegeben wurden. */
  demo: boolean;
  /** Optionale Info-/Warnmeldung für die UI. */
  message?: string;
}

export interface EnrichResponse {
  lead: Partial<Lead>;
  /** Quelle, von der angereichert wurde (geprüfte Impressum-URL). */
  impressumUrl?: string;
  message?: string;
}
