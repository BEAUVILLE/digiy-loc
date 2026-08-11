from __future__ import annotations

from pathlib import Path

INDEX = Path("index.html")
SCRIPT_TAG = '<script src="./assets/js/digiy-loc-portes-cartouche.js?v=20260731" defer></script>'
MARKER = "<!-- DIGIY LOC — cartouche portes secondaires -->"


def main() -> None:
    source = INDEX.read_text(encoding="utf-8")
    if SCRIPT_TAG in source:
        print("Cartouche LOC déjà installée.")
        return

    closing = "</body>"
    if closing not in source:
        raise SystemExit("index.html ne contient pas </body> : installation annulée.")

    addition = f"\n  {MARKER}\n  {SCRIPT_TAG}\n"
    updated = source.replace(closing, addition + closing, 1)
    INDEX.write_text(updated, encoding="utf-8")
    print("Cartouche LOC installée dans index.html.")


if __name__ == "__main__":
    main()
