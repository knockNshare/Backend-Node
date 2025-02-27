# Mon Projet - Backend Node

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/knockNshare/Backend-Node)](https://github.com/knockNshare/Backend-Node/releases)
[![Build & test](https://github.com/knockNshare/Backend-Node/actions/workflows/node-ci.yml/badge.svg?branch=main)](https://github.com/knockNshare/Backend-Node/actions/workflows/node-ci.yml)


# KnockNShare

**KnockNShare** est une plateforme solidaire qui connecte les voisins pour des prêts, dons, services, et événements communautaires.

---

## Fonctionnalités principales

- Recherche d'objets/services par catégorie.
- Création et gestion d'événements locaux.
- Déclaration de propositions (dons, prêts, services).

---

## **Frontend**

### **Installation**

1. Clonez le dépôt :

  git clone https://github.com/knockNshare/Frontend.git
  cd Frontend

3. Installez les dépendances :

npm install

3. Lancez l'application :

npm start

---

## **Backend**

### **Installation**

1. Clonez le dépôt :

git clone https://github.com/knockNshare/Backend-Node.git
cd Backend-Node

2. Installez les dépendances :

npm install

3. Configurez les variables d'environnement :
- Créez un fichier `.env` dans le dossier principal du backend avec le contenu suivant :

  ```
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=yourpassword
  DB_NAME=knocknshare
  PORT=3000
  ```

  Remplacez `localhost`, `root`, `yourpassword`, et `knocknshare` par les valeurs correspondant à votre configuration.

4. Assurez-vous que **MySQL** est en cours d'exécution et que le schéma de la base de données est importé.

5. Lancez le serveur :

node index.js

---

### **Dépendances principales**

- `express` : Framework web pour créer l'API.
- `mysql2` : Connecteur pour MySQL.
- `dotenv` : Chargement des variables d'environnement.
- `cors` : Autorisation des requêtes provenant du frontend.

---

## **Base de données**

### **Importation**

Assurez-vous que le schéma de la base de données est correctement configuré dans votre instance MySQL. Voici une commande pour importer le fichier SQL si vous avez un export disponible :

mysql -u <DB_USER> -p <DB_NAME> < schema.sql

### **Schéma**

La base contient les tables principales suivantes :

- **users** : Gestion des utilisateurs.
- **propositions** : Objets et services proposés.
- **events** : Événements communautaires.
- **categories** : Catégories associées aux propositions et événements.
- **interests** : Gestion des demandes d'intérêt pour les propositions.

---

## Contribution

1. **Forkez** le dépôt.
2. Créez une branche pour vos modifications :

git checkout -b feature/new-feature

3. Committez vos modifications :

git commit -m “Ajout de [nouvelle fonctionnalité]”

4. Poussez sur votre branche :

git push origin feature/new-feature

5. Soumettez une **pull request**.

---


Contact

Pour toute question, vous pouvez contacter l’équipe KnockNShare :
- Hana Ouraghene : 44013266@parisnanterre.fr
- Nour El Houda HACHEMI
- Hiba LOUZZANI
- Clara AUDEMAR

[![Node.js CI Windows build and test](https://github.com/DevOps-CH3/Backend-Node/actions/workflows/node-ci.yml/badge.svg?branch=develop)](https://github.com/DevOps-CH3/Backend-Node/actions/workflows/node-ci.yml/)
[![Codecov](https://codecov.io/gh/DevOps-CH3/Backend-Node/branch/develop/graph/badge.svg)](https://codecov.io/gh/DevOps-CH3/Backend-Node)

To have the cities and quartiers you need to install python3 and then run python3 insert_cities.py , python3 insert_quartiers_paris ,python3 insert_quartiers_nanterre in order !
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/knockNshare/Backend-Node)](https://github.com/knockNshare/Backend-Node/releases)
[![Build & test](https://github.com/knockNshare/Backend-Node/actions/workflows/node-ci.yml/badge.svg?branch=main)](https://github.com/knockNshare/Backend-Node/actions/workflows/node-ci.yml)
