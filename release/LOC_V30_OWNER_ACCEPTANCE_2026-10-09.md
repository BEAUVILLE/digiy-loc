# DIGIY LOC V30 — fiche d'acceptation réelle propriétaire Saly / Sarlat

**Statut : À FAIRE / NO-GO** — créée le 2026-10-09, après réussite réelle de la restauration SQL DIGIY CORE. Ce document n'est PAS une attestation de test exécuté.

## Avant tout test

- [ ] Opérateur et propriétaires de Saly et Sarlat ont donné l'accord pour une séance contrôlée.
- [ ] Environnement et URL exacts identifiés ; vérification des versions déployées et de l'absence de versions copiées non auditées.
- [ ] Utiliser les sessions habituelles du véritable propriétaire, avec magic link / OTP **privés** ; ne communiquer ni lien d'accès, ni identifiant, ni capture avec données de voyageurs au dépôt, au chat ou à un CI.
- [ ] Aucun paiement DIGIY, aucune réservation invitée réelle, aucun envoi WhatsApp/SMS automatique, aucune relance des anciens PULSE ou NDIMBAL.
- [ ] Sous l'interface héritée actuelle, les contrôles doivent se limiter aux opérations **en lecture seule** (consulter une fiche, un calendrier et un historique). Les commandes de création/annulation V30 ne sont pas déployées à ce stade.

## Phase A — compatibilité avant migration V30 : contrôles sans écrire

| Test à faire avec l'accord du propriétaire | Saly | Sarlat |
| --- | --- | --- |
| Site exact, connexion propriétaire et identité du logement visibles | ☐ | ☐ |
| Calendrier historique se lit sans changement de dates | ☐ | ☐ |
| Historique des réservations existant accessible en lecture | ☐ | ☐ |
| Aucune fausse promesse de bouton « annuler » V30 quand la RPC n'existe pas | ☐ | ☐ |
| Aucune fuite de la fiche / du calendrier d'un autre propriétaire | ☐ | ☐ |
| Public : QR, lien de contact direct, paiement direct conservés | ☐ | ☐ |

**Arrêt immédiat** en cas d'accès étranger, d'authentification défaillante, d'état calendrier incohérent ou de fonction de mutation V30 visible prématurément.

## Phase B — candidats V30 en environnement autorisé / données de test seulement

**Ne commencer qu'après avoir isolé les essais des vraies données clients ET obtenu l'autorisation expresse correspondante.** Les tests Playwright actuels avec API simulées ne comptent pas comme validation propriétaire authentifiée.

| Vérification fonctionnelle | Saly | Sarlat |
| --- | --- | --- |
| Propriétaire A ne peut pas lire / annuler une réservation du propriétaire B | ☐ | ☐ |
| Une réservation fictive autorisée a un identifiant stable et apparaît dans le carnet | ☐ | ☐ |
| Deux réservations fictives chevauchantes ne peuvent pas être toutes deux enregistrées | ☐ | ☐ |
| Un calendrier occupé par réservation active refuse l'ouverture manuelle | ☐ | ☐ |
| Annulation explicite d'une réservation fictive, historique conservé | ☐ | ☐ |
| Deuxième annulation contrôlée : résultat idempotent, pas de double libération | ☐ | ☐ |
| Dates héritées (61 Saly, 20 Sarlat) restent bloquées, provenance inconnue | ☐ | ☐ |
| Si V30 est absent, lecture v1 possible mais annulation cachée ; sur refus d'accès, jamais de fallback permissif | ☐ | ☐ |
| Aucun effet de bord paiement / message / tiers | ☐ | ☐ |

## Phase C — approbation et observation production

- [ ] Tous les appelants **effectivement déployés** vérifiés ; plus aucun client direct-write calendar/reservations qui serait cassé par les révocations SQL. Le MAÎTRE `main` doit être corrigé ou explicitement déclaré non déployé/non actif.
- [ ] Les quatre PR du lot (serveur #38, Saly #12, Sarlat #7, MAÎTRE #10) ont un plan d'ordre de déploiement et de retour arrière approuvé.
- [ ] Nouvelle sauvegarde logique privée, préflight **8/8**, et snapshot 61+20 avant la migration.
- [ ] Autorisation **distincte et explicite** pour fusionner les interfaces, puis pour appliquer une migration SQL en production, avec opérateur présent et fenêtre de maintenance.
- [ ] Après SQL : `LOC_MASTER_V30_POSTCHECK_READONLY.sql` retourne `ok=true` ; 61+20 dates legacy d'origine inconnue toujours bloquées, sauf correction explicitement autorisée et tracée.
- [ ] Tests post-migration en sessions propriétaires autorisées, aucune réservation réelle non consentie, journal d'acceptation conservé **en privé**.
- [ ] Réversibilité opérationnelle confirmée **sans suppression aveugle** des statuts/annulations/dates historiques.

**Décision finale :** ☐ GO autorisé ☐ NO-GO maintenu.

Date / responsable technique / propriétaire(s) : à consigner **dans un dossier privé**, sans identité personnelle publiée dans GitHub.

**Règle de sûreté :** si une seule case requise manque, **NO-GO**. La vraie restauration SQL PASS lève le verrou de backup mais ne signe pas les vérifications ni les autorisations restantes.
