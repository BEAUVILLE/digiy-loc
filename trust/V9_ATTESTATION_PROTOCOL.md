# DIGIY TRUST V9 — protocole d'attestation (non opérationnel)

## Livrable
`attestation-protocol.mjs` valide uniquement la **forme** d'une enveloppe candidate et délègue d'abord à V6. Toutes les décisions retournent `deny` et `canIssueInvitation:false`. Une enveloppe entièrement renseignée et forgée reste refusée.

Champs proposés : `protocolVersion`, `attestationId`, `reservationId`, `serviceEventId`, `actorId`, `evidenceDigest`, `attestedAt`, `evidenceRefs`; et les champs de liaison V6 (module, événement, professionnel, client, source de confirmation).

**Ces champs ne sont pas des preuves.** Les références multiples ne prouvent pas l'indépendance des sources; le digest n'est ni recalculé ni authentifié; l'identité de l'acteur et la provenance restent invérifiables côté fonction pure.

## Prérequis pour un futur attestateur serveur
1. Choisir et documenter une source de vérité LOC canonique avec un identifiant stable.
2. Définir quel événement atteste réellement le séjour et qui peut l'émettre; ne pas confondre propriétaire, client et tiers indépendant.
3. Authentifier l'acteur côté serveur, vérifier son autorisation et la provenance de chaque événement.
4. Lier l'attestation à la réservation, au client, au professionnel et à la version de protocole.
5. Définir une fenêtre temporelle, une révocation et des preuves d'audit consultables par OPS.
6. Empêcher le rejeu et les doublons par contrainte unique et transaction atomique en environnement isolé.
7. Tester les cas adversariaux avant revue de sécurité, autorisation explicite et migration éventuelle.

## Tests
`node --test trust/attestation-protocol.test.mjs` — 12 cas de refus, dont enveloppe forgée apparemment complète. Le workflow CI doit confirmer le résultat; aucun succès n'est présumé avant exécution.

**Aucune migration Supabase, aucun accès réseau, aucun jeton d'invitation, aucune attestation de production.** V9 n'est ni une preuve indépendante ni une autorisation d'avis.
