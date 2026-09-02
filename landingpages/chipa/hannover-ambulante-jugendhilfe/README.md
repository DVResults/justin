# chi.pa Landingpage — Ambulante Jugendhilfe, Landeshauptstadt Hannover

Drei Bloecke, in dieser Reihenfolge in die WordPress-Seite:

1. **Custom HTML** → `BLOCK1-oben.html`
2. **Shortcode** → `[forminator_form id="DEINE-FORM-ID"]`
3. **Custom HTML** → `BLOCK3-unten.html`

---

## Der Counter-Bug ("die Zahlen gehen nicht hoch")

**Symptom:** Unter *Dein neues Team* stehen statt `2010 / 5 / 85+` drei Nullen.

**Ursache:** Im Count-up-Skript in Block 3 fehlen die Backslashes in den regulaeren
Ausdruecken. Aus `\d` (= "eine Ziffer") wurde `d` (= der Buchstabe d):

```js
var m = raw.match(/(d+)/);              // sucht den BUCHSTABEN d
var suffix = raw.replace(/[d.,s]/g,''); // entfernt d, Punkt, Komma, s
```

`"2010"`, `"5"` und `"85+"` enthalten keinen Buchstaben `d` → `m` ist `null` →
`if(!m) return;` bricht ab. Vorher hat das Skript aber schon alle drei Werte auf
`'0'` gesetzt (`el.textContent='0'`). Deshalb bleiben genau drei Nullen stehen.

Backslashes werden beim Kopieren durch Editoren/Slash-Filter gerne verschluckt —
darum benutzt die neue Fassung **gar keine Backslashes mehr**, sondern `[0-9]`.
So kann derselbe Fehler nicht wieder passieren.

**Fix (in `BLOCK3-unten.html` enthalten):**

```js
var m = raw.match(/[0-9]+/);   // Ziffern, ohne Backslash
if(!m){ el.textContent = raw; return; }   // Notfall: echten Wert zeigen
var digits = m[0];
var at     = raw.indexOf(digits);
var prefix = raw.slice(0, at);            // z. B. "" oder ">"
var suffix = raw.slice(at + digits.length); // z. B. "+"
```

Ergebnis: `2010` zaehlt 0 → 2010, `5` zaehlt 0 → 5, `85+` zaehlt `0+` → `85+`.

### Zusaetzlich abgesichert

* **Kein stiller Totalausfall mehr:** schlaegt der Regex-Treffer fehl, wird der
  Originalwert angezeigt statt einer 0.
* **Sicherheitsnetz nach 4 Sekunden:** loest der `IntersectionObserver` nie aus
  (Lazy-Load, Aufruf mit `#bewerben` im Link, Optimierungs-Plugin wie WP Rocket /
  Autoptimize), stehen die Zahlen trotzdem korrekt da.
* **`data-done`-Flag:** verhindert doppeltes Starten der Animation.
* **`font-variant-numeric: tabular-nums`** auf `.stats .n`, damit die Ziffern
  waehrend des Zaehlens nicht springen.
* Fallback fuer Browser ohne `IntersectionObserver`/`requestAnimationFrame`.

### Schnelltest im Browser

Seite oeffnen → F12 → Konsole:

```js
document.querySelectorAll('#lp-top .stats .n').forEach(e=>console.log(e.textContent, e.dataset.n));
```

Erwartet: `2010 2010`, `5 5`, `85+ 85+`. Kommt `0 undefined`, ist noch die alte
Skript-Version auf der Seite (Cache/Plugin-Cache leeren).

---

## Inhaltliche Korrekturen gegenueber der kopierten Muenchen-Seite

Die kopierte Vorlage war noch auf Muenchen getextet, obwohl die Seite unter
`/bewerben-fuer-die-ambulante-jugendhilfe-hannover/` laeuft:

| Stelle | vorher | jetzt |
| --- | --- | --- |
| Badge | „Muenchen Nord · Nord-West · West" | „Landeshauptstadt Hannover" |
| Lead-Text | „…unser Team in Muenchen Nord, Nord-West und West." | „…unser Team in der Landeshauptstadt Hannover." |
| Fact „Einsatzort" | Hannover | LH Hannover |
| Fact „Stundenumfang" | ca. 20–40 h / Woche · flexibel | ca. 20–40 h / Woche · vormittags, nachmittags oder flexibel |
| Subline | Teilzeit oder Vollzeit · flexible Arbeitszeiten | + „in Gleitzeit" |
| Benefits | Kurzliste | vollstaendig: Gratifikation nach 1 Jahr, GVH-Karten, corporate benefits, Sports & Spa Hannover Suedstadt/List, persoenlicher Arbeitsplatz |
| Profil | Bachelor, Master, Diplom | Diplom, Bachelor, Master (Mindestqualifikation lt. Ausschreibung) |
| Hero-Bild | Muenchen-Foto | Platzhalter `HIER-BILD-URL-EINSETZEN.jpg` → neues Motiv einsetzen |

**Hero-Bild:** In Block 1 die Zeile `<img class="herofoto" src="HIER-BILD-URL-EINSETZEN.jpg" …>`
auf die URL des neuen Bildes aus der Mediathek aendern.

**Alternative Bewerbungsstrecke:** Soll statt des Forminator-Formulars direkt das
chipa-org-Bewerbungssystem genutzt werden, in Block 1/Block 3 die drei
`href="#bewerben"` durch den Stellen-Link ersetzen
(`https://www.chipa-org.de/de/jobapplication?...&ck=N4VZT67ECBW43NMT5VM32MN`)
und `target="_blank" rel="noopener"` ergaenzen.

---

## Neues Anzeigenbild (Hero)

Generiert mit Higgsfield **Soul V2** (`text2image_soul_v2`), 2048 × 1152 px (16:9),
Seed `726095`, Style „General", Kosten 0,12 Credits.

Download:
<https://d8j0ntlcm91z4.cloudfront.net/user_3FMOEY2sW2O9UHP9weQoM4ut9qO/hf_20260902_075159_99d59b71-49a0-47d4-8603-0c76b219cbbe.png>

> Bitte zeitnah herunterladen und in die **WordPress-Mediathek** hochladen — die
> CDN-URL ist nicht als dauerhafte Einbindung gedacht. Danach in `BLOCK1-oben.html`
> den Platzhalter `HIER-BILD-URL-EINSETZEN.jpg` durch die Mediathek-URL ersetzen.

Vor dem Upload: auf ca. 1600 px Breite verkleinern und als JPG (Qualitaet ~80)
oder WebP speichern — das Hero-Bild wird ohnehin auf max. 380 px Hoehe beschnitten
(`object-fit:cover; object-position:center 18%`).

**Prompt (zum Nachgenerieren / fuer Varianten):**

```
Warm documentary-style photograph for a German social work job advertisement.
A friendly female social worker in her early thirties, casual smart clothing,
sits at a kitchen table in a modest German apartment talking with a mother and
her teenage son. Open notebook and mugs of tea on the table, plants on the
windowsill, everyday German home interior. Genuine relaxed expressions,
mid-conversation, soft natural window light from the left, shallow depth of
field, 35mm reportage look, natural skin tones, candid and respectful.
No text, no logos, no watermarks.
```

Fuer Social-Ads (Meta/Instagram) denselben Prompt mit `aspect_ratio 4:5` bzw. `1:1`
erneut generieren.
