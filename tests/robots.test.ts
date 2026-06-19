import { describe, it, expect } from "vitest";
import { parseRobots, isPathAllowed } from "../lib/robots";

const ROBOTS = `User-agent: *
Disallow: /admin
Disallow: /private/

User-agent: leadfinder
Disallow: /no-bots
Allow: /no-bots/impressum`;

describe("robots.txt parsing & evaluation", () => {
  it("wählt die spezifische User-agent-Gruppe", () => {
    const rules = parseRobots(ROBOTS, "leadfinder");
    expect(isPathAllowed(rules, "/impressum")).toBe(true);
    expect(isPathAllowed(rules, "/no-bots")).toBe(false);
  });

  it("gibt Allow bei längerem Muster Vorrang (Längen-Präzedenz)", () => {
    const rules = parseRobots(ROBOTS, "leadfinder");
    expect(isPathAllowed(rules, "/no-bots/impressum")).toBe(true);
  });

  it("fällt für unbekannte Bots auf die *-Gruppe zurück", () => {
    const rules = parseRobots(ROBOTS, "otherbot");
    expect(isPathAllowed(rules, "/admin")).toBe(false);
    expect(isPathAllowed(rules, "/private/x")).toBe(false);
    expect(isPathAllowed(rules, "/kontakt")).toBe(true);
  });

  it("erlaubt alles bei leerer robots.txt", () => {
    expect(isPathAllowed(parseRobots("", "leadfinder"), "/irgendwas")).toBe(true);
  });

  it("behandelt leeres Disallow als 'alles erlaubt'", () => {
    const rules = parseRobots("User-agent: *\nDisallow:", "leadfinder");
    expect(isPathAllowed(rules, "/foo")).toBe(true);
  });

  it("unterstützt * und $ Wildcards", () => {
    const rules = parseRobots("User-agent: *\nDisallow: /*.pdf$", "leadfinder");
    expect(isPathAllowed(rules, "/datei.pdf")).toBe(false);
    expect(isPathAllowed(rules, "/datei.pdf?x=1")).toBe(true);
    expect(isPathAllowed(rules, "/seite.html")).toBe(true);
  });
});
