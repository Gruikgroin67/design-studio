# Changelog


## 20260507_075537
- Mise à jour du fichier INFO_A_LIRE_AVANT_PATCH.txt.
- Documentation de l’objectif Design Studio.
- Documentation des règles : DEV uniquement, pas de core Jeedom, pas de Post-it Design, pas MQTT, pas Apache.
- Documentation de la base fonctionnelle et des fonctions problématiques.

## 20260507_075852
- Ajout de la règle obligatoire de suivi conversationnel avant chaque tag.
- Le fichier INFO_A_LIRE_AVANT_PATCH.txt devra être complété à chaque tag avec les décisions, bugs, correctifs, tests et état stable du projet.

## v0.1.2 - 20260507_080008
- Ajout du suivi documentaire obligatoire avant chaque tag.
- Ajout d’une section de reprise dans INFO_A_LIRE_AVANT_PATCH.txt.
- Aucun changement fonctionnel volontaire sur le moteur Studio.

## v0.1.3 - 20260508_101144
- Stabilisation de la sauvegarde des positions dans Design Studio.
- Correction de la persistance des coordonnées left/top après Reload ou actualisation.
- Ajout d’un contrôle de réponse AJAX côté JS.
- Ajout d’un log runtime /tmp/designstudio_save_position.log pour diagnostiquer les sauvegardes.
- Nettoyage des permissions Git des fichiers suivis en 0644.
- État testé par Emmanuel : déplacement puis enregistrement fonctionnel, les objets restent au nouvel emplacement après actualisation.

