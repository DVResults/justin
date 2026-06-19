# 🎯 Leadfinder – Automotive Lead-Recherche (DE)

Ein professionelles, **legales** Lead-Generierungs-Tool für die Automotive-Branche
(deutschlandweit). Findet **echte** Firmen, **Geschäftsführer**, **Telefon**, **E-Mail**
und **Website** aus öffentlich zugänglichen Quellen – mit Direkt-Buttons (Website öffnen,
Anrufen, E-Mail) und **CSV-/Excel-Export**.

Gebaut mit **Next.js 14** (App Router, TypeScript). **Keine fiktiven Daten** – alle
Ergebnisse stammen aus realen, öffentlichen Quellen.

---

## Datenquellen (alle real & legal)

| Quelle | Liefert | Lizenz / Rechtsgrundlage |
| --- | --- | --- |
| **OpenStreetMap** (Overpass-API) | Reale Betriebe: Name, Website, Telefon, E-Mail, Adresse | ODbL – Namensnennung „© OpenStreetMap-Mitwirkende" |
| **Impressum** der Firmen-Website | Geschäftsführer, Telefon, E-Mail | § 5 DDG (Pflichtangabe, öffentlich) |
| **OpenCorporates** (Handelsregister) | Geschäftsführer, Registernummer, Registerprofil | Öffentliche Registerdaten (API-Token empfohlen) |

## Funktionen

- **Firmen finden (OpenStreetMap):** echte Betriebe nach **Ort/Region** + **Branche**
  (Autohaus, Kfz-Werkstatt, Autoteile, Reifen, Autovermietung, Motorrad). Ergebnisse werden
  nach Lead-Qualität sortiert (Website/Telefon zuerst) und dedupliziert.
- **Register-Suche (OpenCorporates):** Firmen + Geschäftsführer nach Name/Stichwort.
- **Impressum-Anreicherung:** liest § 5 DDG-Pflichtangaben einer Website → Geschäftsführer,
  Telefon, E-Mail. Pro Treffer als Button **„Impressum anreichern"** verfügbar.
- **Register-Anreicherung pro Lead:** Button **„Geschäftsführer (Register)"** ermittelt den
  Geschäftsführer aus dem Handelsregister.
- **Direkt-Buttons** pro Lead: 🌐 Website · 📞 Anrufen (`tel:`) · ✉️ E-Mail (`mailto:`) ·
  🏛️ Registerprofil.
- **CSV-/Excel-Export** (Semikolon-getrennt + BOM, Excel-DE-tauglich) + **Notizen** pro Lead.

## Schnellstart

```bash
npm install
cp .env.example .env.local   # optional: OpenCorporates-Token eintragen
npm run dev
```

Dann <http://localhost:3000> öffnen. Die **Firmen-Suche (OpenStreetMap)** funktioniert ohne
API-Token. Beispiel: Ort „Berlin", Branchen „Autohaus" + „Kfz-Werkstatt".

> **Hinweis zur Netzwerk-Umgebung:** Das Tool ruft externe APIs auf
> (`overpass-api.de`, `nominatim.openstreetmap.org`, `api.opencorporates.com`) sowie die
> Firmen-Websites für das Impressum. Lokal funktioniert das direkt. In einer Sandbox mit
> Egress-Allowlist müssen diese Hosts freigegeben werden.

### Produktion

```bash
npm run build
npm start
```

## Konfiguration (`.env.local`)

| Variable | Beschreibung |
| --- | --- |
| `OPENCORPORATES_API_TOKEN` | Optional. Ohne Token läuft die Registersuche im anonymen Modus mit strengen Rate-Limits. Token: <https://opencorporates.com/api_accounts/new> |
| `DEFAULT_COUNTRY_CODE` | Standard-Land der Registersuche (Default `de`). |
| `OVERPASS_URL` | Optional. Alternativer Overpass-Endpunkt bei Rate-Limits. |

## Architektur

```
app/
  page.tsx               UI (3 Tabs: Firmen-Suche, Register-Suche, Impressum)
  layout.tsx             HTML-Grundgerüst
  globals.css            Styling
  api/leads/route.ts     GET  – Firmen-Suche (OpenStreetMap/Overpass)
  api/register/route.ts  GET  – Registersuche + Einzel-Lookup (OpenCorporates)
  api/enrich/route.ts    POST – Impressum-Scraping einer Website
lib/
  overpass.ts            OpenStreetMap-Suche (Nominatim-Geocoding + Overpass)
  opencorporates.ts      OpenCorporates-Client (Firmen + Officers/Geschäftsführer)
  impressum.ts           Impressum-Scraper (Geschäftsführer, Telefon, E-Mail)
  csv.ts                 CSV-Export (Excel-DE)
  types.ts               Datentypen
components/
  LeadCard.tsx           Darstellung eines Leads inkl. Buttons
```

### Typischer Workflow

1. **Firmen finden:** Ort „Berlin" + Branchen „Autohaus"/„Kfz-Werkstatt" → echte Betriebe
   mit Website/Telefon/Adresse.
2. Pro Treffer **„Impressum anreichern"** → Geschäftsführer & E-Mail von der Website holen
   (alternativ **„Geschäftsführer (Register)"** für Handelsregister-Daten).
3. **CSV exportieren** → Import ins CRM/Tabellen.

## ⚖️ Rechtliche Hinweise (wichtig)

Dieses Tool verarbeitet **ausschließlich öffentlich zugängliche** Pflicht- und
Registerangaben. Trotzdem gilt:

- **DSGVO:** Geschäftsführer-Namen/E-Mails sind personenbezogene Daten. Verarbeitung nur für
  legitime Zwecke (z. B. B2B-Erstkontakt auf Basis berechtigten Interesses, Art. 6 Abs. 1
  lit. f). Informationspflichten (Art. 14) und Widerspruchsrechte beachten.
- **UWG:** Telefon-/E-Mail-Werbung gegenüber Unternehmen nur unter den Voraussetzungen des
  § 7 UWG (mutmaßliche Einwilligung / sachlicher Zusammenhang).
- **Nutzungsbedingungen:** Das Tool nutzt offizielle/offene APIs bzw. liest nur die
  Impressum-Pflichtangaben. Es umgeht keine technischen Schutzmaßnahmen und respektiert
  `robots.txt` (höfliche Abrufe, User-Agent gesetzt). Massen-Scraping einzelner Portale
  gegen deren AGB (z. B. Google Maps, Gelbe Seiten) ist bewusst **nicht** implementiert.
- **OpenStreetMap (ODbL):** Bei Weiterverwendung der OSM-Daten ist die Namensnennung
  „© OpenStreetMap-Mitwirkende" Pflicht (in UI/Export vermerkt). Beachte die
  [OSM-Nutzungsregeln](https://operations.osmfoundation.org/policies/) (faire Abruffrequenz).

Diese Hinweise sind keine Rechtsberatung. Kläre den konkreten Einsatz mit einer
fachkundigen Stelle ab.
