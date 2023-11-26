# Discord Bot - Loup Garou

## Installation

### Prérequis

- NodeJS
- NPM
- Git

### Installation

1. Se rendre sur le Discord Developer Portal : https://discord.com/developers/applications

2. Créer une nouvelle application

![image](https://cdn.discordapp.com/attachments/1061254672532394034/1178332352666157228/image.png?ex=6575c285&is=65634d85&hm=e26570bc32d5268f9c63543e0acaac2219df9b040fc1da23d9184f75ecc47a2c&)

3. Dans l'onglet "Bot", créer un nouveau bot et reset le token afin de le copier

![image](https://cdn.discordapp.com/attachments/1061254672532394034/1178331863849377913/create-app.ed82aede.png?ex=6575c210&is=65634d10&hm=52a3c8553dc652cc95b20443bde4ee10fbd1c64d24795d68e1d47433386f8102&)

4. Dans l'onglet "OAuth2", "URL Generator" cocher les scopes suivants :

- bot
- applications.commands

Puis cocher les permissions suivantes :

- Administrator

![image](https://cdn.discordapp.com/attachments/1061254672532394034/1178332564990201876/image.png?ex=6575c2b7&is=65634db7&hm=073356cdcfaf90a381374c585a3be499ac0d5ed80af341c65e7be0cc59670f29&)

5. Copier le lien généré et l'ouvrir dans un navigateur

6. Ajouter le bot au serveur de votre choix

![image](https://cdn.discordapp.com/attachments/1061254672532394034/1178331935798468760/bot-auth-page.e624796f.png?ex=6575c221&is=65634d21&hm=7513f65636547ace1b6adb2a6d72a8e0bc36957ddc263fdf0ed9b26ac76d787c&)

7. Dans l'onglet "General Information", copier le "CLIENT ID"

8. Cloner le projet : `git clone https://github.com/cdhaeyere/3BIN-Q1-ProjetWeb.git` et ouvrez le dossier avec votre éditeur de code

9. Installer les dépendances : `npm install`

10. Créer un fichier `.env` à la racine du projet et y ajouter les variables suivantes :

```
TOKEN=token
CLIENT_ID=client_id
```

11. Remplacer `token` par le token copié précédemment et `client_id` par le client id copié précédemment

12. Mettez à jour les commandes : `node deploy-commands.js`

13. Lancer le bot : `node index.js`

## Développeurs

- [Miguel De Sa Adegas](https://github.com/miguelDeSaAdegas)
    Pseudo GitHub : miguelDeSaAdegas
- [Corentin D'haeyere](https://github.com/cdhaeyere)
    Pseudo GitHub : cdhaeyere, Nitroc1701
- [Damien Lapinski](https://github.com/SNEKEK)
    Pseudo GitHub : SNEKEK
- [François Vandeputte](https://github.com/Ractouf)
    Pseudo GitHub : Ractouf
- [Sasha Van Rossum](https://github.com/SashaVanRoss)
    Pseudo GitHub : SashaVanRoss
