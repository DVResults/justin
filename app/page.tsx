"use client";

import { useState } from "react";
import type { Lead, SearchResponse, EnrichResponse } from "@/lib/types";
import { leadsToCsv } from "@/lib/csv";
import LeadCard from "@/components/LeadCard";

type Tab = "osm" | "register" | "impressum";

const CATEGORIES: { key: string; label: string }[] = [
  { key: "autohaus", label: "Autohaus / Händler" },
  { key: "werkstatt", label: "Kfz-Werkstatt" },
  { key: "autoteile", label: "Autoteile" },
  { key: "reifen", label: "Reifenhandel" },
  { key: "autovermietung", label: "Autovermietung" },
  { key: "motorrad", label: "Motorrad" },
];

const REGION_PRESETS = ["Berlin", "München", "Hamburg", "Köln", "Bayern", "Nordrhein-Westfalen"];

export default function Home() {
  const [tab, setTab] = useState<Tab>("osm");

  // OSM-Suche (echte Firmen)
  const [location, setLocation] = useState("Berlin");
  const [cats, setCats] = useState<string[]>(["autohaus", "werkstatt"]);
  const [osmLimit, setOsmLimit] = useState(60);

  // Registersuche (OpenCorporates)
  const [regQuery, setRegQuery] = useState("Automobile");
  const [regCountry, setRegCountry] = useState("de");

  // Impressum-Suche
  const [urls, setUrls] = useState("");

  // Ergebnisse / Status
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"enrich" | "register" | null>(null);

  function toggleCat(key: string) {
    setCats((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  }

  async function runOsmSearch() {
    if (!location.trim()) {
      setMessage("Bitte einen Ort/eine Region angeben.");
      return;
    }
    setLoading(true);
    setMessage(undefined);
    try {
      const params = new URLSearchParams({
        location: location.trim(),
        categories: cats.join(","),
        limit: String(osmLimit),
      });
      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = (await res.json()) as SearchResponse;
      setLeads(data.leads);
      setMessage(data.message);
    } catch {
      setMessage("Netzwerkfehler bei der Suche.");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  async function runRegisterSearch() {
    if (!regQuery.trim()) {
      setMessage("Bitte ein Stichwort eingeben.");
      return;
    }
    setLoading(true);
    setMessage(undefined);
    try {
      const params = new URLSearchParams({ q: regQuery.trim(), country: regCountry });
      const res = await fetch(`/api/register?${params.toString()}`);
      const data = (await res.json()) as SearchResponse;
      setLeads(data.leads);
      setMessage(data.message);
    } catch {
      setMessage("Netzwerkfehler bei der Registersuche.");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  async function runImpressumSearch() {
    const list = urls
      .split(/[\n,;]+/)
      .map((u) => u.trim())
      .filter(Boolean);
    if (!list.length) {
      setMessage("Bitte mindestens eine Website-Adresse eingeben.");
      return;
    }
    setLoading(true);
    setMessage(undefined);

    const collected: Lead[] = [];
    for (const url of list) {
      try {
        const res = await fetch("/api/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = (await res.json()) as EnrichResponse;
        collected.push({
          id: `imp:${url}`,
          company: data.lead.website
            ? new URL(data.lead.website).hostname.replace(/^www\./, "")
            : url,
          managingDirector: data.lead.managingDirector,
          phone: data.lead.phone,
          email: data.lead.email,
          website: data.lead.website || url,
          sources: ["Impressum"],
        });
      } catch {
        collected.push({ id: `imp:${url}`, company: url, website: url, sources: ["Impressum"] });
      }
    }
    setLeads(collected);
    setMessage(`${collected.length} Website(s) verarbeitet.`);
    setLoading(false);
  }

  async function enrichLead(lead: Lead) {
    if (!lead.website) return;
    setBusyId(lead.id);
    setBusyAction("enrich");
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: lead.website }),
      });
      const data = (await res.json()) as EnrichResponse;
      patchLead(lead.id, {
        managingDirector: data.lead.managingDirector,
        phone: data.lead.phone,
        email: data.lead.email,
        website: data.lead.website,
        source: "Impressum",
      });
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  async function registerLookup(lead: Lead) {
    setBusyId(lead.id);
    setBusyAction("register");
    try {
      const params = new URLSearchParams({ name: lead.company, country: "de" });
      const res = await fetch(`/api/register?${params.toString()}`);
      const data = (await res.json()) as SearchResponse;
      const match = data.leads[0];
      if (match) {
        patchLead(lead.id, {
          managingDirector: match.managingDirector,
          registerNumber: match.registerNumber,
          jurisdiction: match.jurisdiction,
          profileUrl: match.profileUrl,
          source: "OpenCorporates",
        });
      } else {
        setMessage(data.message || "Kein Registertreffer gefunden.");
      }
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  function patchLead(
    id: string,
    patch: Partial<Lead> & { source?: Lead["sources"][number] }
  ) {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const { source, ...fields } = patch;
        const merged = { ...l } as unknown as Record<string, unknown>;
        // Nur leere Felder befüllen (vorhandene echte Daten nicht überschreiben).
        for (const [k, v] of Object.entries(fields)) {
          if (v && !merged[k]) merged[k] = v;
        }
        if (source) merged.sources = Array.from(new Set([...l.sources, source]));
        return merged as unknown as Lead;
      })
    );
  }

  function setNote(id: string, note: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notes: note } : l)));
  }

  function exportCsv() {
    const csv = leadsToCsv(leads);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <header className="header">
        <h1>
          🎯 Leadfinder <span className="badge-pro">Automotive · DE</span>
        </h1>
        <p>
          Lead-Recherche aus <strong>echten, öffentlichen Quellen</strong>: reale Firmen aus
          OpenStreetMap (Website, Telefon, E-Mail), Geschäftsführer aus Impressum (§ 5 DDG) &
          Handelsregister (OpenCorporates) – mit Direkt-Buttons und CSV-Export.
        </p>
      </header>

      <div className="panel">
        <div className="tabs">
          <button
            className={`tab ${tab === "osm" ? "active" : ""}`}
            onClick={() => setTab("osm")}
          >
            <strong>1 · Firmen finden</strong>
            <span>Echte Betriebe per Ort + Branche (OpenStreetMap)</span>
          </button>
          <button
            className={`tab ${tab === "register" ? "active" : ""}`}
            onClick={() => setTab("register")}
          >
            <strong>2 · Register-Suche</strong>
            <span>Firmen + Geschäftsführer (Handelsregister)</span>
          </button>
          <button
            className={`tab ${tab === "impressum" ? "active" : ""}`}
            onClick={() => setTab("impressum")}
          >
            <strong>3 · Impressum</strong>
            <span>Daten aus Firmen-Websites lesen</span>
          </button>
        </div>

        {tab === "osm" && (
          <>
            <div className="form-row">
              <div className="field grow">
                <label htmlFor="loc">Ort / Region</label>
                <input
                  id="loc"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="z. B. Berlin, Bayern, Deutschland"
                  onKeyDown={(e) => e.key === "Enter" && runOsmSearch()}
                />
              </div>
              <div className="field">
                <label htmlFor="olimit">Max. Treffer</label>
                <select
                  id="olimit"
                  value={osmLimit}
                  onChange={(e) => setOsmLimit(Number(e.target.value))}
                >
                  {[30, 60, 100, 150].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary" onClick={runOsmSearch} disabled={loading}>
                {loading ? <span className="spinner" /> : "🔎"} Suchen
              </button>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-soft)" }}>
                Branchen
              </label>
              <div className="presets" style={{ marginTop: 8 }}>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    className="chip"
                    style={
                      cats.includes(c.key)
                        ? { background: "var(--primary-soft)", color: "var(--primary-dark)", borderColor: "var(--primary)" }
                        : undefined
                    }
                    onClick={() => toggleCat(c.key)}
                  >
                    {cats.includes(c.key) ? "✓ " : ""}
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="presets" style={{ marginTop: 14 }}>
              <span style={{ fontSize: 13, color: "var(--text-soft)", alignSelf: "center" }}>
                Schnellauswahl Region:
              </span>
              {REGION_PRESETS.map((r) => (
                <button key={r} className="chip" onClick={() => setLocation(r)}>
                  {r}
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "register" && (
          <>
            <div className="form-row">
              <div className="field grow">
                <label htmlFor="rq">Firmenname / Stichwort</label>
                <input
                  id="rq"
                  value={regQuery}
                  onChange={(e) => setRegQuery(e.target.value)}
                  placeholder="z. B. Automobile, Autohaus, GmbH-Name"
                  onKeyDown={(e) => e.key === "Enter" && runRegisterSearch()}
                />
              </div>
              <div className="field">
                <label htmlFor="rc">Land</label>
                <select id="rc" value={regCountry} onChange={(e) => setRegCountry(e.target.value)}>
                  <option value="de">Deutschland</option>
                  <option value="at">Österreich</option>
                  <option value="ch">Schweiz</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={runRegisterSearch} disabled={loading}>
                {loading ? <span className="spinner" /> : "🔎"} Suchen
              </button>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-soft)", marginTop: 10 }}>
              Liefert Geschäftsführer + Registerprofil. Für höhere Rate-Limits einen
              <code> OPENCORPORATES_API_TOKEN</code> in <code>.env.local</code> hinterlegen.
            </p>
          </>
        )}

        {tab === "impressum" && (
          <>
            <div className="field grow" style={{ width: "100%" }}>
              <label htmlFor="urls">Firmen-Websites (eine pro Zeile)</label>
              <textarea
                id="urls"
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder={"musterauto.de\nwww.beispiel-kfz.de\nhttps://autohaus-nord.de"}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary" onClick={runImpressumSearch} disabled={loading}>
                {loading ? <span className="spinner" /> : "🔍"} Impressen auslesen
              </button>
            </div>
          </>
        )}
      </div>

      <div className="notice notice-legal">
        ⚖️{" "}
        <span>
          <strong>Rechtlicher Hinweis:</strong> Es werden ausschließlich öffentlich zugängliche
          Daten verarbeitet (OpenStreetMap/ODbL – „© OpenStreetMap-Mitwirkende"; Impressum-
          Pflichtangaben nach § 5 DDG; öffentliche Registerdaten). Personenbezogene Daten
          unterliegen der DSGVO – nutze sie nur für legitime B2B-Zwecke (berechtigtes Interesse,
          Art. 6 Abs. 1 lit. f), beachte § 7 UWG bei Erstkontakt und respektiere Widersprüche.
        </span>
      </div>

      {message && (
        <div className="notice notice-info">
          ℹ️ <span>{message}</span>
        </div>
      )}

      {leads.length > 0 && (
        <div className="panel">
          <div className="results-head">
            <h2>
              Ergebnisse <span className="count">({leads.length})</span>
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={exportCsv}>
              ⬇️ CSV / Excel exportieren
            </button>
          </div>
          <div className="lead-grid">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                enriching={busyId === lead.id && busyAction === "enrich"}
                registerLoading={busyId === lead.id && busyAction === "register"}
                onEnrich={enrichLead}
                onRegister={registerLookup}
                onNote={setNote}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && leads.length === 0 && (
        <div className="panel">
          <div className="empty-state">
            <div className="big">🔍</div>
            <p>
              Starte eine Suche, um <strong>echte Leads</strong> zu finden. Beispiel: Ort
              „Berlin", Branchen „Autohaus" + „Kfz-Werkstatt" → dann pro Treffer „Impressum
              anreichern" für Geschäftsführer & E-Mail.
            </p>
          </div>
        </div>
      )}

      <p className="footer">
        Leadfinder · Daten: © OpenStreetMap-Mitwirkende (ODbL) · Impressum (§ 5 DDG) ·
        OpenCorporates
      </p>
    </div>
  );
}
