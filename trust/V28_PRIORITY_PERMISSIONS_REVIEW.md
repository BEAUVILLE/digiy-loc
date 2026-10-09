# DIGIY SECURITY V28 — inventaire prioritaire et décisions à instruire

Statut : **audit en cours, documentation seule**. Base : `main` après V27. Aucun changement SQL, rôle, grant, policy, secret ou déploiement. Ne pas fusionner sans VERT distinct ; fusion ne vaut pas déploiement.

## Preuves vérifiées sur digiy-core (2026-10-08)

- `public` : 695 fonctions SECURITY DEFINER, dont 273 avec EXECUTE via PUBLIC.
- `publique` : 1 fonction SECURITY DEFINER avec EXECUTE via PUBLIC ; `publique.on_auth_user_created()` appartient à `postgres`, `search_path=publique`. USAGE schéma effectif pour anon/authenticated, pas pour PUBLIC en tant que tel. Fonction trigger, pas une RPC ordinaire.
- `private` : 6 / 0 via PUBLIC ; `vault` : 2 / 0.
- Six fonctions prioritaires ci-dessous : SECURITY DEFINER, propriétaire `postgres`, EXECUTE effectif pour PUBLIC/anon/authenticated, aucun trigger utilisateur associé au catalogue. Les dépendances cataloguées ne couvrent **pas** les appels des clients externes.
- Recherches de noms dans `BEAUVILLE/digiy-loc` sans résultat pour les noms recherchés : **absence de preuve d'usage, non preuve d'obsolescence**. Autres dépôts, Edge Functions et workflows à inventorier.

## Lot A : fonctions à instruire, aucune révocation autorisée

| Signature exacte | search_path en proconfig | Signal d'examen | Décision |
| --- | --- | --- | --- |
| `public.digiy_loc_check_cockpit_pin(text,text,text)` | `public` | PIN cockpit : préserver les clients légitimes | Garder, analyser validation et rate limiting |
| `public.digiy_loc_check_listing_access(text,text)` | absent | Contrôle d'accès logement | Analyser identifiants et qualification des appelants |
| `public.digiy_loc_outbox_claim_due(integer,text)` | `public` | File de messages ; usage serveur possible | Priorité haute, identifier worker avant révocation |
| `public.digiy_loc_set_photos_by_token(text,text,text,text[],text)` | `public` | Écriture sur photos ; jeton | Vérifier validation, expiration et portée du jeton |
| `public.digiy_pay_create_payment(text,integer,text,text,text,text,text,text,integer,text,jsonb)` | absent | Paiement ; impact commercial | Priorité haute, identifier flux et garde avant révocation |
| `public.digiy_resa_resto_owner_set_booking_status_v1(uuid,text)` | `public` | Mutation réservation propriétaire | Vérifier contrôle d'appartenance et parcours RESTO |

Les simples tests textuels sur le corps SQL détectent `auth.uid()` et `RAISE EXCEPTION` dans la fonction RESTO ; pas de référence textuelle à `auth.uid()` dans les cinq autres. Ce résultat **ne permet pas** de conclure à l'absence d'autorisation, ni à une vulnérabilité. Les corps et données sensibles ne sont pas publiés.

## Analyse d'impact et lot de corrections conditionnel

1. Pour `digiy_loc_outbox_claim_due(integer,text)`, cartographier le worker, le rôle DB, les appels et les tests de messages avant de proposer un éventuel `REVOKE EXECUTE ... FROM PUBLIC` par signature ; conserver explicitement le rôle du consommateur légitime. **Aucune commande de révocation livrée pour application.**
2. Pour `digiy_pay_create_payment(...)`, identifier si les clients publics doivent initier les paiements et les contrôles de montant, commande et identité ; envisager un chemin serveur dédié uniquement si compatible avec les clients existants.
3. Pour `digiy_loc_check_listing_access(text,text)`, corriger la configuration du chemin de recherche uniquement après vérification des références non qualifiées et tests.
4. Pour les autres fonctions, ne pas changer l'accès avant preuve d'usage et contrôle des gardes internes.
5. En parallèle, étudier une isolation serveur alternative pour TRUST : elle doit prouver l'absence de capacités indésirables héritées de PUBLIC, y compris sur relations d'extensions. Ne pas contourner le préflight V26.

## Tests requis avant toute PR corrective

- Sur base jetable PostgreSQL 16/17 : tester permissions par signature pour `anon`, `authenticated`, rôle serveur et consommateurs légitimes ; tests négatifs d'identité, token, propriétaire, paramètres et régression.
- Parcours LOC photos et accès propriétaire, réservation RESTO, outbox et paiement de bout en bout ; confirmer le refus des appels non autorisés sans perturber les appels légitimes.
- Vérifier les fonctions surchargées, les schémas API exposés, les Edge Functions, les appels inter-dépôts et workflows.
- Réexécuter V26 fail-closed et les suites TRUST ; inspecter les workflows de la PR. Ne pas tester contre la production en écriture.

## Limites et porte de décision

Ce document est un **premier lot d'audit**, pas un certificat de sécurité. Pas de revue manuelle exhaustive des corps, pas de matrice complète des 273 signatures, pas de preuve d'exposition Data API ni de couverture de tous les consommateurs. Aucune révocation ni déploiement proposé à ce stade. Le prochain changement devra être une PR séparée avec diff SQL ciblé, preuves de non-régression et VERT explicite de fusion ; déploiement sous validation distincte.
