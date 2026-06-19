import { describe, it, expect } from "vitest";
import { leadsToCsv } from "../lib/csv";
import type { Lead } from "../lib/types";

const lead: Lead = {
  id: "1",
  company: "Test; GmbH",
  managingDirector: 'Max "Mo" Mustermann',
  phone: "+49 30 1",
  email: "a@b.de",
  emailVerified: true,
  website: "https://b.de",
  sources: ["OpenStreetMap", "Impressum"],
};

describe("leadsToCsv", () => {
  it("schreibt BOM + Header-Zeile", () => {
    const csv = leadsToCsv([]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("Firma;Geschäftsführer;Telefon;E-Mail;E-Mail geprüft;Website");
  });

  it("escaped Semikolons und Anführungszeichen (RFC 4180)", () => {
    const csv = leadsToCsv([lead]);
    expect(csv).toContain('"Test; GmbH"');
    expect(csv).toContain('"Max ""Mo"" Mustermann"');
  });

  it("gibt den Verifizierungsstatus als ja/nein aus", () => {
    expect(leadsToCsv([lead])).toContain(";ja;");
    const unverified = leadsToCsv([{ ...lead, emailVerified: false }]);
    expect(unverified).toContain(";nein;");
  });

  it("lässt die Spalte leer, wenn keine E-Mail vorhanden ist", () => {
    const noMail = leadsToCsv([{ ...lead, email: undefined, emailVerified: undefined }]);
    const dataLine = noMail.split("\r\n")[1];
    // Telefon;<leer-geprüft>;Website -> zwei aufeinanderfolgende Semikolons nach Telefon
    expect(dataLine).toContain("+49 30 1;;");
  });
});
