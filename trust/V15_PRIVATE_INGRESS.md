# DIGIY TRUST V15 — raccord serveur préparatoire

## Ce qui est implémenté
Un adaptateur pur pour un futur serveur DIGIYLYFE. Il exige des dépendances serveur explicites mais refuse **tous** les envois et n'écrit jamais en base. Tests de refus, aucune clé, aucune route publique.

## Audit réel (lecture seule)
Dans Supabase, `public.digiy_loc_master_units.id` est de type UUID et `public.digiy_loc_master_reservations.unit_id` est aussi UUID. Il faut choisir un identifiant canonique de logement et vérifier son exposition autorisée, sans supposer que tous les modules LOC utilisent cette même table.

## Avant ouverture
1. Revoir le schéma V14 : remplacer `listing_id text` par la référence canonique adéquate après vérification des données et des FK; vérifier les droits du schéma.
2. Choisir l'environnement serveur, les secrets et l'origine HTTPS autorisée; aucune clé de service dans le client.
3. Implémenter quotas persistants, anti-bot, contrôle des logements, validation V12/V13, anti-rejeu et insertion atomique en stockage privé.
4. Tester la sécurité en intégration, y compris refus de lecture `anon`, `authenticated`, propriétaire et refus de toute publication automatique.
5. Fixer la politique de conservation et la procédure de suppression des données avant activation.

**Pas de déploiement, pas de collecte, pas d'avis vérifié.**
