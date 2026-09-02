# chi.pa Stellenanzeige Hannover — Social-Creative 1080 × 1080

`hannover-1080.html` ist die Anzeige im Stil der Aichach-Friedberg-Vorlage,
inhaltlich auf die Hannover-Stelle umgeschrieben. Schriften (Montserrat +
Source Sans 3) sind **in der Datei eingebettet** — sie sieht offline und auf
jedem Rechner identisch aus, ohne Internet oder Font-Installation.

`hannover-1080-vorschau.png` ist der aktuelle Stand **ohne Foto**.

## Foto einsetzen

1. Freigestelltes Portrait als **PNG mit transparentem Hintergrund** speichern,
   `person.png` nennen und **neben die HTML-Datei** legen.
   Am einfachsten: die freigestellte Kollegin aus dem Aichach-Friedberg-Motiv
   wiederverwenden — dann bleibt die Anzeigenserie visuell konsistent.
2. HTML-Datei im Browser öffnen. Fehlt `person.png`, blendet sich das Bild
   automatisch aus und das Layout bleibt heil.
3. Höhe/Position bei Bedarf in der CSS-Regel `.person` anpassen
   (`height:592px; right:-14px; bottom:0`).

Die Textspalte ist auf 626 px begrenzt, die rechte Seite bleibt also frei
für das Foto — die Aufzählungen laufen nie darunter.

## Als PNG exportieren

Im Browser öffnen → Rechtsklick auf die Grafik ist nicht nötig, stattdessen:

* **Chrome/Edge:** F12 → Strg+Shift+P → „Capture node screenshot", vorher das
  `<div class="ad">` im Elements-Panel auswählen. Ergibt exakt 1080 × 1080 px.
* **Alternativ:** Drucken → „Als PDF speichern" und daraus ein PNG erzeugen.

## Was sich leicht ändern lässt

| Element | Stelle im HTML |
| --- | --- |
| Stadt in der Überschrift | `<h1>Wir suchen in<br>Hannover!</h1>` |
| Stundenumfang | `<p class="pensum">` |
| Orangefarbener Störer | `<div class="badge">Ab sofort oder später</div>` — z. B. „2 offene Stellen" |
| Bullets | `<ul class="perks">` bzw. `<ul class="profil">` |
| Kontakt | `<p class="cta">` |

Markenfarben stehen oben als CSS-Variablen (`--green`, `--blue`, `--red`,
`--orange`), damit alle Elemente konsistent bleiben.

> Hinweis zum Text: In der Aichach-Friedberg-Vorlage stehen zwei Tippfehler
> („geme mit Praxiserfahrung", „mit Kindern- und Jugendlichen"). Hier sind sie
> korrigiert — für die alte Anzeige lohnt sich die Korrektur auch.
