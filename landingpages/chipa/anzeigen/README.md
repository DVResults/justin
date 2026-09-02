# chi.pa Stellenanzeige Hannover — Social Creatives

Drei Formate, gebaut aus einer Quelle (`build.py`). Schriften (Montserrat,
Source Sans 3) und das chi.pa-Logo stecken als base64 in jeder HTML-Datei —
sie laufen offline und sehen auf jedem Rechner gleich aus.

| Datei | Groesse | Platzierung |
| --- | --- | --- |
| `hannover-feed-4x5.html` | 1080 × 1350 | **Meta-Feed, empfohlen** — hoechster erlaubter Anteil am Handy-Bildschirm |
| `hannover-feed-1x1.html` | 1080 × 1080 | Meta-Feed quadratisch, Marktplatz, Rechte Spalte |
| `hannover-story-9x16.html` | 1080 × 1920 | Stories und Reels |

## Warum nichts abgeschnitten wird

Drei Sicherungen:

1. **Sichere Flaeche pro Format.** Text und Logo liegen nur innerhalb `.safe`.
   Bei 9:16 sind oben 300 px und unten 340 px freigehalten — dort blendet
   Instagram/Facebook Profilzeile, Fortschrittsbalken und CTA-Button ein.
   Das Foto darf in diese Zonen hineinlaufen, Text nie.
2. **Auto-Fit.** Beim Laden misst ein kleines Skript den Textblock und
   skaliert ihn herunter, falls er nicht in die sichere Flaeche passt. Auch
   nach dem Bearbeiten (laengerer Stadtname, zusaetzlicher Aufzaehlungspunkt)
   kann also nichts unten herausfallen. Der verwendete Faktor steht danach im
   Attribut `data-fit` des Textblocks — 1.000 heisst „passt in Originalgroesse".
3. **Freigestelltes Foto kollidiert nicht mit dem Text.** Foto-Hoehe und
   Ueberstand nach rechts sind so gewaehlt, dass zwischen der linken Kante der
   Person und der laengsten Textzeile in jeder Bildzeile mindestens 26 px
   Abstand bleiben — ausgerechnet aus dem tatsaechlichen Silhouetten-Profil
   des Freistellers, nicht geschaetzt.

Kontrolle im Browser: `datei.html?guides=1` blendet die Sicherheitszonen rot
ein. Alles Wichtige muss ausserhalb liegen.

## Foto

Das freigestellte Portrait wird automatisch geladen. Fuer den dauerhaften
Betrieb bitte einmal herunterladen, als `person.png` neben die HTML-Dateien
legen — dann nutzen sie die lokale Datei und sind unabhaengig vom CDN.

Wird ein anderes Foto eingesetzt, muessen `person` (Hoehe) und `bleed`
(Ueberstand rechts) in `build.py` neu gesetzt werden, sonst kann es den Text
ueberdecken. Danach `python3 build.py`.

## Als PNG exportieren

HTML im Browser oeffnen → F12 → im Elements-Panel `<div class="ad">`
auswaehlen → Strg+Shift+P → „Capture node screenshot". Ergibt exakt die
Zielgroesse.

## Texte aendern

Alles Inhaltliche steht oben in `build.py` als Konstanten: `CITY`, `ROLE_A`,
`ROLE_B`, `ROLE_SUB`, `PENSUM`, `PERKS`, `PROFIL`, `BADGE`, `CTA`. Danach
`python3 build.py` — schreibt alle drei Formate neu.

Fuer den naechsten Standort reicht es, `CITY` zu tauschen.

> Hinweis: In der Aichach-Friedberg-Vorlage stehen zwei Tippfehler („geme mit
> Praxiserfahrung", „mit Kindern- und Jugendlichen"). Hier sind sie korrigiert.
