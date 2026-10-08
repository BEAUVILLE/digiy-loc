# DIGIY TRUST — contrat d'intégration V1 (sans activation)

Issue de référence : #3.

## Doctrine

Une évaluation représente une prestation réellement effectuée par un client vérifié. Jamais d'étoiles fictives, de notes de visiteurs ou d'évaluations produites par le professionnel. DIGIYLYFE ne collecte aucun paiement et prélève 0 % de commission.

## Architecture proposée

- Les modules LOC, RESTO, DRIVER et autres conservent leurs systèmes de réservation existants.
- Un adaptateur par module traduit une prestation source en preuve d'éligibilité côté serveur : `source_module`, `source_reservation_id`, `professional_id`, `completed_at`, `verification_method` et client vérifié.
- Une réservation confirmée, une date de départ passée ou une déclaration isolée du propriétaire ne constituent **pas** à eux seuls une preuve de prestation.
- Une vérification serveur indépendante confirme la réalisation et le destinataire avant d'émettre une invitation d'évaluation à usage unique, limitée dans le temps. Aucun jeton en clair stocké en base ; empreinte et expiration uniquement.
- Le professionnel ne peut ni émettre seul une invitation valide, ni créer, modifier ou supprimer une note.
- L'enregistrement des notes passe par une opération serveur atomique qui consomme l'invitation et applique l'unicité par prestation, avec RLS fermée par défaut. Pas d'INSERT direct public.
- Les critères communs sont ponctualité/fiabilité, qualité, accueil/attitude et rapport qualité-prix (distinct du prix bas) ; critères métier supplémentaires selon module. Critère non renseigné = non noté, jamais zéro.
- Les agrégats publics exposent moyenne et nombre de prestations évaluées, puis détails par critère. Aucune donnée client privée dans les réponses publiques.

## Constats audit lecture seule

- `digiy_loc_master_reservations` ne comporte pas de statut de prestation ni d'identifiant client authentifié ; elle est gérée par le propriétaire.
- `digiy_loc_reservations` possède un statut mais pas d'identifiant client authentifié.
- `guest_bookings` possède `status=completed` et `completed_at` ; leur provenance et les chemins d'écriture doivent être audités avant usage comme preuve.
- `digiy_reservations` possède `afterstay_message_sent_at` mais l'envoi d'un message n'est pas une preuve de séjour.
- `listing_reviews` vérifie `auth.uid()=user_id` à l'insertion via sa politique RLS, pas l'existence d'une prestation ; les privilèges SQL directs courants pour les rôles usuels sont toutefois absents.
- `reservation-lookup` et `reservation-cancel` sont des fonctions serveur distinctes de toute certification de prestation ; ne pas les réutiliser comme preuve.

## Portes de sécurité avant activation

1. Identifier le mécanisme réel de fin de prestation et ses acteurs autorisés pour chaque module.
2. Vérifier les chemins RPC/Edge/service-role, y compris les mises à jour de `completed_at` et `status`.
3. Définir une vérification indépendante du bénéficiaire (authentification, OTP ou preuve de contact côté serveur), sans dépendre uniquement du téléphone saisi.
4. Tester les cas : visiteur, professionnel, prestation annulée, non réalisée, réservation seulement confirmée, double soumission, jeton expiré, usurpation et accès inter-professionnels.
5. Tester les agrégats sans fuite de données personnelles, les migrations réversibles et l'absence de régression LOC.
6. Revue humaine du schéma et des permissions avant toute migration de production.

## État

**Documentation uniquement** : aucune table, fonction, politique RLS, interface ou évaluation activée par ce document. Ne pas annoncer DIGIY TRUST comme opérationnel après fusion de cette PR.
