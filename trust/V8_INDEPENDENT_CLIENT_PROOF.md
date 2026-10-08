# DIGIY TRUST V8 — preuve client indépendante (conception, NON ACTIVÉE)

## Constat vérifié — audit SQL en lecture seule, 8 octobre 2026
Dans `digiy_loc_master_reservations`, les colonnes incluent `id`, `unit_id`, `guest_name`, `guest_phone`, `created_by`, `start_day`, `end_day`, mais **aucun `client_user_id` / `guest_user_id`**. Dans `digiy_loc_reservations`, `loc_reservations`, `loc_reservations_public` et `loc_reservation_requests`, les colonnes relevées ne permettent pas non plus d'attribuer indépendamment un séjour à un client authentifié.

Deux tables d'avis existent : `digiy_reviews` (`pro_id`, `rating`, `comment`) et `listing_reviews` (`listing_id`, `user_id`, `rating`, `comment`). Leur présence n'établit **aucun statut DIGIY TRUST vérifié**. Ne pas migrer, afficher ou requalifier leurs avis comme « vérifiés » sans audit distinct.

## Modèle de menace
- Le propriétaire peut créer une réservation et saisir le nom/téléphone du voyageur.
- Une réservation, un calendrier `occupied`, un statut `completed`, un PIN propriétaire ou un paiement direct ne prouvent pas un séjour.
- Le numéro de téléphone peut être partagé, mal saisi, usurpé ou réattribué; une simple possession de numéro ne prouve pas le séjour.
- Un client authentifié peut lui-même tenter d'attester une prestation inexistante; une seule auto-déclaration n'est pas une preuve indépendante suffisante.

## Proposition d'architecture (à valider, aucun déploiement)
1. **Liaison explicite et consentie** : le client ouvre une demande de rattachement à une réservation précise. Le serveur authentifie l'acteur; il ne déduit pas son identité du téléphone saisi par le propriétaire.
2. **Double vérification de provenance** : le backend retrouve la réservation dans la source canonique LOC (encore à identifier) et exige un événement de prestation provenant d'un circuit indépendant et auditable. Une déclaration client seule ne débloque pas l'invitation.
3. **Événement d'attestation** : identifiant d'événement immuable, source, réservation, acteur authentifié, horodatage serveur, méthode et version de preuve; aucune confiance dans les champs fournis par le navigateur.
4. **Garde atomique** : vérifier l'absence d'auto-avis, de doublon et de réutilisation d'attestation; bloquer la concurrence et le rejeu en transaction serveur.
5. **Vie privée** : minimiser la conservation des données, ne pas exposer le téléphone dans les jetons ou URLs, limiter les accès, journaliser sans divulguer les identifiants sensibles.
6. **Invitation** : seulement après vérification effective par un attestateur serveur de confiance, puis autorisation atomique et jeton à usage unique. Tant que cette infrastructure manque, `canIssueInvitation=false`.

## Contrat de décision V8
- `reservation_exists` : condition nécessaire, jamais suffisante.
- `owner_confirmed`, `calendar_occupied`, `client_claimed`, `phone_matched` : **REFUS** comme preuve unique ou combinaison d'auto-déclarations.
- `authenticated_client` : identité établie, mais séjour **non attesté**.
- `independent_service_evidence` : exigence à définir et vérifier contre la vraie source de vérité; aucune acceptation simulée.
- Toute preuve ambiguë, absente, expirée, contestée ou déjà utilisée : **REFUS**.

## Prochaines vérifications requises
- Tracer les producteurs et lecteurs de chaque table LOC pour choisir la source canonique.
- Examiner les droits d'écriture des tables d'avis existantes avant toute intégration.
- Identifier un signal de prestation réellement indépendant du propriétaire et du client, ou admettre explicitement qu'aucun n'existe aujourd'hui.
- Implémenter et tester uniquement dans un environnement isolé après validation de l'architecture : anti-rejeu, courses concurrentes, usurpation, contestation, révocation et RLS.

**Statut : V8 design / fail-closed.** Aucune invitation, aucune migration, aucun changement de données ou de production. Voir issue #10, V5–V7.
