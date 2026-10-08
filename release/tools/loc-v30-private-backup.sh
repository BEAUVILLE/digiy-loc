#!/usr/bin/env bash
# DIGIY LOC V30 — PRIVATE OPERATOR-ONLY DATABASE EXPORT
# Read-only to PostgreSQL. Never run in GitHub Actions.
# IMPORTANT: Successful exports are NOT proof of a tested restore.
set -euo pipefail
umask 077
if [[ -n "${CI:-}" || -n "${GITHUB_ACTIONS:-}" || ! -t 0 || ! -t 1 ]]; then
  printf '%s\n' 'REFUS : sauvegarde autorisée uniquement en terminal interactif privé.' >&2
  exit 1
fi
if ! command -v supabase >/dev/null 2>&1; then
  printf '%s\n' 'CLI Supabase manquante. Vérifiez l’installation officielle et supabase db dump --help.' >&2
  exit 1
fi
if ! command -v shasum >/dev/null 2>&1; then
  printf '%s\n' 'shasum manquant : contrôle intégrité indisponible.' >&2
  exit 1
fi
printf '%s\n' 'DIGIY LOC V30 : export privé digiy-core, SANS déploiement ni modification SQL.'
printf '%s\n' 'Utilisez uniquement un disque chiffré (FileVault ou volume chiffré équivalent).'
printf '%s\n' 'Les trois fichiers peuvent contenir des données personnelles : ne jamais les joindre au chat, à un email ou à GitHub.'
printf '%s\n' 'Vérifiez le chemin du projet dans Supabase > Connect. Saisissez l’URI sans l’afficher.'
DB_URI=''
IFS= read -r -s -p 'URI PostgreSQL Supabase digiy-core (saisie invisible) : ' DB_URI
printf '\n'
trap 'unset DB_URI' EXIT
if [[ "$DB_URI" != postgres://* && "$DB_URI" != postgresql://* ]]; then
  printf '%s\n' 'REFUS : URI PostgreSQL invalide.' >&2
  exit 1
fi
if [[ "$DB_URI" != *wesqmwjjtsefyjnluosj* ]]; then
  printf '%s\n' 'REFUS : la référence du projet digiy-core n’apparaît pas dans cette connexion.' >&2
  exit 1
fi
if [[ -z "${DIGIY_ENCRYPTED_STORAGE_CONFIRMED:-}" ||
      "${DIGIY_ENCRYPTED_STORAGE_CONFIRMED}" != 'YES' ]]; then
  printf '%s\n' 'REFUS : définissez DIGIY_ENCRYPTED_STORAGE_CONFIRMED=YES uniquement après avoir vérifié le chiffrement du disque.' >&2
  exit 1
fi
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
root="${HOME}/DIGIY_PRIVATE_BACKUPS"
folder="${root}/LOC_V30_${timestamp}"
mkdir -p "$root"
chmod 700 "$root"
if [[ -e "$folder" ]]; then
  printf '%s\n' 'REFUS : le dossier horodaté existe déjà.' >&2
  exit 1
fi
mkdir "$folder"
chmod 700 "$folder"
cd "$folder"
printf '%s\n' 'Démarrage des trois exports privés ; les données restent sur cette machine.'
supabase db dump --db-url "$DB_URI" -f roles.sql --role-only
supabase db dump --db-url "$DB_URI" -f schema.sql
supabase db dump --db-url "$DB_URI" -f data.sql --use-copy --data-only
for f in roles.sql schema.sql data.sql; do
  if [[ ! -s "$f" ]]; then
    printf '%s\n' 'ÉCHEC : fichier manquant ou vide. La sauvegarde n’est pas valide.' >&2
    exit 1
  fi
  chmod 600 "$f"
done
shasum -a 256 roles.sql schema.sql data.sql > SHA256SUMS.txt
chmod 600 SHA256SUMS.txt
printf '\n%s\n' "Exports locaux enregistrés sous : $folder"
printf '%s\n' 'Export terminé. RESTAURATION NON ENCORE TESTÉE : migration production toujours BLOQUÉE.'
printf '%s\n' 'Étape suivante : test de restauration sur une cible SUPABASE NON-PRODUCTION séparée.'
