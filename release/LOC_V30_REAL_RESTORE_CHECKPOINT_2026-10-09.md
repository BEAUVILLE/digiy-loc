# 🦅 DIGIY LOC V30 — checkpoint après restauration SQL réelle du 9 octobre 2026

**Date : 2026-10-09 (UTC). Statut : sauvegarde SQL / restauration réelle = PASS ; autorisation de déploiement V30 = NO-GO.**

## 1. Preuve de récupération réelle : VERROU LEVÉ

Le fondateur a **exécuté personnellement sur son Mac** `scripts/restore-from-downloaded-artifact-local.sh` du dépôt `BEAUVILLE/admin-digiy`, sur le ZIP privé `digiy-supabase-2026-10-09T05-12-58Z-NEUF.zip`. Le journal non sensible transmis au suivi indique :

- `RESTORE_ZIP_CIPHERTEXT_VERIFIED` et `ISOLATED_ARCHIVE_INTEGRITY_OK` ;
- `ISOLATED_POSTGRES_READY` : image PostgreSQL 17 sans réseau externe ;
- `ISOLATED_AUTH_MIGRATIONS_OK`, `ISOLATED_AUTH_CATALOG_OK` : 27 tables Auth initialisées avec migrations officielles GoTrue `v2.197.0` ;
- `ISOLATED_STORAGE_MIGRATIONS_OK`, `ISOLATED_STORAGE_MULTIPART_COMPAT_OK`, `ISOLATED_STORAGE_CATALOG_OK` : 8 tables Storage attendues et schéma S3 multipart prêt ;
- `ISOLATED_AUTH_JWT_BOOTSTRAP_OK`, `ISOLATED_AUTH_AUDIT_COMPAT_OK` ;
- **`ISOLATED_RESTORE_SQL_OK`** : `roles.sql`, `schema.sql` et `data.sql` originaux exécutés sans erreur dans une transaction ;
- **`ISOLATED_RESTORE_PROOF_OK`** : 81/81 jours historiques bloqués, zéro réservation MASTER, RPC de réservation présente ;
- **`ISOLATED_RESTORE_PRODUCTION_UNTOUCHED`**, **`RESTORE_LOCAL_ISOLATED_SUCCESS`**.

Il s'agit de la **sortie de l'opérateur pour la véritable archive chiffrée**, distincte des validations synthétiques GitHub. Les journaux privés, le ZIP et la phrase secrète ne doivent jamais être copiés dans le dépôt ou dans une PR. Le processus local supprime son conteneur et ses copies temporaires. Cette preuve atteste une **restauration logique SQL** ; elle ne certifie pas une restauration des octets de fichiers Storage, de la configuration SMTP/Auth, des fonctions Edge ou d'un service complet accessible via navigateur. Ne pas confondre cette réussite avec une approbation de migration V30.

**Références de contrôle :** [admin-digiy PR #24 fusionnée](https://github.com/BEAUVILLE/admin-digiy/pull/24) ; [restauration chiffrée synthétique CI #37896731853](https://github.com/BEAUVILLE/admin-digiy/actions/runs/37896731853). Les essais CI n'utilisent aucune archive ni clé client réelle.

## 2. Production DIGIY CORE : inventaire relu sans écriture à 07:24:46 UTC

Projet `digiy-core` (`wesqmwjjtsefyjnluosj`). Exécution **SELECT seulement**, avec les scripts versionnés `LOC_MASTER_V30_PREFLIGHT_READONLY.sql` et `LOC_MASTER_V30_TERRITORY_BASELINE_READONLY.sql` :

| Contrôle | Résultat |
| --- | --- |
| Préflight catalogue | **8/8 true** |
| Réservations `digiy_loc_master_reservations` | **0** |
| Calendrier MASTER | **81** lignes |
| Statut occupé/fermé | **81 / 81** |
| Statut inattendu | **0** |
| Saly `saly-chez-baptiste` | **61 occupied, 0 closed, 61 provenance legacy unknown** |
| Sarlat `sarlat-chez-baptiste` | **20 occupied, 0 closed, 20 provenance legacy unknown** |
| Colonnes V30 (`status`, `occupancy_origin`) | **absentes : V30 non déployée** |
| RLS sur deux tables MASTER | **activé** |

**Droits hérités encore actifs avant migration :** `authenticated` conserve INSERT/UPDATE/DELETE directs sur calendrier et réservations ; la RPC calendrier v1 reste exécutable à l'échelle SQL pour `anon` (garde d'identité interne présente). Ne pas décrire l'existant comme verrouillé V30 : les révocations ciblées sont **dans le SQL candidat non déployé**.

## 3. Code candidat : tests et déploiements réellement constatés

Le candidat [V30 serveur PR #38](https://github.com/BEAUVILLE/digiy-loc/pull/38) reste DRAFT. Au HEAD `412a6c185c5efcfb91588311c92d9d4604ae1f19`, quatre workflows conclus **success** : [SQL PG16/17 #37879664085](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37879664085), [navigateurs propriétaires simulés #37879664046](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37879664046), [HTML public déployé en lecture seule #37879664087](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37879664087), [prérequis de récupération #37879664072](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37879664072).

Les trois autres PR du lot sont toujours **DRAFT**, non fusionnées :
- [Saly #12](https://github.com/BEAUVILLE/part-chez-baptiste/pull/12) : `d347e34e982be162315e872eb60d05be8e97c56a` ; `main` déployable encore `ca17270e2daf8a0b27aafebd795fd20878458d30`.
- [Sarlat / pro-espace #7](https://github.com/BEAUVILLE/pro-espace/pull/7) : `d3c3475e07db9e919e1413190582a00fdc9bcf83` ; `main` encore `3395749759e49fac3e0aaa085713b62e794f59fe`.
- [MAÎTRE #10](https://github.com/BEAUVILLE/digiy-master-modeles/pull/10) : `e2d54d1546af4b5432f7a71b92bd5dc96fbd8676` ; `main` encore `08196f890674502ddfb3af28ed92846eeb4e5174`. **Le template MAÎTRE main contient encore une écriture calendrier directe**, corrigée uniquement dans la PR brouillon. Révoquer les droits en production avant fermeture de ce risque serait dangereux.

Les tests navigateur ont des API simulées ; ils ne prouvent **aucune session propriétaire réelle**, ni la compatibilité de toutes les copies déployées.

## 4. Les trois derniers verrous AVANT tout GO

1. **Compatibilité réelle des appelants** : inventorier les pages effectivement servies (Saly, Sarlat, MAÎTRE et copies éventuelles), leurs chemins RPC et les jobs/Edge Functions concernés. Éliminer les écritures directes du calendrier avant toute révocation SQL ; réexécuter les vérifications de parité Pages. Les intégrations obsolètes PULSE et NDIMBAL restent éteintes, jamais reconnectées.
2. **Acceptation en session propriétaire autorisée** : une session Saly et une session Sarlat, contrôle des protections interpropriétaires, calendrier bloqué, ancien carnet, création / annulation V30 uniquement sur données et dates de test autorisées, refus des doubles réservations et repli legacy sans élargir les droits. Ne pas faire de réservation réelle, de message client, ni de paiement pour le test. Aucun secret de connexion dans GitHub.
3. **Décision de livraison distincte** : GO explicite pour les PR clientes et pour la migration SQL ; capture privée du preflight immédiat, procédure de retour arrière conservant l'historique, ordre de déploiement et postcheck cible. Sans cette autorisation, **ni fusion des PR V30, ni SQL en production**. Le protocole d'acceptation avec cases à valider figure dans [LOC_V30_OWNER_ACCEPTANCE_2026-10-09.md](LOC_V30_OWNER_ACCEPTANCE_2026-10-09.md).

**État final à cette date :** restauration SQL réelle = **PASS** ; préflight et tests isolés V30 = **PASS** ; compatibilité de tous les clients + sessions réelles + approbation production = **PENDING**. **V30 reste NO-GO**, les modules existants continuent leur activité. Pas de coût ajouté, pas de projet Supabase payant, pas de relance PULSE/NDIMBAL.
