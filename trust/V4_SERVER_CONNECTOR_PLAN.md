# DIGIY TRUST V4 — connecteurs d'attestation, phase sans déploiement

Les adaptateurs V4 sont des **contrats de refus**. Ils ne lisent pas Supabase et n'émettent aucun avis.

| Module | Source candidate observée | Limite de preuve |
|---|---|---|
| LOC | `loc_reservation_requests` (demandes dans `digiy-loc/app.html`) | Une demande ne prouve pas un séjour réalisé |
| RESTO | `digiy_resa_resto_bookings` (gestion propriétaire dans `digiy-resto/resa-resto/gestion.html`) | Le propriétaire peut sélectionner `completed`; preuve non indépendante |
| DRIVER | Commande/contact direct et gestion chauffeur (`digiy-driver`) | Pas de preuve de course indépendante confirmée dans les pages inspectées |

## Prérequis de raccordement
1. Audit serveur Supabase en lecture seule : schémas réels, fonctions RPC, permissions, RLS, horodatages et provenance des événements.
2. Choisir une source de preuve indépendante pour chaque métier et documenter son niveau de fiabilité. Une confirmation client seule ne prouve pas nécessairement la réalisation.
3. Authentification client indépendante, séparation des rôles, unicité et protection contre rejouement.
4. Implémentation serveur, tests SQL/Node et E2E sur environnement de test; revue de sécurité et autorisation explicite avant activation.

Aucune migration, aucun appel réseau, aucune clé ni changement de production dans cette PR.
