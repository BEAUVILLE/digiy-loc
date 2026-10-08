# DIGIY TRUST — moteur d'éligibilité isolé

Exécuter : `node --test trust/eligibility.test.mjs` (Node 18+).

Le module `eligibility.mjs` ne contient que des règles pures et des tests. Il n'est **pas raccordé à la vitrine** et ne prouve pas l'identité du client à lui seul. Les attributs `verifiedByServer` et `independentEvidence` doivent provenir d'un service sécurisé et jamais d'un formulaire client ou propriétaire.

**Avant mise en production** : construire l'attestation indépendante de prestation, le contrôle OTP/auth du client, l'invitation hachée à usage unique, la consommation transactionnelle et la contrainte unique SQL par prestation, la lecture publique agrégée, les tests d'intégration/RLS et l'interface. Aucun avis ne doit être accepté par le navigateur en écriture directe.
