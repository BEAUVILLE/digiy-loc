# DIGIY TRUST V11 — retour d'expérience volontaire (spécification, non déployée)

## Décision produit
Chaque fiche publique DIGIY LOC pourra proposer un bouton discret **« ⭐ Donner mon avis sur mon séjour »**. Participation **libre et facultative**, sans sollicitation imposée par le propriétaire. Le client saisit directement sa réponse sur DIGIYLYFE; le propriétaire n'a aucun droit d'écriture sur les réponses.

## Parcours cible
1. Bouton public sur la fiche LOC; pas de collecte obligatoire de téléphone ou d'e-mail et pas de partage préalable de coordonnées par le propriétaire.
2. Page de retour d'expérience affichant le logement concerné et un avertissement clair : « Votre retour ne sera pas automatiquement publié comme séjour vérifié. »
3. Formulaire mobile : note globale (1–5), propreté (facultatif), confort (facultatif), accueil (facultatif), commentaire libre (facultatif), consentement explicite à une éventuelle publication, confirmation « J'ai personnellement séjourné ici ».
4. Le serveur reçoit le retour directement, sans exposition au propriétaire avant modération. Réponse privée par défaut, accusé de réception neutre.
5. Traitement anti-spam, anti-doublon, modération équitable des avis positifs et négatifs, contestation possible, conservation limitée et information RGPD / loi applicable.
6. Seuls les avis dont l'authenticité est établie par un processus audité peuvent porter la mention **« séjour vérifié »**. Une auto-déclaration ne suffit jamais.

## Distinction impérative
- `feedback_received` : témoignage volontaire reçu, **non vérifié**, non publié automatiquement.
- `feedback_reviewed` : contenu contrôlé (abus, données personnelles, propos illicites), **sans validation de séjour**.
- `stay_verified` : **désactivé** jusqu'à preuve indépendante, liée à un séjour réellement accompli, vérifiée côté serveur.
- `published` : décision éditoriale séparée, après consentement et politique de modération transparente; jamais synonyme de `stay_verified`.

## Menaces
- Le propriétaire peut déposer un avis en se faisant passer pour un client, ou inviter seulement des clients satisfaits.
- Un visiteur peut donner un avis sans avoir séjourné.
- Un même client peut envoyer plusieurs retours.
- Le QR/lien peut être partagé hors contexte.
- Un avis négatif peut être supprimé de manière discriminatoire si la modération n'est pas encadrée.

## Contraintes d'implémentation
- Ne pas réutiliser `listing_reviews` ou `digiy_reviews` sans audit des accès, provenance et règles existantes.
- Ne pas introduire de collecte de coordonnées obligatoire ni d'envoi automatique.
- Ne pas écrire de données en production, créer de RPC publiques, activer d'attestations ou publier de témoignages dans cette phase.
- Intégrer le bouton **uniquement après repérage du vrai modèle de fiche LOC et tests de non-régression** (photos, vidéo, QR, contact, paiement direct, PWA).
- Éviter de laisser croire qu'un formulaire volontaire produit des « avis vérifiés ».
- Une interface sans backend de collecte sécurisé doit rester une maquette non publique : **pas de faux bouton actif**.

## Validation V11
Cette PR est une spécification. La mise en place du bouton et du formulaire nécessitera un audit du dépôt contenant les fiches publiques, un contrat de stockage/modération, des tests, puis une PR séparée.
