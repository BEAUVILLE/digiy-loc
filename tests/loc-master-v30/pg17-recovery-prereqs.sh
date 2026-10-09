#!/usr/bin/env bash
# DIGIY LOC V30 — disposable Supabase Postgres extension compatibility.
# NO production connection, NO secrets, NO backed-up customer data.
set -Eeuo pipefail
set +x
umask 077
[[ "${V30_CI_ONLY:-}" == "1" && -z "${SUPABASE_DB_URL:-}" && -z "${RESTORE_DB_URL:-}" ]] || {
  echo 'V30_RECOVERY_PROBE_REQUIRES_ISOLATED_CI' >&2;exit 1;
}
command -v docker >/dev/null || exit 1
container="digiy-v30-recovery-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"
workspace="$(mktemp -d)"
trap 'docker rm -f "$container" >/dev/null 2>&1 || true; rm -rf "$workspace"' EXIT
password="$(openssl rand -hex 30)"
docker run -d --rm --network none --name "$container" \
  -e POSTGRES_PASSWORD="$password" \
  supabase/postgres:17.6.1.173 \
  postgres -c config_file=/etc/postgresql/postgresql.conf \
  >"$workspace/container.log" 2>&1 || { echo 'V30_RECOVERY_DOCKER_START_FAILED';exit 1; }
unset password
ready=no
for i in $(seq 1 75); do
  if docker exec "$container" pg_isready -U postgres -d postgres >/dev/null 2>&1;then
    ready=yes;break;
  fi
  sleep 2
done
[[ "$ready" == yes ]] || { echo 'V30_RECOVERY_POSTGRES_NOT_READY'; exit 1; }
actual="$(docker exec "$container" psql -X -w -Atq -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c "SELECT count(*) FROM pg_available_extensions WHERE name IN ('pg_cron','pg_net','pg_stat_statements','pg_trgm','pgcrypto','supabase_vault','unaccent','uuid-ossp','vector')" \
  2>"$workspace/sql-private.log")" || { echo 'V30_RECOVERY_CATALOG_FAILED';exit 1; }
echo "V30_RECOVERY_AVAILABLE_EXTENSIONS=$actual/9"
[[ "$actual" == 9 ]] || { echo 'V30_RECOVERY_EXTENSION_PACKAGE_GAP';exit 1; }

# Validate extension scripts/loadability on the disposable instance. No
# platform role creation and no writes outside this networkless container.
docker exec "$container" psql -X -w -q -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c 'CREATE SCHEMA IF NOT EXISTS extensions; CREATE SCHEMA IF NOT EXISTS vault;' \
  >"$workspace/sql-private.log" 2>&1 || { echo 'V30_RECOVERY_SCHEMA_BOOTSTRAP_FAILED';exit 1; }
while IFS='|' read -r name schema;do
  [[ -n "$name" ]] || continue
  if ! docker exec "$container" psql -X -w -q -v ON_ERROR_STOP=1 -U postgres -d postgres \
    -c "CREATE EXTENSION IF NOT EXISTS \"$name\" WITH SCHEMA \"$schema\"" \
    >"$workspace/sql-private.log" 2>&1;then
    echo "V30_RECOVERY_EXTENSION_INSTALL_FAILED=$name"
    exit 1
  fi
  echo "V30_RECOVERY_EXTENSION_INSTALL_PASS=$name"
done <<'EXTENSIONS'
pg_cron|pg_catalog
pg_net|extensions
pg_stat_statements|extensions
pg_trgm|public
pgcrypto|extensions
supabase_vault|vault
unaccent|public
uuid-ossp|extensions
vector|public
EXTENSIONS
# Supabase's production platform roles are known by NAME (never inspect
# passwords or secrets). Presence/absence determines what a genuine roles.sql
# restore must reconcile. This probe does not restore that roles.sql file.
existing_roles="$(docker exec "$container" psql -X -w -Atq -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c "SELECT count(*) FROM pg_roles WHERE rolname IN ('anon','authenticated','authenticator','pgbouncer','service_role','supabase_admin','supabase_auth_admin','supabase_realtime_admin','supabase_storage_admin')" \
  2>"$workspace/sql-private.log")" || { echo 'V30_RECOVERY_ROLE_CATALOG_FAILED';exit 1; }
echo "V30_RECOVERY_PLATFORM_ROLES_PREEXISTING=$existing_roles/9"
echo 'V30_RECOVERY_ROLE_RECONCILIATION_REQUIRED: genuine roles.sql may create or alter roles; must test actual dump before release.'
echo 'V30_RECOVERY_EXTENSION_PREREQS_PASS: nine required extensions installable in disposable PG17 without network.'
echo 'V30_RECOVERY_REAL_BACKUP_NOT_RESTORED: no encrypted artifact or secret used.'
