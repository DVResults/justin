import { describe, it, expect } from "vitest";
import { mapAndRankOsm, type OverpassElement } from "../lib/overpass";

const ELEMENTS: OverpassElement[] = [
  {
    type: "node",
    id: 1,
    tags: {
      name: "Autohaus Schmidt GmbH",
      shop: "car",
      website: "autohaus-schmidt.de",
      phone: "+49 30 1234567",
      "addr:street": "Hauptstraße",
      "addr:housenumber": "5",
      "addr:postcode": "10115",
      "addr:city": "Berlin",
    },
  },
  {
    type: "way",
    id: 2,
    tags: {
      name: "Kfz Müller",
      shop: "car_repair",
      "contact:website": "www.kfz-mueller.de",
      "contact:email": "info@kfz-mueller.de",
    },
  },
  { type: "node", id: 3, tags: { shop: "car" } }, // ohne Name -> raus
  { type: "node", id: 4, tags: { name: "Autohaus Schmidt GmbH", shop: "car" } }, // Duplikat
  { type: "node", id: 5, tags: { name: "Reifen Becker", shop: "tyres" } }, // ohne Kontakt
];

describe("mapAndRankOsm", () => {
  it("filtert Elemente ohne Namen heraus und dedupliziert", () => {
    const leads = mapAndRankOsm(ELEMENTS);
    expect(leads).toHaveLength(3);
    const names = leads.map((l) => l.company);
    expect(names.filter((n) => n === "Autohaus Schmidt GmbH")).toHaveLength(1);
  });

  it("normalisiert die Website auf https und baut die Adresse", () => {
    const lead = mapAndRankOsm(ELEMENTS).find((l) => l.company === "Autohaus Schmidt GmbH")!;
    expect(lead.website).toBe("https://autohaus-schmidt.de");
    expect(lead.address).toBe("Hauptstraße 5, 10115 Berlin");
    expect(lead.industry).toBe("Autohaus / Händler");
    expect(lead.sources).toEqual(["OpenStreetMap"]);
  });

  it("nutzt contact:* Fallbacks", () => {
    const lead = mapAndRankOsm(ELEMENTS).find((l) => l.company === "Kfz Müller")!;
    expect(lead.website).toBe("https://www.kfz-mueller.de");
    expect(lead.email).toBe("info@kfz-mueller.de");
  });

  it("sortiert Leads mit Website/Telefon nach oben", () => {
    const leads = mapAndRankOsm(ELEMENTS);
    // Reifen Becker (keine Kontaktdaten) muss zuletzt stehen.
    expect(leads[leads.length - 1].company).toBe("Reifen Becker");
  });
});
