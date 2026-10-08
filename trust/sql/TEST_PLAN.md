# DIGIY TRUST — scénarios d'intégration SQL (à exécuter en base de test uniquement)

Le fichier `002_trust_atomic_submit.sql` propose une transaction atomique PostgreSQL via une fonction `SECURITY INVOKER` réservée à `service_role`. **Ce n'est pas une preuve de déploiement ni de validation SQL.**

## Tests bloquants

| Cas | Résultat attendu |
| --- | --- |
| Client vérifié, prestation indépendamment attestée, invitation valide | 1 review, invitation consommée |
| Deux appels concurrents avec même invitation | 1 seule review, deuxième refusé |
| Invitation expirée | Aucune review |
| Jeton inconnu | Aucune review |
| Identité client non concordante | Aucune review |
| Note 0, 6, 4.5, chaîne ou critère hors métier | Refus sans consommation |
| Collision de réservation déjà notée | Refus, rollback complet |
| Appel anon/authenticated de la fonction | Permission refusée |
| Lecture directe des invitations par anon/authenticated | Permission refusée |
| Annulation ou prestation non réalisée | Aucune invitation émise en amont |
| Exception entre INSERT et UPDATE | Transaction entièrement annulée |

## Risques non résolus

1. La fonction **ne prouve pas** la prestation et n'authentifie pas le client : seul le serveur doit lui fournir un jeton haché et une identité vérifiée. La fonction ne doit jamais être appelée directement avec des paramètres issus du navigateur.
2. Il manque l'Edge Function d'émission, une vraie source d'attestation et l'OTP/auth du client.
3. Le schéma SQL doit être revu et exécuté dans un environnement de test avant toute migration en production.
4. Le serveur doit limiter les tentatives, éviter les fuites d'existence d'invitations et journaliser les abus sans exposer les secrets.
5. Les données personnelles doivent avoir une politique de conservation et de suppression.
