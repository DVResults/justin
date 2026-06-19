"use client";

import type { Lead } from "@/lib/types";
import type { LeadStatus } from "@/lib/store";

interface Props {
  lead: Lead;
  enriching: boolean;
  registerLoading: boolean;
  onEnrich: (lead: Lead) => void;
  onRegister: (lead: Lead) => void;
  onNote: (id: string, note: string) => void;
  /** Suchergebnis: in CRM speichern. */
  onSave?: (lead: Lead) => void;
  saved?: boolean;
  saving?: boolean;
  /** CRM-Modus: Status + Löschen. */
  crm?: boolean;
  status?: LeadStatus;
  onStatusChange?: (id: string, status: LeadStatus) => void;
  onDelete?: (id: string) => void;
}

const SOURCE_LABEL: Record<string, string> = {
  OpenStreetMap: "OSM",
  "Google Places": "Google",
  OpenCorporates: "Register",
  Impressum: "Impressum",
};

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "neu", label: "Neu" },
  { value: "kontaktiert", label: "Kontaktiert" },
  { value: "termin", label: "Termin" },
  { value: "gewonnen", label: "Gewonnen" },
  { value: "verloren", label: "Verloren" },
];

function tagClass(source: string): string {
  return `tag tag-${source.replace(/\s+/g, "")}`;
}

function Field({ label, value, empty }: { label: string; value?: string; empty: string }) {
  return (
    <div className="lead-field">
      <span className="k">{label}</span>
      <span className={`v${value ? "" : " empty"}`}>{value || empty}</span>
    </div>
  );
}

export default function LeadCard({
  lead,
  enriching,
  registerLoading,
  onEnrich,
  onRegister,
  onNote,
  onSave,
  saved,
  saving,
  crm,
  status,
  onStatusChange,
  onDelete,
}: Props) {
  const telHref = lead.phone ? `tel:${lead.phone.replace(/[^\d+]/g, "")}` : undefined;
  const mailHref = lead.email ? `mailto:${lead.email}` : undefined;

  return (
    <div className="lead">
      <div className="lead-top">
        <div>
          <p className="lead-name">{lead.company}</p>
          {(lead.industry || lead.registerNumber) && (
            <div className="lead-sub">
              {[lead.industry, lead.registerNumber && `Reg.-Nr. ${lead.registerNumber}`]
                .filter(Boolean)
                .join(" · ")}
            </div>
          )}
        </div>
        <div className="source-tags">
          {lead.sources.map((s) => (
            <span key={s} className={tagClass(s)}>
              {SOURCE_LABEL[s] || s}
            </span>
          ))}
        </div>
      </div>

      <div className="lead-fields">
        <Field label="Geschäftsführer" value={lead.managingDirector} empty="nicht ermittelt" />
        <Field label="Telefon" value={lead.phone} empty="—" />
        <div className="lead-field">
          <span className="k">E-Mail</span>
          <span className={`v${lead.email ? "" : " empty"}`}>
            {lead.email || "—"}
            {lead.email && lead.emailVerified === true && (
              <span className="mx-badge mx-ok" title="Domain kann E-Mails empfangen (MX/A geprüft)">
                ✓ geprüft
              </span>
            )}
            {lead.email && lead.emailVerified === false && (
              <span className="mx-badge mx-bad" title="Keine empfangsfähige Domain gefunden">
                ⚠ ungeprüft
              </span>
            )}
          </span>
        </div>
        <Field label="Adresse" value={lead.address} empty="—" />
      </div>

      <div className="lead-actions">
        <a
          className="btn btn-primary btn-sm"
          href={lead.website || "#"}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!lead.website}
          onClick={(e) => !lead.website && e.preventDefault()}
          style={!lead.website ? { opacity: 0.5, pointerEvents: "none" } : undefined}
        >
          🌐 Website
        </a>

        <a
          className="btn btn-ghost btn-sm"
          href={telHref || "#"}
          aria-disabled={!telHref}
          style={!telHref ? { opacity: 0.5, pointerEvents: "none" } : undefined}
        >
          📞 Anrufen
        </a>

        <a
          className="btn btn-ghost btn-sm"
          href={mailHref || "#"}
          aria-disabled={!mailHref}
          style={!mailHref ? { opacity: 0.5, pointerEvents: "none" } : undefined}
        >
          ✉️ E-Mail
        </a>

        {lead.profileUrl && (
          <a
            className="btn btn-ghost btn-sm"
            href={lead.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            🏛️ Profil
          </a>
        )}

        {lead.website && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onEnrich(lead)}
            disabled={enriching}
          >
            {enriching ? <span className="spinner dark" /> : "🔍"}
            {enriching ? "Lese Impressum…" : "Impressum"}
          </button>
        )}

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onRegister(lead)}
          disabled={registerLoading}
          title="Geschäftsführer aus dem Handelsregister (OpenCorporates) ermitteln"
        >
          {registerLoading ? <span className="spinner dark" /> : "🏛️"}
          {registerLoading ? "Suche…" : "Geschäftsführer"}
        </button>

        <span className="spacer" />

        {/* Suchergebnis-Modus: Speichern */}
        {!crm && onSave && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onSave(lead)}
            disabled={saving || saved}
            title="Lead ins CRM speichern"
          >
            {saving ? <span className="spinner dark" /> : saved ? "✓" : "💾"}
            {saved ? "Gespeichert" : "Speichern"}
          </button>
        )}

        {/* CRM-Modus: Status + Löschen */}
        {crm && (
          <>
            <select
              className={`status-select status-${status || "neu"}`}
              value={status || "neu"}
              onChange={(e) => onStatusChange?.(lead.id, e.target.value as LeadStatus)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete?.(lead.id)}>
              🗑️ Löschen
            </button>
          </>
        )}
      </div>

      <input
        style={{ marginTop: 12, width: "100%" }}
        placeholder="Notiz (wird gespeichert & exportiert)…"
        defaultValue={lead.notes}
        onBlur={(e) => onNote(lead.id, e.target.value)}
      />
    </div>
  );
}
