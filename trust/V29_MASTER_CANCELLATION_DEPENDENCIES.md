# DIGIY SECURITY V29 — Annulation MASTER et dépendances résiduelles
**Audit en lecture seule : 8 octobre 2026 · Aucune modification de la base `digiy-core`.**

## Résultat important : « Disponible » ≠ « Réservation annulée »

Le fondateur a personnellement vérifié son accès propriétaire et les
changements de dates (retour terrain positif). L'audit du code et des
fonctions SQL confirme que le changement de statut du calendrier
fonctionne indépendamment du **carnet des réservations MASTER**.

Le catalogue réel lu en `SELECT` montre :

- `public.digiy_loc_master_save_reservation_v1(...)` crée une ligne
  dans `digiy_loc_master_reservations` puis marque les jours concernés
  `occupied` dans `digiy_loc_master_unit_calendar`.
- `public.digiy_loc_set_unit_calendar_state_v2(...,'available')`
  **efface les lignes de dates** du calendrier, sans modifier les
  réservations du carnet.
- `public.digiy_loc_master_list_reservations_v1(...)` lit le carnet
  **sans filtre d'annulation**.
- Le schéma actuel de `digiy_loc_master_reservations` n'a ni colonne
  `status`, ni `cancelled_at`; aucun trigger applicatif MASTER n'a
  été relevé sur cette table et le calendrier.
- `BEAUVILLE/part-chez-baptiste/gestion.html` et
  `BEAUVILLE/pro-espace/loc.html` exposent les boutons
  **Disponible / Occupé / Fermé** et le carnet, mais aucune action
  `cancel`/annulation rattachée à une ligne MASTER n'a été repérée
  dans ces fichiers.
- L'Edge `reservation-cancel` opère sur
  **`digiy_reservations`**, une autre famille de tables : **ne pas
  l'appeler sur le carnet MASTER**.

**Conclusion technique :** un propriétaire peut libérer un jour tout en
conservant une fiche de séjour dans son carnet. Cela ne signifie pas
qu'une vraie réservation de client a été perdue ou annulée en
production ; **aucune réservation de client n'a été testée/modifiée**.

## Autre conséquence : possible chevauchement de réservations

Le SQL réel de `digiy_loc_master_save_reservation_v1` ajoute une
réservation sans vérifier l'absence d'autres réservations sur la même
période. Il utilise `ON CONFLICT` uniquement pour les *lignes du
calendrier*, pas une contrainte d'unicité des séjours.

Avec **deux réservations synthétiques qui se chevauchent**, libérer les
jours associés à la première peut faire apparaître comme disponibles
des nuits toujours couvertes par la seconde.

C'est un **risque fonctionnel démontré en fixture**, pas la preuve
que des réservations réelles se chevauchent aujourd'hui.

## Preuves isolées, sur fonctions réelles rejouées

Dans `trust/sql/v29/` :

- `modern-contract-fixture.psql` : snapshots des fonctions SQL réelles
  de fiche publique / sauvegarde / lecture / changement d'état, mais
  tables, UID et contacts entièrement **fictifs** ;
- `master-cancellation-gap-test.psql` : créer une réservation fictive,
  libérer ses trois dates, vérifier que le carnet contient toujours
  la fiche, puis `ROLLBACK` ;
- `master-overlap-risk-test.psql` : créer deux réservations fictives
  chevauchantes, libérer des dates couvertes par les deux, vérifier
  l'incohérence calendrier/carnet, puis `ROLLBACK` ;
- `run-modern-ci.sh` : exécuter les contrôles MASTER **avant et après**
  l'isolation ciblée des déclencheurs PULSE (8) / NDIMBAL (1),
  uniquement sur PostgreSQL jetable 16 et 17.

**Sémantique des tests :** une exécution verte signifie que l'on a
correctement **reproduit et documenté les limitations actuelles**,
PAS que l'annulation et la prévention des doublons sont corrigées.
Un vrai test d'annulation devra échouer tant que ces fonctions métier
n'auront pas reçu de correction.

## Impact V29 sur les modules adjacents

Le catalogue des définitions `pg_proc` montre :

| Domaine | Dépendance observée | Décision de périmètre |
| --- | --- | --- |
| Réservation / calendrier MASTER | `digiy_loc_master_reservations` et `digiy_loc_master_unit_calendar` | Aucun appel PULSE/NDIMBAL dans les quatre fonctions MASTER isolées contrôlées |
| Anciennes files LOC | `digiy_loc_outbox` / `digiy_loc_pulse_outbox` | Conserver les tables et historiques, ne supprimer aucun objet en bloc |
| Fonctions d'agents, hors réservation | `digiy_agent_enqueue` et `digiy_agent_job_status` utilisent `digiy_loc_pulse_outbox` | **Important :** ce nom historique ne suffit pas à conclure que toute la table est caduc |
| MARKET et supervision | `digiy_market_apply_agent_result` et `get_all_modules_status` consultent aussi `digiy_loc_pulse_outbox` | Ne jamais retirer cette table ou sa visibilité sans audit séparé des appelants |
| NDIMBAL autre périmètre | vues `v_ndimbal_annonces_admin`, `v_ndimbal_loc`, fonctions `ndimbal_*` | Aucun effacement, réactivation ou migration NDIMBAL dans V29 |
| Fonctions historiques worker | huit signatures OUTBOX / PULSE ciblées en candidates ACL | Vérifier les droits effectifs; ne modifier que les EXECUTE explicitement autorisés dans un déploiement distinct |
| Paiement / propriétaires legacy | `trg_digiy_loc_reservation_to_pay`, `trg_res_set_owner`, `trg_res_updated_at` | Ces trois déclencheurs restent **actifs et protégés** dans les candidats V29 |

Ces liens sont **des références dans des définitions SQL**, pas une
mesure d'activité live de chaque agent/service. Le **VPS PULSE reste
CADUC et ne doit jamais être relancé**. La présence d'une table
historiquement nommée « pulse » dans d'autres fonctionnalités ne
réhabilite pas cet ancien worker.

## Proposition de correction future, NON déployée

Conserver la doctrine **contact direct, paiement direct, 0 % commission**,
ainsi que l'historique métier du propriétaire.

Une annulation robuste exige une **action explicite sur une réservation
identifiée** ; changer seulement une date « Occupé » en « Disponible »
ne suffit pas et ne doit pas annuler implicitement un séjour.

Proposition à instruire dans un chantier séparé :

1. Définir les états métier des réservations MASTER
   (`active`, `cancelled`, et éventuellement `completed`) avec
   horodatage, auteur et motif ; **préserver l'historique**.
2. Écrire une RPC atomique et propriétaire-authentifiée
   `digiy_loc_master_cancel_reservation_v1(p_reservation_id, ...)`.
   Vérifier `auth.uid()` et l'unité du propriétaire ; verrouiller les
   lignes concernées ; éviter les annulations étrangères.
3. Recalculer les seules dates du séjour **sans libérer** une nuit
   toujours bloquée par une autre réservation active ou une fermeture
   manuelle. Veiller aux modifications concurrentes.
4. Durcir également la création de séjour pour empêcher deux
   réservations actives qui se chevauchent, **sans transformer une
   demande WhatsApp en réservation automatique**.
5. Mettre à jour le carnet propriétaire, tester Saly/Sarlat,
   renvoyer le bon statut et permettre une annulation contrôlée.
6. Ajouter des scénarios négatifs : double annulation idempotente,
   propriétaire étranger, mauvais identifiant, chevauchement,
   dates fermées, reprise après erreur, historique conservé.
7. Faire valider **séparément** les changements schéma et les interfaces,
   puis les tester sur **staging autorisé** avant toute production.

Le schéma précis reste **à valider** avec le fondateur. Aucune migration
MASTER d'annulation n'est fournie ni appliquée par ce dossier.

## Décision pour la PR #36

- ✅ Contrôle terrain du fondateur : accès et changements de dates.
- ✅ Audit en lecture seule des quatre RPC MASTER, droits et dépendances.
- ✅ Tests isolés de séparation PULSE/NDIMBAL et des comportements
  MASTER connus.
- ❌ Annulation MASTER cohérente et prévention des chevauchements :
  **non implémentées**, à traiter à part.
- ❌ E2E connecté/staging des annulations et paiements : non exécuté.
- 🔒 Production `digiy-core` en lecture seule; **PR #36 DRAFT**,
  pas de fusion ni application SQL sans nouveau feu vert explicite.
