# DIGIY TRUST V10 — inventaire des preuves de séjour

## Audit en lecture seule (Supabase digiy-core, 8 octobre 2026)

Recherche dans `information_schema.columns` des colonnes associées à `checkin`, `checkout`, `checked_in`, `guest_confirm`, `attest`, `verified`, `client_confirm` :
- `digiy_loc_reservations.checkin` et `checkout` sont des **dates prévues**, non des événements de présence.
- `loc_wave_declarations.verified_at` et `verified_by` existent, avec `owner_id`, `client_name`, `client_phone`, `amount_fcfa`, `status`, `declared_at`. Cela décrit un circuit de **déclaration/vérification de paiement**, pas une attestation indépendante de séjour.
- `digiy_build_public_profiles.is_verified` et `digiy_pos_public_profiles.is_verified` concernent des profils; aucune preuve de séjour LOC ne s'en déduit.
- Aucun champ explicitement nommé `checked_in`, `guest_confirmed`, `client_confirmed` ou `attestation` n'est apparu dans **cette recherche ciblée**. Cela ne prouve pas qu'aucun autre signal n'existe dans les applications, logs, autres schémas ou services.

## Classification de confiance
| Signal | Interprétation permise | Suffisant pour avis vérifié ? |
| --- | --- | --- |
| Réservation créée | Intention / blocage calendrier | Non |
| Dates checkin/checkout | Période programmée | Non |
| Paiement direct ou déclaration Wave | Paiement déclaré ou enregistré | Non |
| Paiement marqué vérifié | État de vérification de paiement, selon son circuit | Non |
| Message du client | Déclaration de l'intéressé | Non |
| Validation du propriétaire | Déclaration de l'intéressé | Non |
| Présence horodatée authentifiée par source indépendante, liée à la réservation | Candidat à l'audit de provenance | Pas avant vérification serveur et anti-rejeu |

## Décision
**Aucune source actuellement auditée ne constitue une preuve de séjour indépendante et suffisante.** Ne pas utiliser `loc_wave_declarations` comme substitut d'attestation. Le statut TRUST reste désactivé; aucune invitation ni migration.

## Étapes avant un éventuel pilote isolé
1. Retracer la provenance et les permissions des déclarations Wave, sans lire de données personnelles.
2. Cartographier les applications LOC et leurs écritures d'événements réels; vérifier l'existence d'un tiers de confiance indépendant.
3. Définir une procédure de contestation et un traitement humain si aucune attestation technique indépendante n'est possible.
4. Exiger preuve d'identité, preuve de service, liaison atomique, non-répudiation adaptée, anti-rejeu, minimisation et tests adversariaux.
5. Garder V6/V9 **fail-closed** jusqu'à un audit favorable et une autorisation explicite.

## CI
V9 ajoute 12 cas négatifs. V10 ajoute un workflow dédié exécutant explicitement `node --test trust/attestation-protocol.test.mjs`; vérifier les logs du nouveau workflow sur la PR. Ne pas confondre réussite d'un workflow historique et couverture des nouveaux tests.
