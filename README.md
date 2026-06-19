# 🎯 Leadfinder – Automotive Lead-Recherche (DE)

Ein professionelles, **legales** Lead-Generierungs-Tool für die Automotive-Branche
(deutschlandweit). Findet Firmen, **Geschäftsführer**, **Telefon**, **E-Mail** und
**Website** aus öffentlich zugänglichen Quellen – mit Direkt-Buttons (Website öffnen,
Anrufen, E-Mail) und **CSV-/Excel-Export**.

Gebaut mit **Next.js 14** (App Router, TypeScript).

---

## Funktionen

- **Register-Suche** über die [OpenCorporates](https://opencorporates.com)-API: Firmen +
  Geschäftsführer nach Branche/Stichwort (z. B. „Automotive“) und Land.
- **Impressum-Anreicherung**: liest die gesetzlich vorgeschriebenen Pflichtangaben
  (§ 5 DDG, ehem. § 5 TMG) einer Firmen-Website aus → Geschäftsführer, Telefon, E-Mail.
- **Direkt-Buttons** pro Lead: 🌐 Website · 📞 Anrufen (`tel:`) · ✉️ E-Mail (`mailto:`) ·
  🏛️ Registerprofil.
- **CSV-/Excel-Export** (Semikolon-getrennt + BOM, Excel-DE-tauglich).
- **Notizen** pro Lead (werden mit exportiert).
- **Demo-Modus** mit fiktiven Beispieldaten – die UI funktioniert sofort, auch ohne
  Netzwerk oder API-Token.

## Schnellstart

```bash
npm install
cp .env.example .env.local   # optional: OpenCorporates-Token eintragen
npm run dev
```

Dann <http://localhost:3000> öffnen. Über **„Demo-Daten laden“** kannst du die Oberfläche
sofort ohne API-Token testen.

### Produktion

```bash
npm run build
npm start
```

## Konfiguration (`.env.local`)

| Variable | Beschreibung |
| --- | --- |
| `OPENCORPORATES_API_TOKEN` | Optional. Ohne Token läuft die Suche im anonymen Modus mit strengen Rate-Limits. Token: <https://opencorporates.com/api_accounts/new> |
| `DEFAULT_COUNTRY_CODE` | Standard-Land der Suche (Default `de`). |

## Architektur

```
app/
  page.tsx              UI (Tabs: Register-Suche + Impressum-Anreicherung)
  layout.tsx            HTML-Grundgerüst
  globals.css           Styling
  api/leads/route.ts    GET  – Registersuche (OpenCorporates) mit Demo-Fallback
  api/enrich/route.ts   POST – Impressum-Scraping einer Website
lib/
  opencorporates.ts     OpenCorporates-Client (Firmen + Officers/Geschäftsführer)
  impressum.ts          Impressum-Scraper (Geschäftsführer, Telefon, E-Mail)
  csv.ts                CSV-Export (Excel-DE)
  mockData.ts           Fiktive Demo-Leads
  types.ts              Datentypen
components/
  LeadCard.tsx          Darstellung eines Leads inkl. Buttons
```

### Typischer Workflow

1. **Register-Suche** nach „Automotive“ → Firmen + Geschäftsführer + Registeradresse.
2. Pro Treffer **„Impressum anreichern“** klicken → Telefon & E-Mail von der Website holen.
3. **CSV exportieren** → Import ins CRM/Tabellen.

## ⚖️ Rechtliche Hinweise (wichtig)

Dieses Tool verarbeitet **ausschließlich öffentlich zugängliche** Pflicht- und
Registerangaben. Trotzdem gilt:

- **DSGVO:** Geschäftsführer-Namen/E-Mails sind personenbezogene Daten. Verarbeitung nur für
  legitime Zwecke (z. B. B2B-Erstkontakt auf Basis berechtigten Interesses, Art. 6 Abs. 1
  lit. f). Informationspflichten (Art. 14) und Widerspruchsrechte beachten.
- **UWG:** Telefon-/E-Mail-Werbung gegenüber Unternehmen nur unter den Voraussetzungen des
  § 7 UWG (mutmaßliche Einwilligung / sachlicher Zusammenhang).
- **Nutzungsbedingungen:** Das Tool nutzt offizielle APIs bzw. liest nur die
  Impressum-Pflichtangaben. Es umgeht keine technischen Schutzmaßnahmen und respektiert
  `robots.txt` (höfliche Abrufe, User-Agent gesetzt). Massen-Scraping einzelner Portale
  gegen deren AGB (z. B. Google Maps, Gelbe Seiten) ist bewusst **nicht** implementiert.

Diese Hinweise sind keine Rechtsberatung. Kläre den konkreten Einsatz mit einer
fachkundigen Stelle ab.
