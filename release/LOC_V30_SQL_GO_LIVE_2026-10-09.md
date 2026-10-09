# 🦅 DIGIY LOC V30 — SQL PRODUCTION GO / ATTESTATION

**Date : 2026-10-09 UTC.** Projet Supabase **DIGIY CORE** `wesqmwjjtsefyjnluosj`. L'opérateur a explicitement demandé le GO production dans la conversation, confirmé ensuite le bon fonctionnement des accès propriétaires (« C'est OK »), et **a personnellement réalisé** la restauration logique chiffrée de l'archive #75. Ce document note **les résultats techniques réellement obtenus**, pas un test supplémentaire des sessions d'authentification.

## Sauvegarde et récupération : PASS

- Artefact privé chiffré [admin-digiy run #75](https://github.com/BEAUVILLE/admin-digiy/actions/runs/37905010977), [artifact #11604211913](https://github.com/BEAUVILLE/admin-digiy/actions/runs/37905010977/artifacts/11604211913), créé le 9 octobre entre 08:27 et 08:33 UTC.
- Restauration privée **réelle** opérée sur Mac dans PostgreSQL Docker jetable **sans réseau**. Journal partagé uniquement en marqueurs non sensibles : `ISOLATED_ARCHIVE_INTEGRITY_OK`, `ISOLATED_POSTGRES_READY`, `ISOLATED_AUTH_CATALOG_OK` (27 tables), `ISOLATED_STORAGE_CATALOG_OK` (8 tables), `ISOLATED_RESTORE_SQL_OK`, `ISOLATED_RESTORE_PROOF_OK: 82/82 jours bloqués, 0 réservation MASTER`, `ISOLATED_RESTORE_PRODUCTION_UNTOUCHED`, `RESTORE_LOCAL_ISOLATED_SUCCESS`.
- Correctif de comptage strict (81 ou 82 selon snapshot) [admin-digiy PR #25 fusionnée](https://github.com/BEAUVILLE/admin-digiy/pull/25) ; CI synthétique 81/81 et 82/82, rejet d'attente incorrecte [run #37906283188](https://github.com/BEAUVILLE/admin-digiy/actions/runs/37906283188).

## Préflight de production juste avant la migration : PASS

`LOC_MASTER_V30_PREFLIGHT_READONLY.sql` (main) exécuté en SELECT à **2026-10-09 08:52:40.95937 UTC** :
- **8/8** prérequis vrais ; `status` et `occupancy_origin` absents au départ, deux tables RLS activé ;
- **82 lignes calendrier, 82 occupied/closed, 0 réservation MASTER**, 0 statut inattendu.
- `LOC_MASTER_V30_TERRITORY_BASELINE_READONLY.sql` : **61 Saly** et **21 Sarlat** occupées ; chacune provenances legacy inconnues, donc bloquées ; **2 sites et 2 unités MASTER** au total.
- Sources/propriétaires Saly et Sarlat déjà livrés et contrôlés par GitHub Pages ; les appels directs calendriers ont été retirés du modèle MAÎTRE, avec garde anti-ancien HTML PWA. Le test de session propriétaire réelle a été confirmé verbalement par l'opérateur **avant migration**, non reproduit par l'agent.

## Migration de production : SUCCESS

Migration Supabase appliquée via l'interface de migration SQL autorisée, à **08:52:50 UTC** :
- **Nom/version vérifiés dans l'historique Supabase** : `20261009085250` — `digiy_loc_master_v30_owner_cancellation_20261009`.
- Code exact provenant de `main` : [supabase/candidates/LOC_MASTER_V30_CANDIDATE.sql](../supabase/candidates/LOC_MASTER_V30_CANDIDATE.sql), SHA blob GitHub `32eb15bfdf3d3a98d089ee6082c70fceb1fa84c1`.
- Outil de migration : **`success: true`**. Fonction de sauvegarde réservation v1 durcie, nouvelle liste v2, nouvelle annulation explicite, états calendrier v1/v2 sérialisés avec verrou par unité ; revoked `anon` pour RPC propriétaires ; revoked INSERT/UPDATE/DELETE directs `authenticated` sur tables MASTER concernées ; `authenticated` garde EXECUTE sur RPC propriétaire.

## Postcheck de production : PASS à 08:53:11 UTC

Exécution SELECT `supabase/candidates/LOC_MASTER_V30_POSTCHECK_READONLY.sql` :
- **`ok=true`**, tous les booléens de schéma/RLS et privilèges attendus vrais.
- **82/82 calendriers historiques toujours bloqués**, avec `occupancy_origin IS NULL` ; **61 Saly, 21 Sarlat** ; aucune suppression de journée et **zéro réservation MASTER**.
- Nouvelles colonnes `status`, `cancelled_at`, `cancelled_by`, `cancel_reason`, `occupancy_origin` et contraintes présentes.
- Authentifiés : RPC réservation / annulation / calendrier / historique v2 autorisées ; anonymes : ces RPC refusées, y compris RPC calendrier legacy ; table MASTER : insert/update/delete directs `authenticated` révoqués.
- L'avis de sécurité Supabase contient des avertissements génériques pour les RPC `SECURITY DEFINER` exposées à `authenticated`. Ce sont des RPC propriétaires intentionnelles comportant vérifications `auth.uid()`/propriété selon le code revu et les tests synthétiques ; l'avis seul **ne prouve ni absence ni présence** de vulnérabilité. [Guide Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Publication des nouvelles RPC côté API

Après le postcheck, commande officielle de rafraîchissement du catalogue PostgREST exécutée dans DIGIY CORE : `NOTIFY pgrst, 'reload schema';` (exécution sans erreur, résultat `[]`, aucune ligne métier modifiée). [Procédure officielle Supabase](https://supabase.com/docs/guides/troubleshooting/refresh-postgrest-schema). Cela **demande** le rafraîchissement du catalogue API ; cela ne constitue pas à lui seul une preuve de requête HTTP authentifiée réussie, qui doit être validée par le propriétaire.

La vérification HTTP publique en lecture seule du 9 octobre montre la vitrine [Saly](https://part-chez-baptiste.digiylyfe.com/) et la vitrine [Sarlat](https://sarlat-chez-baptiste.digiylyfe.com/) accessibles, avec leurs boutons de demande directe, contact et paiement directs. La consultation HTML n'exécute pas le JavaScript du calendrier et **ne prouve pas** que les nouvelles RPC ont été sollicitées par le navigateur.

## Portée et derniers contrôles d'usage

**GO SQL confirmé.** **Il reste à réaliser une vérification opérationnelle propriétaire POST-migration**, car aucun agent n'a ouvert une session magic-link authentifiée avec les secrets privés Saly/Sarlat. À vérifier sans modifier de dates existantes : chargement du carnet v2, visibilité du bouton d'annulation uniquement sur réservation active réelle, calendrier Saly/Sarlat, et aucune donnée étrangère visible. Pas de création de test client sur les vraies données ; les tests de réservation, annulation, concurrence et frontières propriétaires ont été effectués en PostgreSQL isolé et navigateurs mockés. Lorsqu'un vrai propriétaire utilise la gestion, les traitements sont désormais protégés par le serveur V30.

**La sauvegarde logique validée couvre SQL et Storage metadata, PAS les octets des fichiers Supabase Storage, les Edge Functions ni SMTP.** Cette limite est distincte de la réussite du module MASTER LOC.

**Aucune preuve privée (ZIP, email, OTP, clients, dumps SQL) n'est committée ici.**
