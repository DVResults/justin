"use client";

import { useState } from "react";
import type { Lead, SearchResponse, EnrichResponse } from "@/lib/types";
import { leadsToCsv } from "@/lib/csv";
import LeadCard from "@/components/LeadCard";

type Tab = "register" | "impressum";

const PRESETS = ["Automotive", "Autohaus", "Kfz", "Automobil", "Fahrzeugbau", "E-Mobilität"];

export default function Home() {
  const [tab, setTab] = useState<Tab>("register");

  // Registersuche
  const [query, setQuery] = useState("Automotive");
  const [country, setCountry] = useState("de");
  const [limit, setLimit] = useState(20);

  // Impressum-Suche
  const [urls, setUrls] = useState("");

  // Ergebnisse / Status
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [demo, setDemo] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  async function runRegisterSearch(useDemo = false) {
    setLoading(true);
    setMessage(undefined);
    try {
      const params = new URLSearchParams({
        q: query,
        country,
        limit: String(limit),
      });
      if (useDemo) params.set("demo", "1");
      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = (await res.json()) as SearchResponse;
      setLeads(data.leads);
      setDemo(data.demo);
      setMessage(data.message);
    } catch (e) {
      setMessage("Netzwerkfehler bei der Suche.");
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
    setDemo(false);

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
          company: data.lead.website ? new URL(data.lead.website).hostname.replace(/^www\./, "") : url,
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
    setEnrichingId(lead.id);
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: lead.website }),
      });
      const data = (await res.json()) as EnrichResponse;
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id
            ? {
                ...l,
                managingDirector: data.lead.managingDirector || l.managingDirector,
                phone: data.lead.phone || l.phone,
                email: data.lead.email || l.email,
                website: data.lead.website || l.website,
                sources: Array.from(new Set([...l.sources, "Impressum"])) as Lead["sources"],
              }
            : l
        )
      );
    } finally {
      setEnrichingId(null);
    }
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
    a.download = `leads-${query || "export"}-${new Date().toISOString().slice(0, 10)}.csv`;
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
          Legale Lead-Recherche aus öffentlichen Quellen: Handelsregister (OpenCorporates) und
          Impressum-Pflichtangaben (§ 5 DDG). Findet Geschäftsführer, Telefon, E-Mail & Website –
          mit Direkt-Buttons und CSV-Export.
        </p>
      </header>

      <div className="panel">
        <div className="tabs">
          <button
            className={`tab ${tab === "register" ? "active" : ""}`}
            onClick={() => setTab("register")}
          >
            <strong>1 · Register-Suche</strong>
            <span>Firmen + Geschäftsführer nach Branche finden</span>
          </button>
          <button
            className={`tab ${tab === "impressum" ? "active" : ""}`}
            onClick={() => setTab("impressum")}
          >
            <strong>2 · Impressum-Anreicherung</strong>
            <span>Telefon & E-Mail aus Firmen-Websites lesen</span>
          </button>
        </div>

        {tab === "register" ? (
          <>
            <div className="form-row">
              <div className="field grow">
                <label htmlFor="q">Branche / Stichwort</label>
                <input
                  id="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="z. B. Automotive"
                  onKeyDown={(e) => e.key === "Enter" && runRegisterSearch()}
                />
              </div>
              <div className="field">
                <label htmlFor="country">Land</label>
                <select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="de">Deutschland</option>
                  <option value="at">Österreich</option>
                  <option value="ch">Schweiz</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="limit">Max. Treffer</label>
                <select
                  id="limit"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                >
                  {[10, 20, 30, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => runRegisterSearch()}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : "🔎"} Suchen
              </button>
            </div>
            <div className="presets">
              {PRESETS.map((p) => (
                <button key={p} className="chip" onClick={() => setQuery(p)}>
                  {p}
                </button>
              ))}
              <button className="chip" onClick={() => runRegisterSearch(true)}>
                ▶︎ Demo-Daten laden
              </button>
            </div>
          </>
        ) : (
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
        ⚖️ <span>
          <strong>Rechtlicher Hinweis:</strong> Es werden ausschließlich öffentlich zugängliche
          Pflicht- und Registerangaben verarbeitet. Auch diese personenbezogenen Daten unterliegen
          der DSGVO – nutze sie nur für legitime B2B-Zwecke (berechtigtes Interesse, Art. 6 Abs. 1
          lit. f), beachte das UWG bei Erstkontakt und respektiere Widersprüche.
        </span>
      </div>

      {message && (
        <div className="notice notice-info">
          {demo ? "🧪" : "ℹ️"} <span>{message}</span>
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
                enriching={enrichingId === lead.id}
                onEnrich={enrichLead}
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
              Starte eine Suche, um Leads zu finden. Tipp: Klicke auf <strong>„Demo-Daten
              laden“</strong>, um die Oberfläche sofort auszuprobieren.
            </p>
          </div>
        </div>
      )}

      <p className="footer">Leadfinder · legale Recherche aus öffentlichen Quellen</p>
    </div>
  );
}
