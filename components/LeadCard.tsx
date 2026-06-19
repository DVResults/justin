"use client";

import type { Lead } from "@/lib/types";

interface Props {
  lead: Lead;
  enriching: boolean;
  registerLoading: boolean;
  onEnrich: (lead: Lead) => void;
  onRegister: (lead: Lead) => void;
  onNote: (id: string, note: string) => void;
}

function Field({ label, value, empty }: { label: string; value?: string; empty: string }) {
  return (
    <div className="lead-field">
      <span className="k">{label}</span>
      <span className={`v${value ? "" : " empty"}`}>{value || empty}</span>
    </div>
  );
}

const SOURCE_LABEL: Record<string, string> = {
  OpenStreetMap: "OSM",
  OpenCorporates: "Register",
  Impressum: "Impressum",
};

export default function LeadCard({
  lead,
  enriching,
  registerLoading,
  onEnrich,
  onRegister,
  onNote,
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
            <span key={s} className={`tag tag-${s}`}>
              {SOURCE_LABEL[s] || s}
            </span>
          ))}
        </div>
      </div>

      <div className="lead-fields">
        <Field label="Geschäftsführer" value={lead.managingDirector} empty="nicht ermittelt" />
        <Field label="Telefon" value={lead.phone} empty="—" />
        <Field label="E-Mail" value={lead.email} empty="—" />
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
            🏛️ Registerprofil
          </a>
        )}

        {lead.website && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onEnrich(lead)}
            disabled={enriching}
          >
            {enriching ? <span className="spinner dark" /> : "🔍"}
            {enriching ? "Lese Impressum…" : "Impressum anreichern"}
          </button>
        )}

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onRegister(lead)}
          disabled={registerLoading}
          title="Geschäftsführer aus dem Handelsregister (OpenCorporates) ermitteln"
        >
          {registerLoading ? <span className="spinner dark" /> : "🏛️"}
          {registerLoading ? "Suche Register…" : "Geschäftsführer (Register)"}
        </button>
      </div>

      <input
        style={{ marginTop: 12, width: "100%" }}
        placeholder="Notiz (nur lokal, wird mit exportiert)…"
        defaultValue={lead.notes}
        onBlur={(e) => onNote(lead.id, e.target.value)}
      />
    </div>
  );
}
