import { describe, it, expect } from "vitest";
import { isValidEmailSyntax } from "../lib/email";

describe("isValidEmailSyntax", () => {
  it("akzeptiert gültige Adressen", () => {
    expect(isValidEmailSyntax("info@example.de")).toBe(true);
    expect(isValidEmailSyntax("a.b-c+x@sub.domain.co.uk")).toBe(true);
  });

  it("lehnt ungültige Adressen ab", () => {
    expect(isValidEmailSyntax("kaputt")).toBe(false);
    expect(isValidEmailSyntax("a@b")).toBe(false);
    expect(isValidEmailSyntax("a@@b.de")).toBe(false);
    expect(isValidEmailSyntax("a b@c.de")).toBe(false);
    expect(isValidEmailSyntax("")).toBe(false);
  });
});
