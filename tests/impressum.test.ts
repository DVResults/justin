import { describe, it, expect } from "vitest";
import { parseImpressumHtml } from "../lib/impressum";

describe("parseImpressumHtml", () => {
  it("extrahiert Geschäftsführer, Telefon und E-Mail aus einem typischen Impressum", () => {
    const html = `<html><body>
      <h1>Impressum</h1>
      <p>Muster Automobile GmbH<br>Industriestraße 12<br>22045 Hamburg</p>
      <p>Vertreten durch den Geschäftsführer: Markus Westphal</p>
      <p>Telefon: +49 40 123456-0</p>
      <p>E-Mail: kontakt(at)muster-automobile.de</p>
      <p>Registergericht: Amtsgericht Hamburg, HRB 100001</p>
    </body></html>`;
    const r = parseImpressumHtml(html);
    expect(r.managingDirector).toBe("Markus Westphal");
    expect(r.phone).toBe("+49 40 123456-0");
    expect(r.email).toBe("kontakt@muster-automobile.de");
  });

  it("bevorzugt mailto- und tel-Links", () => {
    const html = `<html><body>
      <a href="mailto:info@example.de?subject=Hi">schreiben</a>
      <a href="tel:+4930123456">anrufen</a>
      <p>Geschäftsführerin Dr. Eva Brandt</p>
    </body></html>`;
    const r = parseImpressumHtml(html);
    expect(r.email).toBe("info@example.de");
    expect(r.phone).toBe("+4930123456");
    expect(r.managingDirector).toBe("Dr. Eva Brandt");
  });

  it("erkennt mehrere Geschäftsführer", () => {
    const r = parseImpressumHtml("<body><p>Geschäftsführer: Sabine Hofer, Thomas Berg</p></body>");
    expect(r.managingDirector).toBe("Sabine Hofer, Thomas Berg");
  });

  it("deobfuskiert [at]/[dot]-Schreibweisen", () => {
    const r = parseImpressumHtml("<body><p>Mail: info [at] kfz-mueller [dot] de</p></body>");
    expect(r.email).toBe("info@kfz-mueller.de");
  });

  it("liefert undefined, wenn keine Daten vorhanden sind", () => {
    const r = parseImpressumHtml("<body><p>Nichts Relevantes hier.</p></body>");
    expect(r.managingDirector).toBeUndefined();
    expect(r.email).toBeUndefined();
  });

  it("ignoriert Inhalte in script/style", () => {
    const r = parseImpressumHtml(
      "<body><script>var x='geheim@versteckt.de'</script><p>Tel: 0301234567</p></body>"
    );
    expect(r.email).toBeUndefined();
    expect(r.phone).toBe("0301234567");
  });
});
