# DIGIY TRUST V13 — frontière de réception privée

## Statut
**Contrat purement local, fail-closed. Aucune API ni base modifiée.** V12 doit être fusionnée avant cette PR, car le module importe `feedback-contract.mjs`.

## Défenses nécessaires côté serveur
- POST JSON limité à 4 KiB et contrôles stricts des champs.
- Vérification réelle du logement, sans faire confiance à l'identifiant fourni par le navigateur.
- Quotas et anti-bot évalués par un service de confiance (les indicateurs de ce module sont **des paramètres de test**, pas des garanties).
- Table privée non exposée au Data API public, aucun SELECT/UPDATE propriétaire, RLS ou privilèges fermés par défaut.
- Conservation minimale, modération impartiale, consentement de publication, suppression à la demande et journal d'audit sans contenu personnel.
- Enregistrement idempotent et anti-rejeu à concevoir avant toute activation.
- Ne jamais donner `verifiedStay=true` depuis un formulaire ni créer d'avis publics automatiquement.

## Conditions d'ouverture
Le résultat reste toujours `deny` même si tous les indicateurs sont vrais : le backend de réception, la base privée et la vérification indépendante du séjour ne sont pas implémentés. Ce module ne doit pas être présenté comme un endpoint prêt à l'emploi.

## Validation
Exécuter `node --test trust/feedback-contract.test.mjs trust/private-intake-boundary.test.mjs` après fusion de V12; vérifier aussi les contrôles CI.
