# DIGIY LOC V30 — livraison du code / activation SQL non faite

**État contrôlé le 2026-10-09 (UTC).** Le fondateur a donné « GO PRODUCTION » puis confirmé « GO GO GO » après avoir retiré une fausse alerte de navigation publique. Ces validations autorisent la livraison progressive des artefacts et interfaces. **La base Supabase de production reste en V1. Le V30 SQL n'a PAS été exécuté.**

## Réalisé, vérifié

| Livrable | Référence | Résultat |
| --- | --- | --- |
| Restauration réelle archive SQL DIGIY CORE du 9 octobre | `admin-digiy` PR #24 ; journal privé `ISOLATED_RESTORE_PROOF_OK` | PASS 81/81, environnement Docker sans réseau externe |
| Saly propriétaire V30 interface / fallback v1 | [PR #12](https://github.com/BEAUVILLE/part-chez-baptiste/pull/12) | main `7da11499eda10edb08bef7ac508b817bcbe5c60d`, Pages SUCCESS |
| Sarlat propriétaire V30 interface / fallback v1 | [PR #7](https://github.com/BEAUVILLE/pro-espace/pull/7) | main `e2d171e9a48e7e1bb6da723c5e9667fff4a273b2`, Pages SUCCESS |
| MAÎTRE calendrier sans écriture directe | [PR #11](https://github.com/BEAUVILLE/digiy-master-modeles/pull/11) | main, 10 tests PASS |
| MAÎTRE carnet V30 après rebase sécurité | [PR #12](https://github.com/BEAUVILLE/digiy-master-modeles/pull/12) | main, 3 workflows verts |
| MAÎTRE PWA évite ancienne page propriétaire dans le cache | [PR #13](https://github.com/BEAUVILLE/digiy-master-modeles/pull/13) | main `f9ce72d351cf590d5f09917bba3cb7cf35fba7e7`, 8/8 tests, service worker network-only gestion |
| Candidat SQL V30, procédures et tests | [LOC PR #38](https://github.com/BEAUVILLE/digiy-loc/pull/38) | **fusionné dans main** `a478d4f3f4012ae7f8b46d883c363d0cf5c71b7c` ; les changements étaient exclusivement des ajouts de `supabase/candidates`, `tests`, `release` et workflows en test, sans migration automatique |
| Fichiers HTML propriétaires publiés Saly + Sarlat | [Attestation HTTP SHA256](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37902011826) | PASS pour les deux nouveaux `main` |

**Preflight DIGIY CORE, requête SELECT le 2026-10-09 à 08:10:38 UTC :** 8/8 contrôles PASS ; 0 réservation MASTER ; 81/81 lignes historiques toujours `occupied`/`closed` ; zéro état inattendu ; 61 Saly + 20 Sarlat. Le schéma V30 `status`/ `occupancy_origin` est **absent de production**. Les droits SQL directs préexistants sur calendrier et réservations sont **toujours actifs** ; aucune révocation ni migration n'a eu lieu.

## Verrous avant activation de la base

1. **Validation authentifiée réelle Saly et Sarlat**, en lecture seule sur le serveur V1 présent : l'utilisateur propriétaire légitime accède à son logement et à son historique, ne voit pas les données d'un autre propriétaire, ne voit pas un bouton d'annulation activé tant que RPC v2 manquante. Les tests GitHub Chrome emploient des mocks et ne remplacent pas ce contrôle. Les comptes, OTP et liens magiques restent privés.
2. **Inventaire des copies / clients effectivement installés ou mis en cache** au-delà des dépôts contrôlés. Le modèle MAÎTRE et son service worker sont corrigés sur `main`, mais cela ne corrige PAS automatiquement les anciennes copies / PWAs distribuées. Confirmer qu'aucun appelant encore utilisé ne dépend des anciens droits INSERT/UPDATE/DELETE directs sur `digiy_loc_master_unit_calendar` ou `digiy_loc_master_reservations`.
3. **GO SQL distinct après preuves précédentes** : lire la candidate de `main` `supabase/candidates/LOC_MASTER_V30_CANDIDATE.sql`, vérifier la sauvegarde récente, exécuter préflight 8/8 et snapshot 61+20 **juste avant** la transaction SQL ; prévoir procédure et fenêtre de retour arrière. Après exécution, lancer `LOC_MASTER_V30_POSTCHECK_READONLY.sql`, contrôler permissions/RLS, 81 dates legacy bloquées, puis les essais propriétaires autorisés sur données fictives isolées, sans notification/paiement automatique.

**Décision factuelle : code V30 prêt et livré. SQL V30 NON ACTIVÉ / NO-GO provisoire**. N'étiqueter la fonctionnalité complète « GO PRODUCTION » qu'après validation du postcheck SQL et des deux vrais parcours propriétaires.

L'alerte antérieure concernant une redirection de la page publique a été retirée par l'utilisateur. Aucun correctif correspondant n'a été fusionné dans les fiches publiques.

Aucune clé ni archive privée dans ce journal.
