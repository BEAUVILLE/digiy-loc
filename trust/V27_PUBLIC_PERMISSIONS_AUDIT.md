# DIGIY SECURITY V27 — audit transversal PUBLIC (lecture seule)

Statut : audit initial, **aucun changement de privilèges**, aucun déploiement autorisé.

## Constat vérifié le 2026-10-08 (digiy-core)

Requête d'inventaire sur pg_proc / pg_namespace, SECURITY DEFINER et has_function_privilege('public', oid, 'EXECUTE') :
- schéma public : 695 fonctions SECURITY DEFINER, dont **273** exécutables via PUBLIC ;
- schéma publique : **1** fonction SECURITY DEFINER exécutable via PUBLIC (accessibilité du schéma à confirmer) ;
- private : 6 SECURITY DEFINER, 0 exécutable via PUBLIC ; vault : 2, 0.

Répartition par préfixe dans public (non assimilable à une classification de sécurité) : digiy 130, rpc 16, swarm 13, loc 10, driver 9, verify 8, ba 7, get 7, resa 7, market 6.
Parmi les 130 fonctions de préfixe digiy, 93 portent un réglage search_path dans proconfig ; parmi les 16 rpc, 6. L'absence de search_path fixé est un signal d'examen, pas une vulnérabilité démontrée.

**Important :** ces chiffres sont des signaux d'audit, pas un nombre de vulnérabilités. Un rôle PostgreSQL hérite des droits PUBLIC même avec NOINHERIT. Le blocage fail-closed de V26 doit rester actif.

## Protocole V27

1. Exporter un inventaire *sans corps de fonction ni données privées* : schéma, signature, propriétaire, SECURITY DEFINER, EXECUTE PUBLIC/anon/authenticated/service_role, search_path, dépendances.
2. Identifier les fonctions invoquées par clients publics, magic-links, RPC et workflows ; distinguer fonctions nécessaires, obsolètes et inconnues.
3. Examiner séparément les corps des fonctions prioritaires et leurs contrôles d'identité/autorisation, en évitant toute exposition de secrets ou données privées dans les rapports.
4. Classer par risque : accès sensible / mutation privilégiée / absence de garde / chemin de recherche / usage public légitime. Ne jamais classer vulnérable sur le seul nom.
5. Proposer des révocations ciblées, par signature et avec analyse d'impact, **dans une PR distincte**. Aucun REVOKE global ou modification d'un autre module dans V27.
6. Tester sur base jetable les refus et les parcours métier autorisés, puis vérifier GitHub Actions et demander un VERT explicite pour toute fusion. Déploiement Supabase = autorisation distincte.

## SQL reproductible, lecture seule

```sql
BEGIN READ ONLY;
SELECT n.nspname AS schema_name,
       count(*) FILTER (WHERE p.prosecdef) AS definer_total,
       count(*) FILTER (WHERE p.prosecdef AND has_function_privilege('public',p.oid,'EXECUTE')) AS definer_public_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%'
GROUP BY 1 ORDER BY 3 DESC,1;
ROLLBACK;
```

## Frontières

Aucun changement production, aucun secret, aucune activation de formulaire TRUST. Ne pas désactiver le préflight V26. L'audit des dépendances et des fonctions n'est **pas encore terminé**.
