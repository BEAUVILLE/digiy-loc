# DIGIY TRUST V6 — proof gate (préparation)

Cette étape introduit un garde-fou **purement déterministe** et volontairement fermé, pas un attestateur opérationnel. Il recoupe module, événement, professionnel et client; rejette les déclarations d'acteurs intéressés; refuse même un prétendu `independent_server_attestor` fourni par l'appelant.

## Pour débloquer ultérieurement une invitation

1. Identifier le circuit LOC canonique et la réservation immuable; documenter le lien entre réservation, séjour achevé et client.
2. Mettre en place un service serveur authentifié dont l'identité ne peut pas être injectée par l'appelant.
3. Vérifier une preuve indépendante du seul propriétaire et de son statut `completed`.
4. Vérifier l'anti-rejeu, la fraîcheur, l'unicité de l'événement et le journal d'audit dans une transaction atomique.
5. Tester en environnement isolé, y compris auto-évaluation, événement modifié, preuve réutilisée et soumission concurrente.
6. Exiger une nouvelle revue avant toute activation, migration Supabase ou émission d'invitation.

**Aucun chemin de succès dans V6.** `canIssueInvitation` reste `false` dans tous les cas. Voir issue #10 et V5_SOURCE_OF_TRUTH_AUDIT.md.
