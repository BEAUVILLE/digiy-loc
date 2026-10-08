# DIGIY TRUST V2 — Contrat d'attestation (proposition, non déployée)

## Principe
Une réservation, un paiement direct, une date passée, une valeur `completed` renseignée par le propriétaire, ou un clic non authentifié ne constituent **jamais** une preuve indépendante de prestation.

## Enveloppe serveur candidate
- `source_module` : valeur appartenant au registre autorisé.
- `source_event_id` : identifiant stable de prestation; unicité par module.
- `professional_id` : identifiant serveur du professionnel.
- `verified_client_subject` : identité vérifiée par serveur (jamais saisie libre).
- `completed_at` : date issue d'une source contrôlée.
- `proof_method` : méthode attestée et explicitement autorisée pour le module.
- `proof_reference` : référence interne non publique à une preuve auditable.
- `verified_at` et `verifier_id` : attestation effectuée par un vérificateur autorisé, distinct du propriétaire.
- `contract_version` : `trust_attestation_v2`.

## Contrôles obligatoires
1. Authentifier le client indépendamment du professionnel (OTP ou magic-link validé côté serveur).
2. Vérifier que la prestation a réellement eu lieu via un mécanisme indépendant et auditable. Un témoignage client authentifié peut contribuer à une preuve, mais la politique d'attestation par métier doit être définie et testée avant activation.
3. Refuser propriétaire = client, doublon d'événement, invitation expirée ou réutilisée.
4. Lier atomiquement attestation, invitation et avis via serveur/SQL avec RLS stricte.
5. Ne publier que des agrégats autorisés; ne jamais exposer identité, token ou preuve brute.
6. Tout module non audité reste désactivé; aucune méthode de preuve implicite.

## Compatibilité V1 et déploiement
V1 SQL n'autorise que `loc`, `resto`, `driver`. Ne pas modifier les CHECK en production avant audit, migrations dédiées, tests SQL/RLS et autorisation. Le registre JS V2 est descriptif et ne délivre **aucune** attestation. Ne pas brancher au navigateur ni envoyer d'invitations.

Suivi : issue #6.
