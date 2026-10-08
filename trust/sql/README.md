# DIGIY TRUST — revue de migration avant production

La migration `sql/001_trust_schema.sql` est un **projet non appliqué**. Elle ne crée ni RPC ni Edge Function publique et ne permet aucun vote depuis un navigateur.

## Transaction obligatoire côté serveur

1. Vérifier identité du client (OTP/auth) et preuve indépendante de prestation.
2. Valider les critères et notes côté serveur.
3. Démarrer transaction ; sélectionner invitation `FOR UPDATE` par empreinte du jeton.
4. Vérifier expiration, non-consommation, réservation et client lié à l'invitation.
5. Insérer une évaluation, puis renseigner `consumed_at`, puis COMMIT.
6. En cas d'erreur, ROLLBACK complet. L'unicité par prestation empêche les doublons même en concurrence.

## Bloquants avant application

- Attestation indépendante de prestation réelle, notamment pour LOC sans identifiant client authentifié.
- Preuve de contrôle du téléphone/email du client, sans dépendre d'une saisie propriétaire.
- Transaction serveur réelle (RPC contrôlée ou backend), pas de séquence de requêtes REST séparées.
- Revue SQL : contraintes de validité JSON des notes, liaison client, politique de conservation et suppression.
- Tests SQL de concurrence, RLS, annulation, token expiré, double soumission, absence de fuite et rollback.
- Validation explicite avant toute migration de la base de production.
