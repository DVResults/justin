import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import type { Lead } from "../lib/types";

// Isolierter Datenordner, damit echte CRM-Daten nicht berührt werden.
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "leadfinder-test-"));
process.env.LEADFINDER_DATA_DIR = TMP;

// Dynamischer Import NACH dem Setzen der Env-Variable.
const store = await import("../lib/store");

const base: Lead = {
  id: "osm:node/1",
  company: "Teststraße Automobile GmbH",
  website: "https://test-automobile.de",
  phone: "+49 30 1",
  sources: ["OpenStreetMap"],
};

describe("store (CRM-Persistenz)", () => {
  afterAll(() => {
    fs.rmSync(TMP, { recursive: true, force: true });
  });

  it("bildet einen stabilen dedupKey aus Name + Website-Host", () => {
    expect(store.dedupKey(base)).toBe("teststraße automobile gmbh|test-automobile.de");
  });

  it("speichert einen neuen Lead mit Status 'neu'", () => {
    const saved = store.saveLead(base);
    expect(saved.status).toBe("neu");
    expect(store.listLeads()).toHaveLength(1);
  });

  it("dedupliziert beim erneuten Speichern und ergänzt nur leere Felder", () => {
    const second = store.saveLead({
      ...base,
      id: "imp:other",
      email: "info@test-automobile.de",
      sources: ["Impressum"],
    });
    expect(store.listLeads()).toHaveLength(1); // kein zweiter Eintrag
    expect(second.id).toBe(base.id); // ursprüngliche ID bleibt
    expect(second.email).toBe("info@test-automobile.de"); // leeres Feld ergänzt
    expect(second.sources).toEqual(["OpenStreetMap", "Impressum"]); // Quellen vereint
  });

  it("aktualisiert Status und Notiz", () => {
    const updated = store.updateLead(base.id, { status: "kontaktiert", notes: "Rückruf" });
    expect(updated?.status).toBe("kontaktiert");
    expect(updated?.notes).toBe("Rückruf");
    expect(store.listLeads("kontaktiert")).toHaveLength(1);
    expect(store.listLeads("gewonnen")).toHaveLength(0);
  });

  it("löscht einen Lead", () => {
    expect(store.deleteLead(base.id)).toBe(true);
    expect(store.listLeads()).toHaveLength(0);
    expect(store.deleteLead("nicht-da")).toBe(false);
  });
});
