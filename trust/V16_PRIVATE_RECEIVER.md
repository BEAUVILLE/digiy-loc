# DIGIY TRUST V16 — service de réception privé (bibliothèque serveur)

## Livré
`receivePrivateFeedback` accepte un avis volontaire validé V12 uniquement lorsque les quatre contrôles de confiance fournis par le serveur réussissent : anti-bot, quota, logement actif, stockage privé. Le récepteur construit lui-même les champs de modération et interdit toute attestation automatique. Les réponses n'exposent aucune donnée privée. Tous les contrôles échouent en mode fermé.

## Non livré
Aucune route HTTP publique, aucun déploiement, aucune clé de service, aucun stockage réel et aucune garantie de quotas distribués : les quatre adaptateurs sont à raccorder et à tester en intégration avant activation. Le SQL V14 n'est pas exécuté.

## Points à vérifier avant pilote
- Le logement canonique doit correspondre à un `digiy_loc_master_units.id` UUID actif (ou adapter le contrat si d'autres modules utilisent un identifiant différent).
- Une politique de conservation des avis et la suppression doivent être validées.
- Quotas persistants et atomiques, vérification anti-bot côté serveur, contrôle des origines, taille réelle du corps HTTP et protection contre rejeu.
- Stockage privé Supabase non exposé; test de refus pour `anon`, `authenticated` et propriétaire.
- Revue des droits serveur, journaux sans données personnelles, sauvegarde, supervision et contrôle de modération.
- Publication publique uniquement dans un service séparé après consentement et validation humaine.
