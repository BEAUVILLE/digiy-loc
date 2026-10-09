# DIGIY LOC V30 — activation SQL suspendue, nouvelle journée occupée détectée

**9 octobre 2026, contrôle de production à 08:20:38 UTC.** Le fondateur a dit « C'EST OK FRÉROT » après demande de test des accès propriétaires : son retour est reçu comme confirmation fonctionnelle opérateur, **pas** comme une preuve machine d'identité/autorisation interpropriétaires ni comme une autorisation d'effacer les données.

> **Précision de l'opérateur, le 9 octobre :** la variation de 81 à 82 jours est expliquée par une **modification volontaire du calendrier propriétaire**, effectuée pour tester si le changement était répercuté sur la **fiche publique**. Ce n'est pas un incident de calendrier inexpliqué. La réaction de la fiche publique n'a **pas encore été établie par une preuve indépendante**, et le jour exact n'a pas été consigné. L'assistant reconnaît ne pas avoir prévenu à temps l'opérateur d'éviter les mutations pendant la fenêtre pré-release. **Ne supprimer ni annuler cette journée de test sans vérification opérateur ; arrêter temporairement les modifications calendrier pendant le snapshot final.**

> La sauvegarde chiffrée **#75** [run 37905010977](https://github.com/BEAUVILLE/admin-digiy/actions/runs/37905010977) a été créée après le test (workflow SUCCESS, artefact privé #11604211913). Elle reste à **restaurer et prouver** en local ; le restaurateur historique attend 81, la PR [admin-digiy #25](https://github.com/BEAUVILLE/admin-digiy/pull/25) prépare le contrôle strict 82. Aucun SQL V30 n'est déployé.

## Preuve exacte de la dérive

Réexécution en SELECT pur de `supabase/candidates/LOC_MASTER_V30_PREFLIGHT_READONLY.sql` sur `digiy-core`, projet `wesqmwjjtsefyjnluosj` :
- Catalogue **8/8 TRUE**, V30 toujours non installé.
- Réservations MASTER : **0**.
- Calendrier MASTER : **82 lignes**, dont **82 occupied/closed**, **0 statut inattendu**.
- Avant cela : **81** journées à 08:10:38 UTC, réparties 61 Saly, 20 Sarlat.
- **Une ligne supplémentaire est apparue** entre les deux contrôles. Ne pas présumer du site, du jour exact, de l'auteur ou de la raison. Ne pas effacer cette ligne. La détection ne prouve PAS que les 81 lignes précédentes sont toutes inchangées.

La commande de ventilation du nouvel état par site s'est heurtée à un blocage des contrôles de sécurité de l'outil connecté ; la requête n'a pas abouti et n'a produit aucun résultat utilisable. **Aucune tentative de contournement et aucun SQL de mutation en production**.

## Sauvegarde actuelle insuffisante pour la bascule

La dernière sauvegarde chiffrée **vérifiée** disponible est [DIGIY backup run #74](https://github.com/BEAUVILLE/admin-digiy/actions/runs/37887484483), créée à **05:12:40 UTC**, restaurée avec succès auparavant sur le Mac du propriétaire : `ISOLATED_RESTORE_SQL_OK`, `ISOLATED_RESTORE_PROOF_OK`, 81/81 journées. Elle **précède** le changement observé à 08:20 et n'est donc pas une garantie de récupération de la 82ᵉ journée.

Le workflow existant `BEAUVILLE/admin-digiy/.github/workflows/supabase-backup.yml` accepte `workflow_dispatch` et applique chiffrement, signatures et artefact privé (30 jours). Aucune nouvelle exécution réussie n'a été observée lors du contrôle. Ne créer aucun projet Supabase supplémentaire.

## Procédure de déblocage

1. **Opérateur propriétaire** : ouvrir [Actions — admin-digiy](https://github.com/BEAUVILLE/admin-digiy/actions), sélectionner **DIGIY — Sauvegarde Supabase chiffrée**, puis **Run workflow** sur `main`; attendre SUCCESS et vérifier qu'un nouvel artefact chiffré a été créé. Ne partager ni clé ni ZIP public.
2. Télécharger la nouvelle archive en local, suivre `docs/RESTORE_DIGIY_CORE_LOCAL_MAC.md` de `BEAUVILLE/admin-digiy`, prouver le déchiffrement + restauration hors réseau. La preuve historique devient **82 lignes au moment de ce snapshot** si aucun autre changement n'a eu lieu ; **ne pas coder 82 en dur** si l'état évolue.
3. Comparer l'état live avec un snapshot fraîchement vérifié et la ventilation par site et jour, sans inclure de données voyageur dans les logs ; prouver que les 81 blocages précédents et toute nouvelle journée sont conservés.
4. Vérifier l'absence d'anciennes copies/PWA propriétaire susceptibles de dépendre des droits directs `authenticated INSERT/UPDATE/DELETE` qui seront révoqués.
5. Refaire `LOC_MASTER_V30_PREFLIGHT_READONLY.sql` + baseline et lancer la migration atomique approuvée `supabase/candidates/LOC_MASTER_V30_CANDIDATE.sql` **uniquement lorsque tous les verrous sont satisfaits**. Exécuter immédiatement `LOC_MASTER_V30_POSTCHECK_READONLY.sql` (ok=true), lecture des nouveaux RPC et préservation de tous les jours hérités. Aucune création ou annulation sur les données de vrais clients pendant les tests.

## Statut non ambigu

✅ Interfaces Saly/Sarlat publiées, MAÎTRE et code V30 fusionnés. ✅ Restauration authentique d'un snapshot historique à 81 jours. ✅ Préflight actuel 8/8.

🛑 **SQL V30 PAS APPLIQUÉ.** La nouvelle journée non sauvegardée, l'impossibilité de vérifier sa provenance et les copies déployées non inventoriées interdisent de déclarer GO serveur. Aucune révocation des grants, migration, INSERT/UPDATE/DELETE calendrier ou réservation n'a été entreprise dans cette étape.
