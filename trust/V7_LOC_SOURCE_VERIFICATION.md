# DIGIY TRUST V7 — LOC : vérification de la source de vérité

## Périmètre
Audit **lecture seule** des métadonnées Supabase du projet `digiy-core` (8 octobre 2026). Aucune donnée nominative extraite; aucune modification de base.

## Tables LOC relevées
| Table | Éléments constatés | Limite pour TRUST |
|---|---|---|
| `digiy_loc_reservations` | `owner_id` (uuid), `client_name`, `phone`, `checkin`, `checkout`, `status`, `payment_status` | Propriétaire identifiable, client sans identifiant d'authentification dans les colonnes relevées; `status` non indépendant |
| `digiy_loc_master_reservations` | `guest_name`, `guest_phone`, `created_by` (uuid) | Créateur ≠ identité client prouvée |
| `loc_reservations` | `guest_name`, `phone`, `check_in`, `check_out`, `status` | Nom/téléphone et statut ne prouvent pas le séjour |
| `loc_reservations_public` | `status` | Pas d'identité client vérifiée dans les colonnes relevées |
| `loc_reservation_requests` | `owner_phone` | Demande ≠ séjour terminé |

**Important :** le relevé de colonnes ne prouve pas l'absence d'un mécanisme de preuve dans d'autres tables, fonctions ou services. Aucune table canonique n'est désignée à ce stade.

## DRIVER — observation connexe
`ride_requests` comporte `accepted_at`, `started_at`, `done_at`, `completed_at`, `assigned_driver_id`, `assigned_driver_phone`, `client_phone`. Ces données n'attestent pas indépendamment l'exécution. Le circuit `digiy_driver_ride_requests` reste distinct jusqu'à preuve de raccordement.

## Plan d'enquête LOC (sans écriture)
1. Identifier les écrans et RPC qui créent/modifient chacune des réservations.
2. Tracer les références entre fiche, unité, réservation et éventuel compte client.
3. Déterminer si une preuve indépendante existe réellement (confirmation client authentifiée ou autre attestation auditée).
4. Documenter la provenance et les droits d'écriture des transitions `completed`.
5. Si aucune preuve indépendante n'existe, concevoir un mécanisme **opt-in**, sans collecte excessive, sans déduire l'identité du seul numéro de téléphone.
6. Tester anti-rejeu, conflits de propriétaires, usurpation de client et soumissions concurrentes sur environnement isolé.

## Critères d'activation
- Identifiant canonique immuable de réservation, rattachement propriétaire et client authentifiés.
- Attestation indépendante de la seule déclaration du professionnel.
- Journal d'audit serveur et vérification atomique de l'unicité.
- Aucun statut fourni par le navigateur, PIN propriétaire ou paramètre `verified` ne peut lever le refus.
- Validation humaine, tests CI et revue sécurité avant déploiement.

**État : BLOQUÉ PAR PREUVE MANQUANTE.** Pas d'attestateur LOC opérationnel, pas d'invitation et pas de migration Supabase. Voir issue #10, V5 et V6.
