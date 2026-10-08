# DIGIY TRUST V26 — identité serveur dédiée, candidate non déployée

## Décision

PR brouillon, base V25 `756e3f5d`, audit du 8 octobre 2026 sur digiy-core.
**Aucune fusion avant VERT. Aucune autorisation de déploiement n'est implicite
dans le VERT de fusion.** Aucun rôle, grant, policy, secret ou mot de passe créé
en production. Aucun formulaire activé, aucune donnée privée lue lors de l'audit.

## Audit V25 / V17 et état réel

- L'adaptateur injecte une connexion PostgreSQL serveur, utilise des paramètres
  liés, contrôle les UUID, scores, longueur et états fixes. Ses deux requêtes
  lisent seulement `id/is_active` sur `public.digiy_loc_master_units`.
- V25 a réellement supprimé `RETURNING` : `rowCount === 1` suffit. Aucun droit
  SELECT sur les avis n'est nécessaire. L'INSERT SELECT revérifie le logement
  actif dans la même instruction. L'adaptateur reste inchangé dans V26.
- V17 est déjà présente en production (malgré son ancien en-tête de brouillon).
  Ne pas la rejouer : ses `IF NOT EXISTS` ne constituent pas une validation de
  dérive. UUID automatique, FK logement, CHECK des scores et du commentaire,
  `declared_stay=true`, `moderation_status='received'`, `stay_verified=false`
  confirmés au catalogue. Aucun trigger utilisateur ni fonction dans le schéma.
- Table et schéma privés possédés par `postgres`; RLS activée, FORCE RLS non
  activée, aucune policy privée. Les propriétaires/superutilisateurs restent
  privilégiés : V26 ne leur retire pas leurs capacités d'administration.
- `anon`, `authenticated`, `authenticator`, `service_role` : USAGE du schéma,
  SELECT et INSERT privés tous **false**. Le BYPASSRLS de `service_role` ne lui
  donne pas les grants manquants. `digiy_trust_server` n'existe pas.
- Logements : RLS active; SELECT actif pour anon; policies SELECT/UPDATE
  propriétaires pour authenticated. V26 ajoute seulement deux policies SELECT
  ciblées sur le nouveau rôle; aucune policy propriétaire n'est remplacée.
- Le catalogue `pg_db_role_setting` ne fournit pas `pgrst.db_schemas` : ce résultat
  **ne prouve pas** la liste effective des schémas exposés. Vérification Dashboard
  Data API encore requise avant déploiement. V26 ne change aucune exposition.
- L'advisor sécurité confirme `rls_enabled_no_policy` sur les avis privés : état
  fermé attendu avant V26, pas une raison d'ouvrir l'accès public. L'audit advisor
  du projet retourne aussi des constats hors périmètre, non corrigés ici.

## Blocage de sécurité confirmé : droits PUBLIC

Le contrôle en lecture seule recense **273 fonctions SECURITY DEFINER** hors
catalogue, exécutables via PUBLIC dans des schémas utilisables via PUBLIC.
Cela ne démontre pas 273 vulnérabilités : les contrôles internes n'ont pas tous
été audités. Cela démontre qu'un nouveau rôle PostgreSQL hériterait de capacités
au-delà de ses seuls GRANT explicites. `NOINHERIT` et `REVOKE ... FROM role`
ne suppriment pas les droits de PUBLIC. Des grants PUBLIC existent aussi sur
des relations d'extensions (`extensions`, `net`, `cron`).

La migration **échoue avant CREATE ROLE** si elle rencontre des fonctions
SECURITY DEFINER ou relations accessibles via PUBLIC. Elle est donc actuellement
**bloquée sur la production observée**. Ne pas retirer ce garde-fou pour forcer
le passage. Un audit séparé doit soit restreindre ces accès sans casser leurs
consommateurs, soit proposer une isolation serveur différente. V26 ne révoque
aucun droit global et ne modifie ni réservations, ni paiements, ni accès LOC.

## Contrat proposé

| Objet | Droit du rôle `digiy_trust_server` |
| --- | --- |
| Connexion, membres, héritage, administration, BYPASSRLS | Aucun |
| Schémas `public`, `digiy_trust_private` | USAGE uniquement |
| Logements | SELECT `(id,is_active)`, lignes actives uniquement |
| Avis privés | INSERT des dix colonnes utilisées par l'adaptateur |
| UUID et date de création | Valeurs serveur par défaut, insertion explicite interdite |
| Lecture, UPDATE, DELETE, TRUNCATE d'avis | Interdits |
| Statut vérifié ou publication automatique | Interdits par RLS et CHECK V17 |
| API publique, RPC, nouvelle fonction SECURITY DEFINER | Aucun ajout |

Une policy restrictive de lecture évite qu'une future policy permissive PUBLIC
ne donne au rôle accès aux logements inactifs. L'insertion exige également un
logement actif via RLS, même sans passer par l'adaptateur. L'activité est évaluée
au snapshot PostgreSQL de l'instruction : ce n'est pas un verrou contre une
désactivation concurrente ou future du logement.

La migration est volontairement à usage unique : rôle existant, RLS absente,
policies privées inattendues ou ACL publiques divergentes font échouer l'essai.
Elle a été créée avec `supabase migration new` (CLI 2.120.0), puis placée dans
`trust/sql/v26/`, hors de `supabase/migrations`, pour empêcher un déploiement
automatique. Aucune commande de déploiement n'est ajoutée à la CI.

## Vérification reproductible

- `node --test trust/*.test.mjs` : **128/128 réussis localement**.
- `bash -n trust/sql/v26/run-ci.sh` et `git diff --check` : réussis.
- PostgreSQL n'est pas installé localement; l'installation système n'a pas abouti
  (limitation de changement d'identité du conteneur). La preuve SQL sera fournie
  par les jobs GitHub Actions PostgreSQL **16 et 17**, pas par des mocks Node.
- `adapter-statements.mjs` extrait les deux requêtes de l'adaptateur réel et les
  prépare dans PostgreSQL. Aucune seconde implémentation SQL de l'adaptateur.
- `permissions.psql` vérifie succès actif, refus/absence inactive et inconnue,
  lecture restreinte, refus des autres colonnes, écritures LOC, lecture et
  mutations privées, RETURNING, UUID forcé, notes invalides, texte trop long,
  états falsifiés, accès anon/authenticated/service_role, escalade de rôle.
- Le test d'escalade remplace aussi `session_user`, car SET ROLE seul conserve
  les pouvoirs de changement de rôle de la session administrateur d'origine.
- Tous les INSERT d'essai, y compris les logements de fixture et l'avis autorisé,
  sont sous BEGIN/ROLLBACK; une assertion ultérieure exige zéro ligne restante.
- Préflight testé négativement : PUBLIC definer, PUBLIC relation, RLS désactivée,
  ACL privée divergente; création du rôle absente après chaque échec. Une seconde
  application de la migration doit échouer proprement.

Le runner est réservé à un serveur jetable local : `V26_CI_ONLY=1`,
`PGHOST=127.0.0.1`, `PGUSER=postgres`, puis
`bash trust/sql/v26/run-ci.sh`. Il crée une base `trust_v26_ci` neuve et refuse
implicitement sa réutilisation. Ne jamais pointer ce test vers la production.
Le service CI éphémère est lié à loopback, sans mot de passe enregistré.

## Workflows et limites restantes

Les neuf workflows TRUST existants sont des tests, sans déploiement Supabase.
Le workflow de signature Saly est distinct, déclenché manuellement ou par une
modification de son propre YAML sur main; V26 ne le modifie pas. Le fichier
`deploy-vps.yml` à la racine n'est pas un workflow GitHub Actions actif.
Le nouveau workflow V26 a `contents: read`, un timeout, aucun secret, aucune
connexion de production, et exécute les deux versions de PostgreSQL.

Avant toute activation : résoudre le blocage PUBLIC, vérifier l'exposition Data
API et les ACL/défauts/membres/fonctions sur l'environnement final, auditer les
policies réelles (la fixture CI réduit volontairement le modèle LOC), puis
obtenir une validation explicite de déploiement. La méthode de connexion/pool,
TLS, provisionnement et rotation du futur secret serveur restent à définir hors
dépôt. Pas de connexion opérationnelle livrée par cette PR.

Les quotas atomiques persistants, anti-bot, limites d'accès au backend,
modération, conservation et test de bout en bout restent des prérequis à
l'ouverture du formulaire. Les retours restent volontaires et non vérifiés.
V26 conserve le contrat V17 existant; elle ne redessine pas les critères métier.

## Références consultées

- [Supabase roles](https://supabase.com/docs/guides/database/postgres/roles)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Sécurité Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [Changelog](https://supabase.com/changelog) : changements récents consultés,
  pas d'API Supabase cliente nouvelle utilisée ici.
- [Advisor RLS sans policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
