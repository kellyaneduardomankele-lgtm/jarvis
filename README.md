# JARVIS Basic – GitHub Edition

Ein einfacher persönlicher Browser-Assistent mit:

- JARVIS-Design
- Spracheingabe
- Aktivierungswort „Hey Jarvis“
- Sprachausgabe
- Textfeld
- einfache Matheaufgaben
- Grundlagen für Deutsch, Englisch und Französisch
- lokales Gedächtnis im Browser
- mobilfreundliches Design

## Gedächtnis

JARVIS kann sich Angaben lokal auf dem Gerät merken. Sage oder schreibe zum
Beispiel `Merke dir: Mein Lieblingsteam ist ...`. Mit `Was weisst du über mich?`
liest JARVIS die gespeicherten Angaben vor. Das Gedächtnis lässt sich in den
Einstellungen bearbeiten oder löschen. Es wird nicht im GitHub-Repository
veröffentlicht.

## GitHub Pages veröffentlichen

1. Auf GitHub ein neues Repository erstellen, z. B. `jarvis`.
2. `index.html`, `style.css` und `script.js` hochladen.
3. Im Repository auf **Settings → Pages** gehen.
4. Unter **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Ordner: **/(root)**
5. Speichern.
6. Nach der Veröffentlichung zeigt GitHub die Pages-Adresse an.

## Mikrofon

Beim ersten Start muss der Browser nach Mikrofonzugriff fragen. Erlaube den Zugriff.

Die Webseite kann nicht wie Siri dauerhaft im Hintergrund mithören. „Hey Jarvis“ funktioniert nur, solange die Seite geöffnet ist und die Spracherkennung läuft.

## Echte KI später hinzufügen

API-Schlüssel niemals direkt in `script.js` speichern oder öffentlich auf GitHub hochladen.

Für echte KI-Antworten sollte ein Backend verwendet werden, z. B. eine Serverless Function auf Vercel, die den geheimen API-Key in einer Environment Variable hält.
