# DIGIY TRUST V5 — registre des sources de vérité (audit exploratoire)

**Statut : non déployable.** Constats fondés sur une inspection de métadonnées et de quelques fonctions SQL du projet Supabase `digiy-core`. Ne constitue pas une certification complète de sécurité.

## LOC — plusieurs modèles coexistent

- `digiy_loc_reservations` : `owner_id`, `room_id`, `checkin`, `checkout`, `status`, `payment_status`.
- `digiy_loc_master_reservations` : `unit_id`, `start_day`, `end_day`, `created_by`.
- `loc_reservations` : `business_code`, `check_in`, `check_out`, `status`.
- `loc_reservations_public` : `pin_slug`, `start_date`, `end_date`, `status`.
- `loc_reservation_requests` : `id`, `pin_slug`, `logement_title`, `owner_phone`, `created_at`; ce n'est pas un journal de séjours achevés.

**Décision :** aucune table ne devient automatiquement source de preuve; vérifier le parcours propriétaire, les identifiants et les transitions serveur.

## RESTO — statut propriétaire

`digiy_resa_resto_bookings` conserve le statut. La RPC `digiy_resa_resto_owner_set_booking_status_v1` contrôle le propriétaire via `auth.uid()`, puis lui permet de choisir `completed`. Cela atteste une déclaration du propriétaire, pas une prestation indépendamment vérifiée.

## DRIVER — deux circuits à distinguer

- `digiy_driver_ride_requests` : `client_id`, `assigned_driver_id`, `status`.
- `ride_requests` : manipulée par `digiy_driver_complete_ride` et `driver_done_ride` (à auditer plus complètement).
- `driver_done_ride` valide un PIN conducteur et inscrit `done`; `digiy_driver_complete_ride` inscrit `completed` pour une course affectée au téléphone conducteur. Ni l'un ni l'autre ne fournit, seul, une confirmation indépendante du client.

## Sécurité observée

RLS activée sur les tables principales inspectées; `loc_reservation_requests` sans politique relevée. Certaines RPC `SECURITY DEFINER` sont exécutables par `anon` et `authenticated`. Vérifier leurs corps et privilèges avant toute conclusion de vulnérabilité.

## Critères d'acceptation V5

1. Identifier pour chaque module le système canonique et son identifiant immuable de prestation.
2. Tracer l'origine de chaque transition et les rôles autorisés (client, professionnel, serveur).
3. Vérifier l'identité client et une attestation **indépendante du seul professionnel**; distinguer « déclaré terminé » de « vérifié ».
4. Exiger preuve vérifiable, anti-rejeu, unicité, horodatage serveur, journal d'audit et refus par défaut.
5. Tester avec scénarios négatifs et doubles soumissions dans une base isolée.
6. Aucun déploiement SQL ni émission d'invitation avant revue et validation explicite.

Voir issue #10. Les blocages d'accès SQL lors de la poursuite de l'audit empêchent de conclure sur les colonnes et RPC non inspectées.
