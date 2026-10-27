# Envoi automatique des emails avec Power Automate

Par défaut, l'onglet « Envoi » passe par la messagerie de l'ordinateur : l'animateur enregistre les fichiers, ouvre le message, puis joint les fichiers à la main.

Avec un flux Power Automate, le bouton « Envoyer » envoie directement le message, pièces jointes comprises, depuis une boîte Microsoft 365 de la bibliothèque. Il n'y a rien à joindre, et l'ordinateur n'a pas besoin de messagerie configurée.

## Ce qu'il faut

- Un compte Microsoft 365 avec une **licence Power Automate Premium**. Le déclencheur « Lors de la réception d'une requête HTTP » est un connecteur premium.
- Une boîte aux lettres d'envoi : la vôtre, ou une boîte partagée de la bibliothèque.

## Créer le flux

1. Dans Power Automate, créez un **flux cloud instantané** avec le déclencheur **« Lors de la réception d'une requête HTTP »** (*When an HTTP request is received*).
2. Dans le déclencheur :
   - **Qui peut déclencher le flux** : « Tout le monde ».
   - **Schéma JSON du corps de la demande** : collez le schéma ci-dessous.
3. Ajoutez une action **« Sélectionner »** (*Select*) :
   - **À partir de** : `files` (contenu dynamique du déclencheur).
   - **Mapper** : passez en mode texte et collez :
     ```json
     { "Name": "@{item()?['name']}", "ContentBytes": "@{item()?['contentBytes']}" }
     ```
4. Ajoutez l'action **« Envoyer un e-mail (V2) »** (Office 365 Outlook), ou **« Envoyer un e-mail à partir d'une boîte aux lettres partagée (V2) »** :
   - **À** : `to`
   - **Objet** : `subject`
   - **Corps** : `body`
   - **Pièces jointes** : passez en saisie de tableau entier et choisissez la **Sortie** de l'action « Sélectionner ».
5. Ajoutez une action **« Réponse »** (*Response*) avec le code d'état `200`.
6. Enregistrez le flux, puis copiez l'**URL HTTP POST** du déclencheur.

### Schéma JSON du corps de la demande

```json
{
  "type": "object",
  "properties": {
    "to": { "type": "string" },
    "subject": { "type": "string" },
    "body": { "type": "string" },
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "contentType": { "type": "string" },
          "contentBytes": { "type": "string" }
        },
        "required": ["name", "contentBytes"]
      }
    }
  },
  "required": ["to", "files"]
}
```

`contentBytes` contient le fichier encodé en base64.

## Brancher le flux dans l'appli

Sur chaque poste : onglet **7 · Envoi**, rubrique **« Envoi automatique (Power Automate) »**. Collez l'URL du flux, puis cliquez sur **Enregistrer**. L'adresse est gardée sur ce poste, dans ce navigateur ou dans l'application installée. Le texte sous le bouton « Envoyer » indique alors « Envoi automatique activé ».

Faites un envoi d'essai vers votre propre adresse avant l'atelier.

Il est aussi possible de renseigner l'URL pour tous les postes dans `app/config.js` (`mailWebhook`). **Déconseillé** : ce fichier est public sur GitHub Pages, et toute personne qui connaît l'URL du flux peut s'en servir pour envoyer des emails depuis la boîte de la bibliothèque.

## Limites et sécurité

- **Taille** : l'appli refuse d'envoyer plus de 20 Mo de fichiers en une fois. Une photo pèse environ 0,3 Mo et une vidéo de 10 s 5 à 7 Mo.
- **URL du flux** : elle contient une clé d'accès. Ne la publiez pas. Si elle a fuité, régénérez-la dans le déclencheur du flux.
- **Données personnelles** : l'adresse du participant ne fait que passer par le flux. Pensez à limiter la durée de conservation de l'historique des exécutions dans Power Automate (28 jours par défaut).
- **Si l'envoi échoue**, l'appli affiche l'erreur et propose aussitôt l'envoi par la messagerie de l'ordinateur.
- **À vérifier au premier essai** : l'appli appelle le flux directement depuis le navigateur. Si le navigateur bloque l'appel (erreur réseau dès l'envoi d'essai, alors que le flux fonctionne), il faudra adapter la façon dont l'appli l'appelle.
