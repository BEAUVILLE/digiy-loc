from pathlib import Path

# Déclencheur de génération contrôlée de la page d'inscription.
PATH = Path("inscription-loc.html")
MARKER = "<!-- DIGIY LOC — inscription internationale 7 langues -->"
TAGS = """\n  <!-- DIGIY LOC — inscription internationale 7 langues -->\n  <script src=\"./assets/js/digiy-loc-inscription-data-a.js?v=20260731\"></script>\n  <script src=\"./assets/js/digiy-loc-inscription-data-b.js?v=20260731\"></script>\n  <script src=\"./assets/js/digiy-loc-inscription-data-c.js?v=20260731\"></script>\n  <script src=\"./assets/js/digiy-loc-inscription-i18n.js?v=20260731\"></script>\n"""

source = PATH.read_text(encoding="utf-8")
if MARKER not in source:
    if "</body>" not in source:
        raise SystemExit("inscription-loc.html sans balise </body>")
    source = source.replace("</body>", TAGS + "</body>", 1)
    PATH.write_text(source, encoding="utf-8")
    print("Moteur 7 langues installé dans inscription-loc.html")
else:
    print("Moteur 7 langues déjà installé")
