# Mon Projet - Backend Node

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/knockNshare/Backend-Node)](https://github.com/knockNshare/Backend-Node/releases)
[![CI Status](https://img.shields.io/github/workflow/status/knockNshare/Backend-Node/CI?label=CI&style=flat-square)](https://github.com/knockNshare/Backend-Node/actions)
[![Codecov](https://img.shields.io/codecov/c/github/knockNshare/Backend-Node?label=Coverage)](https://codecov.io/gh/knockNshare/Backend-Node)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/<votre-id-projet>)](https://www.codacy.com/gh/knockNshare/Backend-Node)
[![Reliability Rating](https://img.shields.io/sonar/quality_gate/Backend-Node/reliability?server=https%3A%2F%2Fsonarcloud.io)](https://sonarcloud.io)
[![Security Rating](https://img.shields.io/sonar/security/Backend-Node?server=https%3A%2F%2Fsonarcloud.io)](https://sonarcloud.io)
[![Bugs](https://img.shields.io/sonar/bugs/Backend-Node?server=https%3A%2F%2Fsonarcloud.io)](https://sonarcloud.io)
[![Technical Debt](https://img.shields.io/sonar/debt_ratio/Backend-Node?server=https%3A%2F%2Fsonarcloud.io)](https://sonarcloud.io)
[![Lines of Code](https://img.shields.io/tokei/lines/github/knockNshare/Backend-Node)](https://github.com/knockNshare/Backend-Node)


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

