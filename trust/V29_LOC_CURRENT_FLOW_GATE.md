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

**Décision :** PR #36 sécurité et PR #37 contact restent toutes deux
**en brouillon / non fusionnées**. Pas de redémarrage ou intégration
PULSE/NDIMBAL ; aucune suppression de table ni de données.
