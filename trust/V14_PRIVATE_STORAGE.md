# DIGIY TRUST V14 — réception privée : modèle et revue de sécurité

## État
Proposition de schéma et tests **non déployés**. Ne pas activer `CFG.feedbackUrl` ni l'envoi du formulaire. Pas de clé dans le navigateur. La frontière V13 demeure fermée.

## Architecture proposée
Navigateur -> API HTTPS DIGIYLYFE -> vérification anti-bot et quotas serveur -> validation V12/V13 -> vérification logement dans la source canonique -> insertion privée -> réponse neutre.

Le serveur seul détient l'identifiant d'accès à la base. Le client n'envoie jamais `verifiedStay`, `published`, `moderationStatus`, identifiant propriétaire, téléphone ni e-mail.

### Protection et conformité
- Table dans le schéma `digiy_trust_private` **non exposé** par le Data API ; `REVOKE ALL` pour `PUBLIC`, `anon`, `authenticated`; RLS activé en défense supplémentaire.
- Aucun droit direct aux propriétaires, ni sélection publique des avis bruts.
- Les avis restent `received` et `stay_verified=false` à la réception.
- Publication seulement après consentement explicite, modération impartiale et action humaine autorisée, dans un flux séparé à concevoir.
- Limites de longueur, contenu UTF-8, anti-bot, anti-rejeu, quotas par source pseudonymisée, sans journaliser IP brute ou commentaire.
- Conservation et suppression : fixer la politique et l'accès du modérateur avant déploiement.
- Vérifier le nom canonique de l'identifiant logement et les clés de connexion réelles avant tout câblage.

## Ordre d'activation
1. Revue sécurité et conformité de la migration.
2. Création contrôlée du schéma privé après approbation.
3. Backend avec authentification de service, quotas, anti-bot et tests d'intégration.
4. Test d'écriture, de lecture refusée aux rôles publics et au propriétaire.
5. Activation explicite et progressive du lien `CFG.feedbackUrl` sur une fiche pilote.

Cette PR ne prétend pas fournir un endpoint fonctionnel.
