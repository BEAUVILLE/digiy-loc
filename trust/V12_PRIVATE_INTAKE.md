# DIGIY TRUST V12 — formulaire et contrat de réception privée

## Portée de cette PR
- Contrat de validation pure, testé localement par Node, pour retours volontaires LOC.
- Prototype de formulaire **non connecté** (dans `trust/feedback-form-preview.html`).
- **Aucune API, table, RPC, politique RLS, clé ni publication déployée.** La soumission reste désactivée jusqu'à la revue du service d'ingestion.
- La validation du navigateur ou de ce module n'est **pas** une preuve d'identité ni de séjour.

## Données strictement nécessaires
`listingId`, note globale 1–5, sous-notes facultatives 1–5, commentaire facultatif (1500 caractères max), déclaration personnelle de séjour, consentement de publication (booléen), version du contrat. **Pas de nom, téléphone ou e-mail obligatoire**. Pas de jeton d'avis « vérifié » fourni par le navigateur.

## Réception cible, non implémentée
1. Route HTTPS dédiée sur un serveur contrôlé par DIGIYLYFE, avec contrôles anti-bot, quotas, taille et origine.
2. Valider à nouveau côté serveur les champs, le logement existant, la version et les limites.
3. Stocker les retours dans un espace privé avec accès uniquement aux agents de modération autorisés; pas de SELECT public ni propriétaire.
4. Enregistrer la preuve de consentement et les dates de conservation, permettre demande de suppression, gérer les abus sans filtrer les avis négatifs.
5. Séparer clairement `feedback_received`, `feedback_reviewed`, `published`, `stay_verified`. La validation de forme n'autorise aucune transition automatique.
6. Réponse neutre et non révélatrice; ne jamais inclure de coordonnées dans l'URL ou les logs. Tester anti-rejeu, CSRF/CORS, spam, injections et volumétrie avant activation.

## Raccordement
La fiche maître `BEAUVILLE/digiy-master-modeles/MASTER-LOC-V1/index.html` possède déjà `CFG.feedbackUrl`, caché par défaut. Ne configurer ce lien qu'après revue et déploiement effectif du backend. Ne pas activer sur des fiches réelles pour le moment.
