-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: projets_devops
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `service_type` varchar(50) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `parent_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Cleaning','2025-01-16 12:23:17','2025-01-16 12:23:17',NULL),(2,'Repair','2025-01-16 12:23:17','2025-01-16 12:23:17',NULL),(3,'Rental','2025-01-16 12:23:17','2025-01-16 12:23:17',NULL);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cities`
--

DROP TABLE IF EXISTS `cities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cities` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `latitude` decimal(9,6) NOT NULL,
  `longitude` decimal(9,6) NOT NULL,
  `parent_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `cities_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `cities` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cities`
--

LOCK TABLES `cities` WRITE;
/*!40000 ALTER TABLE `cities` DISABLE KEYS */;
INSERT INTO `cities` VALUES (13001,'Marseille',43.296500,5.369800,NULL),(69001,'Lyon',45.764000,4.835700,NULL),(75001,'Paris',48.856600,2.352200,NULL);
/*!40000 ALTER TABLE `cities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `participant_ids` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `date` datetime NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city_id` int NOT NULL,
  `creator_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `category` varchar(255) NOT NULL,
  `imageURL` varchar(255) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `creator_id` (`creator_id`),
  KEY `city_id` (`city_id`),
  CONSTRAINT `events_city_fk` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,'brocante','brocante','2025-01-16 12:42:00','14 Rue Chaillon',13001,1,'2025-01-16 12:42:32','2025-01-19 18:47:05','Barbecue',''),(2,'brocante','bc','2025-01-16 13:20:00','14 Rue Chaillon',69001,2,'2025-01-16 13:20:43','2025-01-19 17:03:41','Réunion',''),(10,'TEST','TEST','2012-12-15 12:12:00','15 place de Paris',75001,1,'2025-01-19 15:26:11','2025-01-19 16:51:41','Fête','https://us-en-vexin.fr/wp-content/uploads/2020/03/brocante.jpg');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `interests`
--

DROP TABLE IF EXISTS `interests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `proposition_id` int NOT NULL,
  `interested_user_id` int NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `status` enum('pending','accepted','rejected','canceled') DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `proposition_id` (`proposition_id`),
  KEY `interested_user_id` (`interested_user_id`),
  CONSTRAINT `interests_ibfk_1` FOREIGN KEY (`proposition_id`) REFERENCES `propositions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `interests_ibfk_2` FOREIGN KEY (`interested_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interests`
--

LOCK TABLES `interests` WRITE;
/*!40000 ALTER TABLE `interests` DISABLE KEYS */;
INSERT INTO `interests` VALUES (1,3,6,'2025-01-17 17:54:56',NULL,'accepted','2025-01-17 17:54:56','2025-01-18 10:37:14'),(2,3,6,'2025-01-17 18:01:10',NULL,'pending','2025-01-17 18:01:10','2025-01-17 18:01:10'),(3,3,5,'2025-01-17 18:01:59',NULL,'pending','2025-01-17 18:01:59','2025-01-17 18:01:59'),(4,3,6,'2025-01-17 18:02:40',NULL,'pending','2025-01-17 18:02:40','2025-01-17 18:02:40'),(5,3,8,'2025-01-17 21:32:05',NULL,'accepted','2025-01-17 21:32:05','2025-01-18 14:48:31'),(6,3,8,'2025-01-17 21:33:12',NULL,'accepted','2025-01-17 21:33:12','2025-01-18 15:31:34'),(7,3,8,'2025-01-17 21:35:52',NULL,'pending','2025-01-17 21:35:52','2025-01-17 21:35:52'),(8,3,8,'2025-01-17 22:30:21',NULL,'pending','2025-01-17 22:30:21','2025-01-17 22:30:21'),(9,3,8,'2025-01-17 22:42:32',NULL,'pending','2025-01-17 22:42:32','2025-01-17 22:42:32'),(10,3,8,'2025-01-18 10:57:31',NULL,'pending','2025-01-18 10:57:31','2025-01-18 10:57:31'),(11,3,8,'2025-01-18 11:27:20',NULL,'pending','2025-01-18 11:27:20','2025-01-18 11:27:20'),(12,3,8,'2025-01-18 11:27:30',NULL,'pending','2025-01-18 11:27:30','2025-01-18 11:27:30'),(13,3,8,'2025-01-18 11:28:19',NULL,'pending','2025-01-18 11:28:19','2025-01-18 11:28:19'),(14,3,8,'2025-01-18 11:32:58',NULL,'rejected','2025-01-18 11:32:58','2025-01-18 14:36:39'),(15,3,8,'2025-01-18 12:08:04',NULL,'accepted','2025-01-18 12:08:04','2025-01-18 14:36:30'),(16,3,8,'2025-01-18 12:08:13',NULL,'pending','2025-01-18 12:08:13','2025-01-18 12:08:13'),(17,3,7,'2025-01-18 12:13:10',NULL,'pending','2025-01-18 12:13:10','2025-01-18 12:13:10'),(18,3,7,'2025-01-18 12:16:41',NULL,'pending','2025-01-18 12:16:41','2025-01-18 12:16:41'),(19,3,7,'2025-01-18 12:27:20',NULL,'pending','2025-01-18 12:27:20','2025-01-18 12:27:20'),(20,3,7,'2025-01-18 12:44:54',NULL,'pending','2025-01-18 12:44:54','2025-01-18 12:44:54'),(21,3,7,'2025-01-18 12:46:48',NULL,'pending','2025-01-18 12:46:48','2025-01-18 12:46:48'),(22,3,8,'2025-01-18 12:48:08',NULL,'accepted','2025-01-18 12:48:08','2025-01-18 15:05:37'),(23,3,8,'2025-01-18 12:48:24',NULL,'accepted','2025-01-18 12:48:24','2025-01-18 14:38:00'),(24,3,7,'2025-01-18 12:48:31',NULL,'pending','2025-01-18 12:48:31','2025-01-18 12:48:31'),(25,3,7,'2025-01-18 12:53:01',NULL,'rejected','2025-01-18 12:53:01','2025-01-18 14:48:05'),(26,3,8,'2025-01-18 12:53:11',NULL,'pending','2025-01-18 12:53:11','2025-01-18 12:53:11'),(27,3,8,'2025-01-18 12:57:10',NULL,'accepted','2025-01-18 12:57:10','2025-01-18 15:35:58'),(28,3,8,'2025-01-18 12:58:16',NULL,'rejected','2025-01-18 12:58:16','2025-01-18 14:38:26'),(29,3,8,'2025-01-18 13:06:17',NULL,'accepted','2025-01-18 13:06:17','2025-01-18 14:35:42'),(30,3,8,'2025-01-18 13:07:06',NULL,'accepted','2025-01-18 13:07:06','2025-01-18 14:35:34'),(31,3,8,'2025-01-18 13:08:26',NULL,'rejected','2025-01-18 13:08:26','2025-01-18 14:35:23'),(32,3,8,'2025-01-18 13:14:30',NULL,'accepted','2025-01-18 13:14:30','2025-01-18 13:21:49'),(33,3,8,'2025-01-18 14:08:25',NULL,'accepted','2025-01-18 14:08:25','2025-01-18 14:08:30'),(34,3,8,'2025-01-18 14:40:53',NULL,'pending','2025-01-18 14:40:53','2025-01-18 14:40:53'),(35,3,7,'2025-01-18 14:41:03',NULL,'pending','2025-01-18 14:41:03','2025-01-18 14:41:03'),(36,3,7,'2025-01-18 15:04:37',NULL,'pending','2025-01-18 15:04:37','2025-01-18 15:04:37'),(37,3,8,'2025-01-18 15:05:10',NULL,'pending','2025-01-18 15:05:10','2025-01-18 15:05:10'),(38,3,8,'2025-01-18 15:37:21',NULL,'pending','2025-01-18 15:37:21','2025-01-18 15:37:21'),(39,3,8,'2025-01-18 15:38:06',NULL,'pending','2025-01-18 15:38:06','2025-01-18 15:38:06'),(40,3,8,'2025-01-18 15:43:11',NULL,'accepted','2025-01-18 15:43:11','2025-01-18 15:43:27'),(41,3,8,'2025-02-22 12:34:43',NULL,'pending','2025-02-22 12:34:43','2025-02-22 12:34:43');
/*!40000 ALTER TABLE `interests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `content` text NOT NULL,
  `sent_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `sender_id` (`sender_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` enum('interest_request','interest_accepted','interest_rejected','message','event_update') NOT NULL,
  `message` text NOT NULL,
  `related_entity_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (9,6,'interest_accepted','Votre demande a été acceptée ! Vous pouvez contacter le proposeur.',3,'2025-01-18 10:37:14'),(10,6,'interest_accepted','Votre demande pour \"Nettoyage de printemps\" a été acceptée 🎉.',1,'2025-01-18 10:37:14'),(48,7,'interest_rejected','❌ Marie Martin, Nettoyage de printemps a été refusée par 5.',3,'2025-01-18 14:48:05'),(50,5,'interest_request','Marie Martin est intéressé(e) par votre offre : Nettoyage de printemps',36,'2025-01-18 15:04:37'),(51,5,'interest_request','Pierre Lefevre est intéressé(e) par votre offre : Nettoyage de printemps',37,'2025-01-18 15:05:10'),(53,8,'interest_accepted','🎉 hana a accepté votre demande pour \"Nettoyage de printemps\". Voici ses contacts : 📧 hanat@live.fr 📞 3630',3,'2025-01-18 15:31:34'),(54,8,'interest_accepted','🎉 hana a accepté votre demande pour \"Nettoyage de printemps\". Voici ses contacts : 📧 hanat@live.fr',3,'2025-01-18 15:35:58'),(55,5,'interest_request','Pierre Lefevre est intéressé(e) par votre offre : Nettoyage de printemps',38,'2025-01-18 15:37:21'),(56,5,'interest_request','Pierre Lefevre est intéressé(e) par votre offre : Nettoyage de printemps',39,'2025-01-18 15:38:06'),(57,5,'interest_request','Pierre Lefevre est intéressé(e) par votre offre : Nettoyage de printemps',40,'2025-01-18 15:43:11'),(58,8,'interest_accepted','🎉 hana a accepté votre demande pour \"Nettoyage de printemps\". Voici ses contacts : 📧 hanat@live.fr',3,'2025-01-18 15:43:27');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `participants`
--

DROP TABLE IF EXISTS `participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `participants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `user_id` int NOT NULL,
  `status` enum('participating','cancelled') DEFAULT 'participating',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `participants_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `participants`
--

LOCK TABLES `participants` WRITE;
/*!40000 ALTER TABLE `participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_members`
--

DROP TABLE IF EXISTS `project_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `project_members_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_members`
--

LOCK TABLES `project_members` WRITE;
/*!40000 ALTER TABLE `project_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_votes`
--

DROP TABLE IF EXISTS `project_votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_votes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `project_id` int NOT NULL,
  `vote` enum('up','down') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_vote` (`user_id`,`project_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_votes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_votes_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_votes`
--

LOCK TABLES `project_votes` WRITE;
/*!40000 ALTER TABLE `project_votes` DISABLE KEYS */;
INSERT INTO `project_votes` VALUES (17,8,3,'up','2025-02-22 21:17:43');
/*!40000 ALTER TABLE `project_votes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(100) NOT NULL,
  `author_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deadline` timestamp NOT NULL,
  `status` enum('En cours','Terminé','Suspendu','Annulé') DEFAULT 'En cours',
  PRIMARY KEY (`id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (3,'Collecte de denrées.','Le projet de collecte de denrées a pour but de...','Collecte',7,'2025-02-21 22:00:06','2025-04-05 22:00:00','En cours'),(4,'Mon Projet','Projet de Pierre','Rénovation',8,'2025-02-22 21:15:40','2025-02-26 23:00:00','En cours');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `propositions`
--

DROP TABLE IF EXISTS `propositions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `propositions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `proposer_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `proposer_id` (`proposer_id`),
  CONSTRAINT `propositions_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `propositions_ibfk_2` FOREIGN KEY (`proposer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `propositions`
--

LOCK TABLES `propositions` WRITE;
/*!40000 ALTER TABLE `propositions` DISABLE KEYS */;
INSERT INTO `propositions` VALUES (2,2,5,'Réparer vos chauffages ','Je peux réparer les chauffages aux personnes démunies',1,'2025-01-16 12:24:43','2025-01-16 12:24:43'),(3,1,5,'Nettoyage de printemps','Je propose un service de nettoyage pour votre maison.',1,'2025-01-17 17:12:46','2025-01-17 17:12:46');
/*!40000 ALTER TABLE `propositions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `service_type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `user_id` int NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT 'ongoing',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `services_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `signalements`
--

DROP TABLE IF EXISTS `signalements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `signalements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `categorie` enum('Dangers','Urbain','Bruit','Stationnement') NOT NULL,
  `description` text NOT NULL,
  `critique` tinyint(1) DEFAULT '0',
  `quartier` varchar(255) DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolu` tinyint(1) DEFAULT '0',
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_user_signalement` (`user_id`),
  CONSTRAINT `fk_user_signalement` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `signalements`
--

LOCK TABLES `signalements` WRITE;
/*!40000 ALTER TABLE `signalements` DISABLE KEYS */;
/*!40000 ALTER TABLE `signalements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('resident','service_provider','administrator') NOT NULL DEFAULT 'resident',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `phone_number` varchar(20) DEFAULT NULL,
  `city_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_city` (`city_id`),
  CONSTRAINT `fk_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'ouragh','hana@live.fr','Inscription92!','resident','2025-01-16 11:48:04','2025-01-16 11:48:04','3630',75001),(4,'hana','hanatest@live.fr','Test123!','resident','2025-01-16 11:59:53','2025-01-16 11:59:53','3630',75001),(5,'hana','hanat@live.fr','Test123!','resident','2025-01-16 12:08:49','2025-01-16 12:08:49','3630',75001),(6,'Jean Dupont','jean.dupont@email.com','password123','resident','2025-01-16 12:23:17','2025-01-16 12:23:17','0601234567',75001),(7,'Marie Martin','marie.martin@email.com','secret456','service_provider','2025-01-16 12:23:17','2025-01-16 12:23:17','0612345678',69001),(8,'Pierre Lefevre','pierre.lefevre@email.com','topsecret789','administrator','2025-01-16 12:23:17','2025-01-16 12:23:17','0623456789',75001);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

DROP TABLE IF EXISTS `votes`;  

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-02-22 22:34:16
