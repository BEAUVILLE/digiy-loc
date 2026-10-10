# V29 — Carte des parcours LOC actuels et porte de validation E2E
**Audit en lecture seule · 2026-10-08 · Aucun déploiement ni écriture client.**

## Périmètre et méthode
Sources : branches `main` GitHub, catalogue et définitions PostgreSQL lus
sans modification sur `digiy-core`, métadonnées/code des Edge Functions
(récupération en lecture seule). Les dépôts anciens restent parfois
publiés : **présence dans GitHub ≠ usage réel aujourd'hui**.
Le fondateur confirme expressément PULSE (ancien VPS) et NDIMBAL
**CADUCS et hors du parcours de réservation courant**. Ne jamais
les reconnecter.

## Parcours identifiés, sans présumer d'un seul système canonique

| Segment | Code / objet vérifié | Fait démontré | Ce qui reste à vérifier |
| --- | --- | --- | --- |
| Fiche publique | `BEAUVILLE/digiy-loc/fiche.html` | RPC `digiy_loc_public_room_by_slug(text)`; demande par WhatsApp/e-mail; aucun paiement collecté dans ce script | URL précise du logement et rendu mobile réel |
| Contact propriétaire | RPC publique renvoie `whatsapp_phone`, `call_phone`; `getContact(room)` lisait d'autres champs | **Défaut identifié** : bouton WhatsApp pouvait revenir au numéro DIGIY. Correctif ciblé et tests : [PR #37](https://github.com/BEAUVILLE/digiy-loc/pull/37), brouillon, non fusionnée | Valider le numéro propriétaire sur une fiche test autorisée, sans afficher les coordonnées dans la PR; fusion/publication séparée |
| Réservation/agenda MASTER | `digiy_loc_master_save_reservation_v1` / `digiy_loc_master_list_reservations_v1`, tables `digiy_loc_master_reservations` + `digiy_loc_master_unit_calendar` | L'auteur doit être authentifié et posséder l'unité; réservation écrite et dates occupées; pas de PULSE/NDIMBAL dans ces deux fonctions | Déterminer quel écran actuel appelle ces fonctions et valider l'identité propriétaire via son vrai parcours |
| Accès propriétaire LOC | `BEAUVILLE/pro-loc/index.html` + Edge `digiy-loc-owner-access`, `digiy-loc-magic-link` | Fonctions Edge actives (métadonnées) : contrôle session JWT, e-mail et adhésion/période active; magic-link envoyé uniquement pour adhésion active (selon code inspecté) | Réel mail reçu et propriétaire connecté via navigateur, sur compte TEST en staging |
| Annulation « suivi client » | `BEAUVILLE/chez-baptiste-astou-saly/suivre-reservation.html` + Edge `reservation-cancel` | Edge active; recherche par `tracking_code` + `client_phone`; écrit `digiy_reservations.status='annulee'` | Confirmer si ce suivi appartient au parcours en service ; NE PAS le confondre avec MASTER |
| Gestionnaires historiques encore présents dans le code | `chez-baptiste-astou-saly/proprio-loc.html`, `loc-pro.html`, `chez-baptiste-planning.html` | Utilisent `digiy_reservations`, `digiy_disponibilites` ou `loc_reservations` selon l'écran | Vérifier les URLs réellement utilisées avant retrait; aucune désactivation globale |
| Paiement direct | Texte et demande WhatsApp dans `fiche.html` | Le code de fiche inspecté n'encaisse aucun paiement DIGIY, et affiche 0 % commission / paiement direct | Vérifier une vraie confirmation propriétaire et le circuit de paiement externe sans réaliser de transaction |

## Preuves d'exécution réellement obtenues

- V29 [GitHub Actions PostgreSQL 16/17, run 37845457068](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37845457068) :
  **10/10 suites SQL vertes**. Le cinquième test rejoue les sources
  réelles de trois fonctions publiques/propriétaires sur **données synthétiques**,
  **avant/après** la neutralisation de 8 triggers PULSE + 1 NDIMBAL.
- [PR #37](https://github.com/BEAUVILLE/digiy-loc/pull/37) :
  source `fiche.html` corrigée, test Node sans réseau sur la sélection
  propriétaire `whatsapp_phone` et la construction du lien `wa.me`.
  **Tests verts, non déployée**.
- Catalogue `digiy-core` : 8 triggers PULSE + 1 NDIMBAL encore
  activés, droits RPC PUBLIC encore présents — **aucun SQL correctif
  appliqué sur cette base**. Cela ne prouve pas que les tables héritées
  soient exploitées par les parcours actuels.

## Porte de décision avant toute application à Supabase

**Validé :** contrôle de contrats SQL synthétiques (dix suites,
PostgreSQL 16/17), test source du contact direct, inventaire
des entrées et dépendances.

**Non validé :** vrai navigateur mobile / fiches en ligne / magic-link
reçu / confirmation réservation en bout-en-bout / paiement direct
hors DIGIY / annulation propriétaire MASTER / cohérence multi-repo.

Ne pas associer artificiellement la fonction Edge `reservation-cancel`
sur `digiy_reservations` à une réservation enregistrée dans
`digiy_loc_master_reservations`. Dans l'inventaire actuel des fonctions
`public` nommées `%master%` et `%cancel%`, aucune fonction
`digiy_loc_master_cancel_*` n'a été trouvée ; **ce n'est pas
la preuve qu'aucun autre mécanisme d'annulation n'existe**.

Plan de test de bout en bout **sur une véritable instance staging,
avec comptes et données fictifs** :

1. Accéder à une fiche publique dédiée, voir photos, règles,
   coordonnées et contacter le propriétaire, sans intermédiaire.
2. Ouvrir la demande dans WhatsApp (sans envoyer de message réel),
   vérifier le numéro, le logement et les dates.
3. Authentifier un propriétaire test par magic-link, confirmer
   le droit d'accès actif ; refus d'un autre propriétaire.
4. Enregistrer manuellement la demande en réservation MASTER,
   contrôler calendrier, liste et non-déclenchement des queues caducs.
5. Tester l'annulation **via le parcours canonique réellement utilisé**,
   jamais à travers une Edge de l'autre famille de tables.
6. Vérifier la doctrine paiement direct **sans opération financière
   réelle** ; tester les textes et liens, pas le transfert d'argent.
7. Valider une procédure de retour arrière et une approbation distincte
   pour fusion GitHub et application des corrections SQL.

**Blocage actuel :** aucune branche Supabase de test existante
(`list_branches` vide), et créer une branche/projet peut coûter ;
aucune dépense et aucune production modifiée. Il faut un staging
isolé déjà autorisé pour exécuter les étapes 1–7.

**Décision mise à jour :** PR #37 a été **fusionnée** le 2026-10-08
(commit `9069cba2f51c04c0cca34ac7a88f1d15041f8990`) et le
workflow GitHub Pages `37849939922` a réussi. Le rendu de
`fiche.html` n'a pas été vérifié en navigation complète avec une
fiche client réelle. **PR #36 reste BROUILLON / non fusionnée.**
Pas de redémarrage ou intégration PULSE/NDIMBAL ; aucune suppression
de table ni de données.

## Révision terrain de la chaîne Saly/Sarlat — 2026-10-08 (lecture seule)

### Entrées publiques réellement visibles

- `https://loc.digiylyfe.com/` présente les deux adhérents
  Chez Baptiste Saly et Sarlat ; les CTA **pointent vers leurs fiches
  personnalisées**, respectivement `part-chez-baptiste.digiylyfe.com`
  et `sarlat-chez-baptiste.digiylyfe.com`, et **non** vers
  `loc.digiylyfe.com/fiche.html`.
- Les deux pages de destination sont consultables publiquement
  (texte/structure observés via récupération Web, pas une session
  cliente authentifiée). Elles indiquent 0 % commission et
  paiement direct **après confirmation du propriétaire**.
- Conséquence : la correction PR #37 sécurise la **fiche générique**
  et ses éventuels liens directs ; ses 10 tests navigateur isolés
  ne testent PAS à eux seuls l'ensemble des calendriers Saly et Sarlat.
- L'affirmation « fiche générique corrigée » n'est donc pas
  interchangeable avec « tous les parcours de location validés ».

### Chaîne MASTER Saly confirmée en source

- `BEAUVILLE/part-chez-baptiste/index.html` définit
  `MASTER_UNIT_ID` et lit en **GET anonyme** les états du
  calendrier et les tarifs depuis les tables
  `digiy_loc_master_unit_calendar`,
  `digiy_loc_master_unit_prices`,
  `digiy_loc_master_units`. Les messages WhatsApp
  sont préparés pour le propriétaire et une demande publique
  n'enregistre pas directement une réservation automatique.
- `BEAUVILLE/part-chez-baptiste/gestion.html` utilise
  `auth.signInWithOtp`/`auth.verifyOtp` et sélectionne le site
  `saly-chez-baptiste`, puis appelle :
  `digiy_loc_master_list_reservations_v1`,
  `digiy_loc_master_save_reservation_v1`,
  `digiy_loc_set_unit_calendar_state_v2`.
- `BEAUVILLE/pro-espace/loc.html` utilise également les RPC MASTER
  pour le carnet, les dates et l'enregistrement d'une réservation ;
  cela ne prouve pas que chaque lien propriétaire déploie
  exactement cette entrée pour Sarlat. Le fichier source Sarlat
  n'a pas été rattaché avec certitude à un dépôt GitHub accessible.
- `BEAUVILLE/pro-loc/index.html` et les Edge
  `digiy-loc-owner-access` / `digiy-loc-magic-link`
  constituent une **autre porte de droit d'adhésion** ;
  ne pas la présenter comme la seule porte des fiches dédiées.

### Droits réels lus dans le catalogue SQL (aucune écriture)

- `anon` : SELECT sur
  `digiy_loc_master_unit_calendar`,
  `digiy_loc_master_unit_prices`,
  `digiy_loc_master_units`, sous RLS.
  La politique des unités limite les lignes publiques à
  `is_active=true`. La visibilité publique des calendriers
  et tarifs a des politiques `USING (true)`; elle doit être
  assumée comme donnée publique non personnelle.
- `authenticated` : SELECT des sites et réservations
  via politiques `owner_id=auth.uid()` ;
  les RPC MASTER réservation et calendrier sont exécutables
  par `authenticated`, **pas par `anon`**.
- Le SQL réel `digiy_loc_set_unit_calendar_state_v2`
  vérifie la propriété, limite les états à
  `available`, `occupied`, `closed`, et supprime
  une ligne de calendrier lorsqu'une date redevient disponible.
- Le snapshot de cette quatrième RPC a été ajouté aux tests
  synthétiques V29 pour vérifier : refus d'un autre propriétaire,
  refus d'un état invalide, fermeture/réouverture/occupation,
  avant et après désactivation des triggers caducs.
  **La preuve finale est le résultat du nouveau workflow CI**, pas
  la seule présence du fichier de test.

### Décision toujours ouverte sur l'annulation

La fonction Edge `reservation-cancel` touche
`digiy_reservations`, alors que Saly enregistre ses dossiers
dans `digiy_loc_master_reservations` et le calendrier dans
`digiy_loc_master_unit_calendar`. Une remise à `available`
dans le calendrier n'est **pas équivalente** à l'annulation de
la ligne de réservation MASTER. Il faut clarifier le parcours métier
canonique, puis tester l'effet sur **les deux données** ensemble,
en staging. Ne jamais lancer une annulation de client en production
pour vérifier le raccordement.

### Ce que cette revue ne prétend pas

Elle n'a pas validé l'envoi d'un vrai code OTP/magic-link, une
session propriétaire réelle, la réception WhatsApp, l'annulation
complète, un paiement Wave/Sendwave, ni une réservation écrite
en production. **Aucune branche Supabase staging n'existe**,
aucun environnement payant n'a été créé. Les anciens PULSE et
NDIMBAL restent caducs.

## Audit annulation et dépendances — résultat du contrôle du fondateur

**Retour terrain 2026-10-08 :** le fondateur confirme que le parcours
propriétaire et les changements de dates fonctionnent. Cette validation
n'est pas un test d'annulation d'une réservation nommée.

**Analyse complémentaire et tests négatifs :**
[`V29_MASTER_CANCELLATION_DEPENDENCIES.md`](V29_MASTER_CANCELLATION_DEPENDENCIES.md)
documente avec les sources réelles de quatre fonctions SQL que :

- `digiy_loc_set_unit_calendar_state_v2(...,'available')` supprime
  des dates d'occupation du calendrier, sans modifier une réservation
  enregistrée dans le carnet MASTER ;
- la fonction de création MASTER ne teste pas les chevauchements
  entre deux réservations ;
- les tests fictifs `master-cancellation-gap-test.psql` et
  `master-overlap-risk-test.psql` reproduisent ces deux comportements,
  **avant et après** la neutralisation PULSE/NDIMBAL.

**Attention aux résultats CI :** une suite verte sur ces deux sondes
signifie que les limitations ont été *confirmées*, non réparées.
La future annulation doit préserver l'historique client et recalculer
les disponibilités sans toucher à une autre réservation active.
Aucune écriture en production, aucun essai sur des données client.

**Dépendance structurelle :** les fonctions `digiy_agent_enqueue`,
`digiy_agent_job_status`, `digiy_market_apply_agent_result` et
`get_all_modules_status` référencent encore
`digiy_loc_pulse_outbox`. Ce constat **interdit une suppression
globale de la table** sur simple similarité de nom avec l'ancien
VPS PULSE, définitivement CADUC.
