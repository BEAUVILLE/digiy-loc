# DIGIY TRUST V3 — preuve terrain : pilote LOC / RESTO / DRIVER

## Constatations de lecture seule

- **RESTO** : `digiy-resto/resa-resto/gestion.html` appelle `digiy_resa_resto_owner_set_booking_status_v1` pour modifier un état, notamment `completed`. Cet état piloté par le propriétaire ne prouve pas une prestation indépendamment.
- **DRIVER** : `digiy-driver/gestion.html` expose disponibilité et tarifs, sans attestation indépendante de course dans cette page.
- **LOC** : `digiy-loc/app.html` utilise `loc_reservation_requests` pour des demandes; une demande ne prouve pas un séjour.

## Contrat de sécurité

`evidence-policy.mjs` ne traite que des candidats de preuve. Même si le candidat est complet et annonce une source indépendante, il retourne toujours `canIssueInvitation:false`. Les valeurs envoyées par un navigateur ou un professionnel ne prouvent ni identité ni prestation. Aucun avis ne peut être créé par cette fonction.

## Pour aller plus loin

1. Auditer les tables, RPC, RLS et événements réels de chaque module sur une base de test.
2. Choisir un vérificateur indépendant du professionnel et un moyen d'authentifier le client côté serveur.
3. Tester la liaison client-prestation, les faux événements, l'usurpation, les doubles invitations et la concurrence.
4. Activer module par module seulement après tests E2E et approbation explicite.

**Pas de migration SQL, pas de connexion production, pas d'envoi d'invitations, pas d'avis publics dans cette PR.** Tests de refus seulement, pas de preuve terrain.
