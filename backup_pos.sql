-- MySQL dump 10.13  Distrib 8.0.46, for Linux (aarch64)
--
-- Host: localhost    Database: pos
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `discounts`
--

DROP TABLE IF EXISTS `discounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discounts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `target_ids` json NOT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `min_order_amount` decimal(10,2) DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discounts`
--

LOCK TABLES `discounts` WRITE;
/*!40000 ALTER TABLE `discounts` DISABLE KEYS */;
INSERT INTO `discounts` VALUES (1,'Happy Day','category','percentage',20.00,'[3, 4, 7]','2026-09-17 10:15:00','2026-09-17 11:07:00','active',NULL,'Happy all famly','2026-09-17 10:07:46','2026-09-17 10:08:34'),(2,'Happy New Year','category','percentage',50.00,'[8, 7, 4]','2026-09-17 14:32:00','2026-09-18 14:32:00','active',NULL,NULL,'2026-09-17 14:32:17','2026-09-17 14:38:12'),(3,'Happy Day','category','percentage',50.00,'[7]','2026-09-26 14:27:00','2026-09-29 14:27:00','active',NULL,'Bt','2026-09-27 14:27:25','2026-09-27 14:27:25'),(4,'Hello Day','product','percentage',10.00,'[18]','2026-10-14 09:50:00','2026-10-17 09:39:00','active',NULL,NULL,'2026-10-15 09:39:19','2026-10-15 09:39:19');
/*!40000 ALTER TABLE `discounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `is_auto` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,'Sep',1200.00,'Staffs Salary','2026-09-30',0,'2026-09-17 10:13:31','2026-09-17 10:13:31'),(2,'Nong (Staff)',400.00,'Staffs Salary','2026-09-27',0,'2026-09-27 14:45:43','2026-09-27 14:45:43');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `finance_categories`
--

DROP TABLE IF EXISTS `finance_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `finance_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('income','expense') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'income',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `finance_categories`
--

LOCK TABLES `finance_categories` WRITE;
/*!40000 ALTER TABLE `finance_categories` DISABLE KEYS */;
INSERT INTO `finance_categories` VALUES (1,'Staffs Salary','expense','2026-09-17 10:12:37','2026-09-17 10:12:37'),(2,'Get From Customer','income','2026-09-17 10:12:52','2026-09-17 10:12:52');
/*!40000 ALTER TABLE `finance_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `incomes`
--

DROP TABLE IF EXISTS `incomes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incomes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `income_ref` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_auto_generated` tinyint(1) NOT NULL DEFAULT '0',
  `order_id` bigint unsigned DEFAULT NULL,
  `payment_method` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `incomes_income_ref_unique` (`income_ref`),
  KEY `incomes_order_id_foreign` (`order_id`),
  KEY `incomes_date_category_index` (`date`,`category`),
  KEY `incomes_is_auto_generated_index` (`is_auto_generated`),
  CONSTRAINT `incomes_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `incomes`
--

LOCK TABLES `incomes` WRITE;
/*!40000 ALTER TABLE `incomes` DISABLE KEYS */;
INSERT INTO `incomes` VALUES (1,'INC-20260917-0FCE','Order FromBar 1',8.90,'2026-09-17','Sales',1,1,'card','Income from order ORD-000001','2026-09-17 10:41:46','2026-09-17 10:41:46'),(2,'INC-20260917-6657','Order FromTable 1',31.40,'2026-09-17','Sales',1,2,'mobile','Income from order ORD-000002','2026-09-17 11:41:51','2026-09-17 11:41:51'),(3,'INC-20260917-2CB8','Order FromTable 6',12.15,'2026-09-17','Sales',1,3,'card','Income from order ORD-000003','2026-09-17 11:48:12','2026-09-17 11:48:12'),(4,'INC-20260917-F369','Order FromBar 3',11.75,'2026-09-17','Sales',1,5,'mobile','Income from order ORD-000005','2026-09-17 14:43:54','2026-09-17 14:43:54'),(5,'INC-20260917-4F54','Order FromBar 2',8.50,'2026-09-17','Sales',1,4,'card','Income from order ORD-000004','2026-09-17 14:52:10','2026-09-17 14:52:10'),(6,'INC-20260917-5B75','Order FromApp Order',22.77,'2026-09-17','Sales',1,6,'card','Income from order ORD-000006','2026-09-17 14:55:26','2026-09-17 14:55:26'),(7,'INC-20260917-6620','Order FromBar 2',20.00,'2026-09-17','Sales',1,7,'card+cash','Income from order ORD-000007','2026-09-17 14:56:22','2026-09-17 14:56:22'),(8,'INC-20260917-9F0C','Order FromApp Order',9.00,'2026-09-17','Sales',1,8,'mobile','Income from order ORD-000008','2026-09-17 15:15:16','2026-09-17 15:15:16'),(9,'INC-20260917-8057','Order FromTakeaway',19.50,'2026-09-17','Sales',1,9,'cash','Income from order ORD-000009','2026-09-17 15:15:31','2026-09-17 15:15:31'),(10,'INC-20260917-B9E5','Order FromBar 4',14.50,'2026-09-17','Sales',1,11,'card','Income from order ORD-000011','2026-09-17 16:33:04','2026-09-17 16:33:04'),(11,'INC-20260917-A23A','Order FromBar 2',17.00,'2026-09-17','Sales',1,12,'mobile','Income from order ORD-000012','2026-09-17 16:33:18','2026-09-17 16:33:18'),(12,'INC-20260917-91E1','Order FromBar 3',24.00,'2026-09-17','Sales',1,13,'mobile','Income from order ORD-000013','2026-09-17 17:02:49','2026-09-17 17:02:49'),(13,'INC-20260917-F93E','Order FromBar 3',13.00,'2026-09-17','Sales',1,14,'card','Income from order ORD-000014','2026-09-17 17:19:49','2026-09-17 17:19:49'),(14,'INC-20260917-75A4','Order FromBar 4',17.50,'2026-09-17','Sales',1,15,'mobile','Income from order ORD-000015','2026-09-17 17:25:42','2026-09-17 17:25:42'),(15,'INC-20260918-E506','Order FromBar 1',20.00,'2026-09-18','Sales',1,16,'card','Income from order ORD-000016','2026-09-18 10:14:26','2026-09-18 10:14:26'),(16,'INC-20260918-45AB','Order FromBar 4',32.50,'2026-09-18','Sales',1,17,'cash','Income from order ORD-000017','2026-09-18 10:17:22','2026-09-18 10:17:22'),(17,'INC-20260918-AF73','Order FromBar 1',15.50,'2026-09-18','Sales',1,18,'card','Income from order ORD-000018','2026-09-18 10:29:25','2026-09-18 10:29:25'),(18,'INC-20260918-6B61','Order FromTakeaway',23.00,'2026-09-18','Sales',1,19,'cash','Income from order ORD-000019','2026-09-18 14:43:56','2026-09-18 14:43:56'),(19,'INC-20260927-5349','Order FromBar 3',12.60,'2026-09-27','Sales',1,21,'card','Income from order ORD-000021','2026-09-27 15:15:03','2026-09-27 15:15:03'),(20,'INC-20260927-C2AC','Order FromA1',11.50,'2026-09-27','Sales',1,20,'card','Income from order ORD-000020','2026-09-27 15:15:31','2026-09-27 15:15:31'),(21,'INC-20260930-277C','Order FromApp Order',12.50,'2026-09-30','Sales',1,23,'mobile','Income from order ORD-000023','2026-09-30 11:43:55','2026-09-30 11:43:55'),(22,'INC-20260930-2501','Order FromTakeaway',6.50,'2026-09-30','Sales',1,24,'card','Income from order ORD-000024','2026-09-30 11:44:03','2026-09-30 11:44:03'),(23,'INC-20261015-93E5','Order FromTakeaway',8.20,'2026-10-15','Sales',1,26,'mobile','Income from order ORD-000026','2026-10-15 10:26:46','2026-10-15 10:26:46'),(24,'INC-20261015-09F4','Order FromA1',11.20,'2026-10-15','Sales',1,25,'cash','Income from order ORD-000025','2026-10-15 10:27:33','2026-10-15 10:27:33'),(25,'INC-20261016-94E1','Order FromApp Order',13.50,'2026-10-16','Sales',1,27,'card','Income from order ORD-000027','2026-10-16 11:08:56','2026-10-16 11:08:56'),(26,'INC-20261016-309A','Sale Only',50.00,'2026-10-16','Get From Customer',0,NULL,'card','Hello','2026-10-16 12:05:41','2026-10-16 12:05:41'),(27,'INC-20261016-2640','Order FromOrder',13.00,'2026-10-16','Sales',1,28,'cash','Income from order ORD-000028','2026-10-16 14:28:04','2026-10-16 14:28:04'),(28,'INC-20261019-63A5','Order FromBar 4',11.00,'2026-10-19','Sales',1,29,'cash','Income from order ORD-000029','2026-10-19 09:26:40','2026-10-19 09:26:40'),(29,'INC-20261019-F836','Order FromBar 4',9.00,'2026-10-19','Sales',1,30,'cash','Income from order ORD-000030','2026-10-19 09:51:34','2026-10-19 09:51:34'),(30,'INC-20261019-6108','Order FromBar 4',6.00,'2026-10-19','Sales',1,31,'cash','Income from order ORD-000031','2026-10-19 09:52:00','2026-10-19 09:52:00'),(31,'INC-20261019-CA4E','Order FromBar 7',8.00,'2026-10-19','Sales',1,32,'cash','Income from order ORD-000032','2026-10-19 10:08:40','2026-10-19 10:08:40'),(32,'INC-20261019-9F38','Order FromBar 7',42.00,'2026-10-19','Sales',1,33,'cash','Income from order ORD-000033','2026-10-19 10:12:53','2026-10-19 10:12:53'),(33,'INC-20261019-1474','Order FromBar 4',11.00,'2026-10-19','Sales',1,34,'cash','Income from order ORD-000034','2026-10-19 10:29:39','2026-10-19 10:29:39'),(34,'INC-20261019-60CB','Order FromTable 6',18.00,'2026-10-19','Sales',1,35,'cash','Income from order ORD-000035','2026-10-19 10:31:12','2026-10-19 10:31:12'),(35,'INC-20261019-F5A7','Order FromBar 4',58.00,'2026-10-19','Sales',1,40,'mobile','Income from order ORD-000040','2026-10-19 16:29:35','2026-10-19 16:29:35'),(36,'INC-20261019-70FC','Order FromA1',16.00,'2026-10-19','Sales',1,43,'cash','Income from order ORD-000043','2026-10-19 16:30:10','2026-10-19 16:30:10');
/*!40000 ALTER TABLE `incomes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventories`
--

DROP TABLE IF EXISTS `inventories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Normal',
  `stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `min_stock` decimal(10,2) NOT NULL DEFAULT '5.00',
  `supplier_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inventories_category_id_foreign` (`category_id`),
  KEY `inventories_supplier_id_foreign` (`supplier_id`),
  CONSTRAINT `inventories_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `stock_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventories_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventories`
--

LOCK TABLES `inventories` WRITE;
/*!40000 ALTER TABLE `inventories` DISABLE KEYS */;
INSERT INTO `inventories` VALUES (1,2,'Floor Cleaner','លីត្រ','Normal',1.00,2.00,NULL,'2026-09-16 14:16:46','2026-09-17 16:16:53'),(2,8,'Dishwashing Liquid','លីត្រ','Normal',2.00,3.00,NULL,'2026-09-16 15:53:44','2026-09-17 17:04:03'),(3,8,'Hand Soap','គ្រាប់','Normal',15.00,5.00,NULL,'2026-09-16 15:55:00','2026-09-16 15:55:00'),(4,7,'Paper Cup','គ្រាប់','Small',2.00,3.00,NULL,'2026-09-16 15:55:29','2026-09-17 17:17:48'),(5,5,'CoCa Cola','កំប៉ុង','Normal',38.00,6.00,1,'2026-09-17 09:23:30','2026-10-19 10:31:03');
/*!40000 ALTER TABLE `inventories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_categories`
--

DROP TABLE IF EXISTS `menu_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `menu_categories_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_categories`
--

LOCK TABLES `menu_categories` WRITE;
/*!40000 ALTER TABLE `menu_categories` DISABLE KEYS */;
INSERT INTO `menu_categories` VALUES (1,'Salad','2026-09-16 15:05:55','2026-09-16 15:05:55'),(2,'Fast Food','2026-09-16 15:06:03','2026-09-16 15:06:03'),(3,'Drinks','2026-09-16 15:06:12','2026-09-16 15:06:12'),(4,'Desserts','2026-09-16 15:06:20','2026-09-16 15:06:20'),(5,'Snacks','2026-09-16 15:06:43','2026-09-16 15:06:43'),(6,'Noodles & Soup','2026-09-16 15:07:20','2026-09-16 15:07:20'),(7,'Coffee & Tea','2026-09-16 15:07:37','2026-09-16 15:07:37'),(8,'Add-ons','2026-09-16 15:08:27','2026-09-16 15:08:27');
/*!40000 ALTER TABLE `menu_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_items`
--

DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint unsigned DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `available` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_items`
--

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
INSERT INTO `menu_items` VALUES (1,8,'Extra Egg',0.50,'menu/item_6aaa4ef7da61b8.81229044.png',1,'2026-09-16 15:09:49','2026-09-16 15:10:31'),(2,8,'Extra Beef',2.00,'menu/item_6aaa4f617b5861.02309125.png',1,'2026-09-16 15:12:17','2026-09-16 15:12:17'),(3,8,'Extra Rice',0.50,'http://localhost:8000/storage/menu/item_6aaa4f81b84924.92557783.png',1,'2026-09-16 15:12:49','2026-09-16 15:12:57'),(4,7,'Americano',1.50,'menu/item_6aaa5009e9ed69.92953127.png',1,'2026-09-16 15:15:05','2026-09-16 15:15:05'),(5,7,'Hot Latte',1.50,'menu/item_6aaa5025dd6c03.39490007.png',1,'2026-09-16 15:15:33','2026-09-16 15:15:33'),(6,7,'Jasmine Tea',1.00,'menu/item_6aaa505c1f4808.20551386.png',1,'2026-09-16 15:16:28','2026-09-16 15:16:28'),(7,4,'Cheesecake',3.00,'menu/item_6aaa53dcbaf479.04077389.png',1,'2026-09-16 15:31:24','2026-09-16 15:31:24'),(8,3,'Coca Cola',1.00,'http://localhost:8000/storage/menu/item_6aaa53f5a62949.50157932.png',1,'2026-09-16 15:31:49','2026-09-17 09:24:07'),(9,3,'Coconut',1.00,'menu/item_6aaa541536a917.44280967.png',1,'2026-09-16 15:32:21','2026-09-16 15:32:21'),(10,3,'Sting',1.00,'menu/item_6aaa544ac48051.97212391.png',1,'2026-09-16 15:33:14','2026-09-16 15:33:14'),(11,2,'Beef Burger',2.50,'menu/item_6aaa546168d196.67856331.png',1,'2026-09-16 15:33:37','2026-09-16 15:33:37'),(12,2,'Pizza',5.00,'menu/item_6aaa5492f30654.54833607.png',1,'2026-09-16 15:34:27','2026-09-16 15:34:27'),(13,2,'Fried Chicken',2.50,'menu/item_6aaa54b99e62b4.70869033.png',1,'2026-09-16 15:35:05','2026-09-16 15:35:05'),(14,6,'Beef Noodle Soup',5.00,'menu/item_6aaa54e58bea12.18901964.png',1,'2026-09-16 15:35:49','2026-09-16 15:35:49'),(15,6,'Fried Noodles',4.00,'menu/item_6aaa550ea6f793.82929685.png',1,'2026-09-16 15:36:30','2026-09-16 15:36:30'),(16,6,'Nom Ban Chok',2.50,'menu/item_6aaa55b1eb6b02.49143821.png',1,'2026-09-16 15:39:13','2026-09-16 15:39:13'),(17,1,'Khmer Papaya Salad',3.00,'http://localhost:8000/storage/menu/item_6aaa560a6b68a0.82087224.png',1,'2026-09-16 15:40:42','2026-09-16 15:40:57'),(18,1,'Nhom Sdao',3.00,'menu/item_6aaa56a2802bf3.30387630.png',1,'2026-09-16 15:43:14','2026-09-16 15:43:14'),(19,1,'Beef Salad',5.50,'menu/item_6aaa56e24547b7.96056744.png',1,'2026-09-16 15:44:18','2026-09-16 15:44:18'),(20,5,'Chicken Wings',3.00,'menu/item_6aaa574c100a95.61375227.png',1,'2026-09-16 15:46:04','2026-09-17 14:29:24');
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_recipes`
--

DROP TABLE IF EXISTS `menu_recipes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_recipes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `menu_item_id` bigint unsigned NOT NULL,
  `inventory_id` bigint unsigned NOT NULL,
  `deduct_qty` decimal(10,3) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `menu_recipes_menu_item_id_foreign` (`menu_item_id`),
  KEY `menu_recipes_inventory_id_foreign` (`inventory_id`),
  CONSTRAINT `menu_recipes_inventory_id_foreign` FOREIGN KEY (`inventory_id`) REFERENCES `inventories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `menu_recipes_menu_item_id_foreign` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_recipes`
--

LOCK TABLES `menu_recipes` WRITE;
/*!40000 ALTER TABLE `menu_recipes` DISABLE KEYS */;
INSERT INTO `menu_recipes` VALUES (1,8,5,1.000,'2026-09-17 09:24:07','2026-09-17 09:24:07');
/*!40000 ALTER TABLE `menu_recipes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_03_19_165401_create_roles_table',1),(5,'2026_03_19_165753_add_role_id_to_users_table',1),(6,'2026_03_20_041339_create_personal_access_tokens_table',1),(7,'2026_03_20_042846_add_label_columns_to_role_permissions',1),(8,'2026_03_20_064531_create_staff_table',1),(9,'2026_03_20_174730_create_stock_categories_table',1),(10,'2026_03_21_023117_create_inventories_table',1),(11,'2026_03_21_040857_create_stock_histories_table',1),(12,'2026_03_21_041034_create_orders_table',1),(13,'2026_03_21_041126_create_menu_items_table',1),(14,'2026_03_21_041145_create_menu_categories_table',1),(15,'2026_03_21_041208_create_menu_recipes_table',1),(16,'2026_03_21_041239_create_order_items_table',1),(17,'2026_03_21_123616_create_restaurant_tables_table',1),(18,'2026_03_21_140449_create_spoilages_table',1),(19,'2026_03_21_155717_create_finance_categories_table',1),(20,'2026_03_21_161826_create_expenses_table',1),(21,'2026_03_23_173850_create_incomes_table',1),(22,'2026_03_26_064734_create_suppliers_table',1),(23,'2026_03_26_071114_add_supplier_id_to_inventories_table',1),(24,'2026_04_18_204252_create_working_shifts_table',1),(25,'2026_04_21_114842_add_pos_columns_to_working_shifts_table',1),(26,'2026_04_22_200411_add_working_shift_id_to_orders_table',1),(27,'2026_05_02_110213_create_reservations_table',1),(28,'2026_05_03_204217_create_discounts_table',1),(29,'2026_05_09_093751_create_systemsettings_table',1),(30,'2026_05_11_005524_add_discount_to_reservation_items_table',1),(31,'2026_05_11_152727_add_status_to_reservation_tables',1),(32,'2026_05_25_101834_create_vip_tiers_table',1),(33,'2026_05_25_101836_create_vip_cards_table',1),(34,'2026_05_25_101838_create_vip_upgrade_logs_table',1),(35,'2026_05_28_154916_add_discount_fields_to_orders_and_items',1),(36,'2026_06_01_094722_change_arrival_time_to_datetime_in_reservations',1),(37,'2026_06_15_163727_create_printers_table',1),(38,'2026_06_24_163635_add_pos_access_to_staff_table',1),(39,'2026_07_10_093813_fix_arrival_column_and_add_no_show_status',1),(40,'2026_07_13_093731_change_discount_dates_to_datetime',1),(41,'2026_09_18_090014_add_cash_reconciliation_to_working_shifts',2),(42,'2026_09_18_091501_add_cancel_reason_to_orders',3),(43,'2026_09_18_144854_add_exchange_rate_to_system_settings_table',4),(44,'2026_10_16_114204_add_exchange_rate_mode_to_system_settings_table',5),(45,'2026_10_18_235300_add_cash_reconciliation_to_working_shifts_table',6),(46,'2026_10_18_235730_add_exchange_rate_mode_to_system_settings_table',7),(47,'2026_10_19_091411_add_cash_reconciliation_to_working_shifts_table',8),(48,'2026_10_19_091423_add_exchange_rate_mode_to_system_settings_table',8),(49,'2026_10_19_091428_add_cash_split_to_orders_table',8),(50,'2026_10_19_111405_create_table_transfers_table',9);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `menu_item_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `original_price` decimal(10,2) DEFAULT NULL,
  `quantity` int NOT NULL,
  `discount_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_value` decimal(10,2) DEFAULT NULL,
  `discount_value_type` enum('percentage','flat') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_foreign` (`order_id`),
  KEY `order_items_menu_item_id_foreign` (`menu_item_id`),
  CONSTRAINT `order_items_menu_item_id_foreign` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=148 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,8,'Coca Cola',0.80,NULL,2,NULL,NULL,NULL,'2026-09-17 10:18:59','2026-09-17 10:18:59'),(2,1,7,'Cheesecake',2.40,NULL,2,NULL,NULL,NULL,'2026-09-17 10:18:59','2026-09-17 10:18:59'),(3,1,13,'Fried Chicken',2.50,NULL,1,NULL,NULL,NULL,'2026-09-17 10:18:59','2026-09-17 10:18:59'),(4,2,14,'Beef Noodle Soup',5.00,NULL,1,NULL,NULL,NULL,'2026-09-17 10:51:09','2026-09-17 10:51:09'),(5,2,19,'Beef Salad',5.50,NULL,2,NULL,NULL,NULL,'2026-09-17 10:51:09','2026-09-17 10:51:09'),(6,2,18,'Nhom Sdao',3.00,NULL,2,NULL,NULL,NULL,'2026-09-17 10:51:09','2026-09-17 10:51:09'),(7,2,20,'Chicken Wings',3.00,NULL,1,NULL,NULL,NULL,'2026-09-17 10:51:09','2026-09-17 10:51:09'),(8,2,8,'Coca Cola',0.80,NULL,1,NULL,NULL,NULL,'2026-09-17 10:51:09','2026-09-17 10:51:09'),(9,2,6,'Jasmine Tea',0.80,NULL,1,NULL,NULL,NULL,'2026-09-17 10:51:09','2026-09-17 10:51:09'),(10,2,7,'Cheesecake',2.40,NULL,1,NULL,NULL,NULL,'2026-09-17 10:51:09','2026-09-17 10:51:09'),(11,2,5,'Hot Latte',1.20,NULL,1,NULL,NULL,NULL,'2026-09-17 10:51:09','2026-09-17 10:51:09'),(12,2,4,'Americano',1.20,NULL,1,NULL,NULL,NULL,'2026-09-17 10:51:09','2026-09-17 10:51:09'),(13,3,10,'Sting',1.00,NULL,1,NULL,NULL,NULL,'2026-09-17 11:47:41','2026-09-17 11:47:41'),(14,3,9,'Coconut',1.00,NULL,1,NULL,NULL,NULL,'2026-09-17 11:47:41','2026-09-17 11:47:41'),(15,3,20,'Chicken Wings',3.00,NULL,1,NULL,NULL,NULL,'2026-09-17 11:47:41','2026-09-17 11:47:41'),(16,3,19,'Beef Salad',5.50,NULL,1,NULL,NULL,NULL,'2026-09-17 11:47:41','2026-09-17 11:47:41'),(17,3,18,'Nhom Sdao',3.00,NULL,1,NULL,NULL,NULL,'2026-09-17 11:47:41','2026-09-17 11:47:41'),(18,4,20,'Chicken Wings',3.00,NULL,1,NULL,NULL,NULL,'2026-09-17 14:42:46','2026-09-17 14:42:46'),(19,4,19,'Beef Salad',5.50,NULL,1,NULL,NULL,NULL,'2026-09-17 14:42:46','2026-09-17 14:42:46'),(20,5,20,'Chicken Wings',3.00,NULL,1,NULL,NULL,NULL,'2026-09-17 14:42:56','2026-09-17 14:42:56'),(21,5,19,'Beef Salad',5.50,NULL,1,NULL,NULL,NULL,'2026-09-17 14:42:56','2026-09-17 14:42:56'),(22,5,18,'Nhom Sdao',3.00,NULL,1,NULL,NULL,NULL,'2026-09-17 14:42:56','2026-09-17 14:42:56'),(23,5,17,'Khmer Papaya Salad',3.00,NULL,1,NULL,NULL,NULL,'2026-09-17 14:42:56','2026-09-17 14:42:56'),(24,6,20,'Chicken Wings',3.00,NULL,2,NULL,NULL,NULL,'2026-09-17 14:54:28','2026-09-17 14:54:28'),(25,6,19,'Beef Salad',5.50,NULL,2,NULL,NULL,NULL,'2026-09-17 14:54:28','2026-09-17 14:54:28'),(26,6,18,'Nhom Sdao',3.00,NULL,2,NULL,NULL,NULL,'2026-09-17 14:54:28','2026-09-17 14:54:28'),(27,7,18,'Nhom Sdao',3.00,NULL,1,NULL,NULL,NULL,'2026-09-17 14:55:37','2026-09-17 14:55:37'),(28,7,17,'Khmer Papaya Salad',3.00,NULL,2,NULL,NULL,NULL,'2026-09-17 14:55:37','2026-09-17 14:55:37'),(29,7,19,'Beef Salad',5.50,NULL,2,NULL,NULL,NULL,'2026-09-17 14:55:37','2026-09-17 14:55:37'),(30,8,16,'Nom Ban Chok',2.50,NULL,1,NULL,NULL,NULL,'2026-09-17 15:10:26','2026-09-17 15:10:26'),(31,8,17,'Khmer Papaya Salad',3.00,NULL,1,NULL,NULL,NULL,'2026-09-17 15:10:26','2026-09-17 15:10:26'),(32,8,18,'Nhom Sdao',3.00,NULL,1,NULL,NULL,NULL,'2026-09-17 15:10:26','2026-09-17 15:10:26'),(33,8,6,'Jasmine Tea',0.50,NULL,1,NULL,NULL,NULL,'2026-09-17 15:10:26','2026-09-17 15:10:26'),(34,9,18,'Nhom Sdao',3.00,NULL,2,NULL,NULL,NULL,'2026-09-17 15:10:34','2026-09-17 15:10:34'),(35,9,17,'Khmer Papaya Salad',3.00,NULL,2,NULL,NULL,NULL,'2026-09-17 15:10:34','2026-09-17 15:10:34'),(36,9,16,'Nom Ban Chok',2.50,NULL,3,NULL,NULL,NULL,'2026-09-17 15:10:34','2026-09-17 15:10:34'),(37,10,20,'Chicken Wings',3.00,NULL,1,NULL,NULL,NULL,'2026-09-17 16:31:49','2026-09-17 16:31:49'),(38,10,19,'Beef Salad',5.50,NULL,1,NULL,NULL,NULL,'2026-09-17 16:31:49','2026-09-17 16:31:49'),(39,11,20,'Chicken Wings',3.00,NULL,1,NULL,NULL,NULL,'2026-09-17 16:31:54','2026-09-17 16:31:54'),(40,11,19,'Beef Salad',5.50,NULL,1,NULL,NULL,NULL,'2026-09-17 16:31:54','2026-09-17 16:31:54'),(41,11,17,'Khmer Papaya Salad',3.00,NULL,2,NULL,NULL,NULL,'2026-09-17 16:31:54','2026-09-17 16:31:54'),(42,12,16,'Nom Ban Chok',2.50,NULL,2,NULL,NULL,NULL,'2026-09-17 16:33:15','2026-09-17 16:33:15'),(43,12,15,'Fried Noodles',4.00,NULL,3,NULL,NULL,NULL,'2026-09-17 16:33:15','2026-09-17 16:33:15'),(44,13,18,'Nhom Sdao',3.00,NULL,5,NULL,NULL,NULL,'2026-09-17 17:01:08','2026-09-17 17:01:08'),(45,13,17,'Khmer Papaya Salad',3.00,NULL,3,NULL,NULL,NULL,'2026-09-17 17:01:08','2026-09-17 17:01:08'),(46,14,17,'Khmer Papaya Salad',3.00,NULL,2,NULL,NULL,NULL,'2026-09-17 17:19:44','2026-09-17 17:19:44'),(47,14,11,'Beef Burger',2.50,NULL,2,NULL,NULL,NULL,'2026-09-17 17:19:44','2026-09-17 17:19:44'),(48,14,10,'Sting',1.00,NULL,2,NULL,NULL,NULL,'2026-09-17 17:19:44','2026-09-17 17:19:44'),(49,15,16,'Nom Ban Chok',2.50,NULL,1,NULL,NULL,NULL,'2026-09-17 17:25:05','2026-09-17 17:25:05'),(50,15,15,'Fried Noodles',4.00,NULL,2,NULL,NULL,NULL,'2026-09-17 17:25:05','2026-09-17 17:25:05'),(51,15,10,'Sting',1.00,NULL,2,NULL,NULL,NULL,'2026-09-17 17:25:05','2026-09-17 17:25:05'),(52,15,11,'Beef Burger',2.50,NULL,2,NULL,NULL,NULL,'2026-09-17 17:25:05','2026-09-17 17:25:05'),(53,16,20,'Chicken Wings',3.00,NULL,2,NULL,NULL,NULL,'2026-09-18 10:09:04','2026-09-18 10:09:04'),(54,16,19,'Beef Salad',5.50,NULL,2,NULL,NULL,NULL,'2026-09-18 10:09:04','2026-09-18 10:09:04'),(55,16,17,'Khmer Papaya Salad',3.00,NULL,1,NULL,NULL,NULL,'2026-09-18 10:09:04','2026-09-18 10:09:04'),(56,17,18,'Nhom Sdao',3.00,NULL,2,NULL,NULL,NULL,'2026-09-18 10:17:12','2026-09-18 10:17:12'),(57,17,17,'Khmer Papaya Salad',3.00,NULL,3,NULL,NULL,NULL,'2026-09-18 10:17:12','2026-09-18 10:17:12'),(58,17,11,'Beef Burger',2.50,NULL,3,NULL,NULL,NULL,'2026-09-18 10:17:12','2026-09-18 10:17:12'),(59,17,12,'Pizza',5.00,NULL,2,NULL,NULL,NULL,'2026-09-18 10:17:12','2026-09-18 10:17:12'),(60,18,17,'Khmer Papaya Salad',3.00,NULL,1,NULL,NULL,NULL,'2026-09-18 10:21:35','2026-09-18 10:21:35'),(61,18,16,'Nom Ban Chok',2.50,NULL,1,NULL,NULL,NULL,'2026-09-18 10:21:35','2026-09-18 10:21:35'),(62,18,11,'Beef Burger',2.50,NULL,1,NULL,NULL,NULL,'2026-09-18 10:21:35','2026-09-18 10:21:35'),(63,18,12,'Pizza',5.00,NULL,1,NULL,NULL,NULL,'2026-09-18 10:21:35','2026-09-18 10:21:35'),(64,18,13,'Fried Chicken',2.50,NULL,1,NULL,NULL,NULL,'2026-09-18 10:21:35','2026-09-18 10:21:35'),(65,19,17,'Khmer Papaya Salad',3.00,NULL,3,NULL,NULL,NULL,'2026-09-18 13:47:05','2026-09-18 13:47:05'),(66,19,18,'Nhom Sdao',3.00,NULL,3,NULL,NULL,NULL,'2026-09-18 13:47:05','2026-09-18 13:47:05'),(67,19,11,'Beef Burger',2.50,NULL,2,NULL,NULL,NULL,'2026-09-18 13:47:05','2026-09-18 13:47:05'),(68,20,19,'Beef Salad',5.50,NULL,1,NULL,NULL,NULL,'2026-09-27 15:09:49','2026-09-27 15:09:49'),(69,20,18,'Nhom Sdao',3.00,NULL,1,NULL,NULL,NULL,'2026-09-27 15:09:50','2026-09-27 15:09:50'),(70,20,20,'Chicken Wings',3.00,NULL,1,NULL,NULL,NULL,'2026-09-27 15:09:50','2026-09-27 15:09:50'),(71,21,18,'Nhom Sdao',3.00,NULL,2,NULL,NULL,NULL,'2026-09-27 15:13:22','2026-09-27 15:13:22'),(72,21,17,'Khmer Papaya Salad',3.00,NULL,1,NULL,NULL,NULL,'2026-09-27 15:13:22','2026-09-27 15:13:22'),(73,21,16,'Nom Ban Chok',2.50,NULL,2,NULL,NULL,NULL,'2026-09-27 15:13:22','2026-09-27 15:13:22'),(74,22,17,'Khmer Papaya Salad',3.00,NULL,1,NULL,NULL,NULL,'2026-09-27 15:16:06','2026-09-27 15:16:06'),(75,22,16,'Nom Ban Chok',2.50,NULL,2,NULL,NULL,NULL,'2026-09-27 15:16:06','2026-09-27 15:16:06'),(76,22,18,'Nhom Sdao',3.00,NULL,1,NULL,NULL,NULL,'2026-09-27 15:16:06','2026-09-27 15:16:06'),(77,23,18,'Nhom Sdao',3.00,NULL,1,NULL,NULL,NULL,'2026-09-27 15:20:18','2026-09-27 15:20:18'),(78,23,17,'Khmer Papaya Salad',3.00,NULL,1,NULL,NULL,NULL,'2026-09-27 15:20:18','2026-09-27 15:20:18'),(79,23,16,'Nom Ban Chok',2.50,NULL,1,NULL,NULL,NULL,'2026-09-27 15:20:18','2026-09-27 15:20:18'),(80,23,15,'Fried Noodles',4.00,NULL,1,NULL,NULL,NULL,'2026-09-27 15:20:18','2026-09-27 15:20:18'),(81,24,16,'Nom Ban Chok',2.50,NULL,1,NULL,NULL,NULL,'2026-09-27 15:21:20','2026-09-27 15:21:20'),(82,24,15,'Fried Noodles',4.00,NULL,1,NULL,NULL,NULL,'2026-09-27 15:21:20','2026-09-27 15:21:20'),(83,25,19,'Beef Salad',5.50,NULL,1,NULL,NULL,NULL,'2026-10-15 10:25:39','2026-10-15 10:25:39'),(84,25,18,'Nhom Sdao',2.70,NULL,1,NULL,NULL,NULL,'2026-10-15 10:25:39','2026-10-15 10:25:39'),(85,25,17,'Khmer Papaya Salad',3.00,NULL,1,NULL,NULL,NULL,'2026-10-15 10:25:39','2026-10-15 10:25:39'),(86,26,18,'Nhom Sdao',2.70,NULL,1,NULL,NULL,NULL,'2026-10-15 10:25:54','2026-10-15 10:25:54'),(87,26,17,'Khmer Papaya Salad',3.00,NULL,1,NULL,NULL,NULL,'2026-10-15 10:25:54','2026-10-15 10:25:54'),(88,26,16,'Nom Ban Chok',2.50,NULL,1,NULL,NULL,NULL,'2026-10-15 10:25:54','2026-10-15 10:25:54'),(89,27,19,'Beef Salad',5.50,NULL,1,NULL,NULL,NULL,'2026-10-15 10:26:08','2026-10-15 10:26:08'),(90,27,20,'Chicken Wings',3.00,NULL,1,NULL,NULL,NULL,'2026-10-15 10:26:08','2026-10-15 10:26:08'),(91,27,14,'Beef Noodle Soup',5.00,NULL,1,NULL,NULL,NULL,'2026-10-15 10:26:08','2026-10-15 10:26:08'),(92,28,16,'Nom Ban Chok',2.50,NULL,2,NULL,NULL,NULL,'2026-10-16 11:12:24','2026-10-16 11:12:24'),(93,28,15,'Fried Noodles',4.00,NULL,2,NULL,NULL,NULL,'2026-10-16 11:12:24','2026-10-16 11:12:24'),(94,29,18,'Nhom Sdao',3.00,NULL,1,NULL,NULL,NULL,'2026-10-19 08:52:49','2026-10-19 08:52:49'),(95,29,17,'Khmer Papaya Salad',3.00,NULL,1,NULL,NULL,NULL,'2026-10-19 08:52:49','2026-10-19 08:52:49'),(96,29,16,'Nom Ban Chok',2.50,NULL,1,NULL,NULL,NULL,'2026-10-19 08:52:49','2026-10-19 08:52:49'),(97,29,11,'Beef Burger',2.50,NULL,1,NULL,NULL,NULL,'2026-10-19 08:52:49','2026-10-19 08:52:49'),(98,30,19,'Beef Salad',5.50,NULL,1,NULL,NULL,NULL,'2026-10-19 09:31:22','2026-10-19 09:31:22'),(99,30,20,'Chicken Wings',3.00,NULL,1,NULL,NULL,NULL,'2026-10-19 09:31:22','2026-10-19 09:31:22'),(100,30,3,'Extra Rice',0.50,NULL,1,NULL,NULL,NULL,'2026-10-19 09:31:22','2026-10-19 09:31:22'),(101,31,18,'Nhom Sdao',3.00,NULL,1,NULL,NULL,NULL,'2026-10-19 09:51:46','2026-10-19 09:51:46'),(102,31,17,'Khmer Papaya Salad',3.00,NULL,1,NULL,NULL,NULL,'2026-10-19 09:51:46','2026-10-19 09:51:46'),(106,32,10,'Sting',1.00,NULL,1,NULL,NULL,NULL,'2026-10-19 10:08:24','2026-10-19 10:08:24'),(107,32,9,'Coconut',1.00,NULL,1,NULL,NULL,NULL,'2026-10-19 10:08:24','2026-10-19 10:08:24'),(108,32,3,'Extra Rice',0.50,NULL,1,NULL,NULL,NULL,'2026-10-19 10:08:24','2026-10-19 10:08:24'),(109,32,7,'Cheesecake',3.00,NULL,1,NULL,NULL,NULL,'2026-10-19 10:08:24','2026-10-19 10:08:24'),(110,32,2,'Extra Beef',2.00,NULL,1,NULL,NULL,NULL,'2026-10-19 10:08:24','2026-10-19 10:08:24'),(111,32,1,'Extra Egg',0.50,NULL,1,NULL,NULL,NULL,'2026-10-19 10:08:24','2026-10-19 10:08:24'),(112,33,16,'Nom Ban Chok',2.50,NULL,2,NULL,NULL,NULL,'2026-10-19 10:12:28','2026-10-19 10:12:28'),(113,33,17,'Khmer Papaya Salad',3.00,NULL,2,NULL,NULL,NULL,'2026-10-19 10:12:28','2026-10-19 10:12:28'),(114,33,18,'Nhom Sdao',3.00,NULL,2,NULL,NULL,NULL,'2026-10-19 10:12:28','2026-10-19 10:12:28'),(115,33,12,'Pizza',5.00,NULL,2,NULL,NULL,NULL,'2026-10-19 10:12:28','2026-10-19 10:12:28'),(116,33,13,'Fried Chicken',2.50,NULL,2,NULL,NULL,NULL,'2026-10-19 10:12:28','2026-10-19 10:12:28'),(117,33,14,'Beef Noodle Soup',5.00,NULL,2,NULL,NULL,NULL,'2026-10-19 10:12:28','2026-10-19 10:12:28'),(118,34,19,'Beef Salad',5.50,NULL,1,NULL,NULL,NULL,'2026-10-19 10:16:52','2026-10-19 10:16:52'),(119,34,18,'Nhom Sdao',3.00,NULL,1,NULL,NULL,NULL,'2026-10-19 10:16:52','2026-10-19 10:16:52'),(120,34,13,'Fried Chicken',2.50,NULL,1,NULL,NULL,NULL,'2026-10-19 10:16:52','2026-10-19 10:16:52'),(126,35,20,'Chicken Wings',3.00,NULL,1,NULL,NULL,NULL,'2026-10-19 10:31:07','2026-10-19 10:31:07'),(127,35,19,'Beef Salad',5.50,NULL,1,NULL,NULL,NULL,'2026-10-19 10:31:07','2026-10-19 10:31:07'),(128,35,14,'Beef Noodle Soup',5.00,NULL,1,NULL,NULL,NULL,'2026-10-19 10:31:07','2026-10-19 10:31:07'),(129,35,8,'Coca Cola',1.00,NULL,1,NULL,NULL,NULL,'2026-10-19 10:31:07','2026-10-19 10:31:07'),(130,35,7,'Cheesecake',3.00,NULL,1,NULL,NULL,NULL,'2026-10-19 10:31:07','2026-10-19 10:31:07'),(131,35,3,'Extra Rice',0.50,NULL,1,NULL,NULL,NULL,'2026-10-19 10:31:07','2026-10-19 10:31:07'),(132,43,17,'Khmer Papaya Salad',3.00,NULL,1,NULL,NULL,NULL,'2026-10-19 13:20:41','2026-10-19 16:22:34'),(133,43,16,'Nom Ban Chok',2.50,NULL,2,NULL,NULL,NULL,'2026-10-19 13:20:41','2026-10-19 16:22:34'),(134,43,15,'Fried Noodles',4.00,NULL,2,NULL,NULL,NULL,'2026-10-19 13:20:41','2026-10-19 16:22:34'),(135,43,15,'Fried Noodles',4.00,NULL,1,NULL,NULL,NULL,'2026-10-19 13:20:48','2026-10-19 16:22:34'),(136,43,16,'Nom Ban Chok',2.50,NULL,2,NULL,NULL,NULL,'2026-10-19 13:20:48','2026-10-19 16:22:34'),(137,43,18,'Nhom Sdao',3.00,NULL,1,NULL,NULL,NULL,'2026-10-19 16:07:43','2026-10-19 16:22:34'),(138,43,17,'Khmer Papaya Salad',3.00,NULL,2,NULL,NULL,NULL,'2026-10-19 16:07:43','2026-10-19 16:22:34'),(139,43,17,'Khmer Papaya Salad',3.00,NULL,2,NULL,NULL,NULL,'2026-10-19 16:11:31','2026-10-19 16:22:34'),(140,43,16,'Nom Ban Chok',2.50,NULL,2,NULL,NULL,NULL,'2026-10-19 16:11:31','2026-10-19 16:22:34'),(141,43,17,'Khmer Papaya Salad',3.00,NULL,1,NULL,NULL,NULL,'2026-10-19 16:14:31','2026-10-19 16:22:34'),(142,43,11,'Beef Burger',2.50,NULL,1,NULL,NULL,NULL,'2026-10-19 16:14:31','2026-10-19 16:22:34'),(143,43,16,'Nom Ban Chok',2.50,NULL,1,NULL,NULL,NULL,'2026-10-19 16:14:53','2026-10-19 16:22:34'),(144,43,15,'Fried Noodles',4.00,NULL,2,NULL,NULL,NULL,'2026-10-19 16:14:53','2026-10-19 16:22:34'),(145,43,11,'Beef Burger',2.50,NULL,1,NULL,NULL,NULL,'2026-10-19 16:15:05','2026-10-19 16:22:34'),(146,43,12,'Pizza',5.00,NULL,1,NULL,NULL,NULL,'2026-10-19 16:15:05','2026-10-19 16:22:34'),(147,43,19,'Beef Salad',5.50,NULL,1,NULL,NULL,NULL,'2026-10-19 16:22:13','2026-10-19 16:22:13');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_tables`
--

DROP TABLE IF EXISTS `order_tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_tables` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `table_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_tables_order_id_table_id_unique` (`order_id`,`table_id`),
  KEY `order_tables_order_id_index` (`order_id`),
  KEY `order_tables_table_id_index` (`table_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_tables`
--

LOCK TABLES `order_tables` WRITE;
/*!40000 ALTER TABLE `order_tables` DISABLE KEYS */;
INSERT INTO `order_tables` VALUES (9,43,9,'2026-10-19 16:22:34','2026-10-19 16:22:34'),(11,43,10,'2026-10-19 16:22:34','2026-10-19 16:22:34'),(12,43,15,'2026-10-19 16:22:34','2026-10-19 16:22:34');
/*!40000 ALTER TABLE `order_tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_ref` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dine_in',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `vip_discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `cancel_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staff_id` bigint unsigned DEFAULT NULL,
  `payment_method` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `working_shift_id` bigint unsigned DEFAULT NULL,
  `merged_into_order_id` bigint unsigned DEFAULT NULL,
  `cash_amount` decimal(12,2) DEFAULT NULL,
  `non_cash_amount` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_ref_unique` (`order_ref`),
  KEY `orders_staff_id_foreign` (`staff_id`),
  KEY `orders_working_shift_id_foreign` (`working_shift_id`),
  CONSTRAINT `orders_staff_id_foreign` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_working_shift_id_foreign` FOREIGN KEY (`working_shift_id`) REFERENCES `working_shifts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'ORD-000001','Bar 1','dine_in',8.90,0.00,0.00,0.00,'completed',NULL,1,'card','2026-09-17 10:18:59','2026-09-17 10:41:46',1,NULL,NULL,NULL),(2,'ORD-000002','Table 1','dine_in',31.40,0.00,0.00,0.00,'completed',NULL,1,'mobile','2026-09-17 10:51:09','2026-09-17 11:41:51',1,NULL,NULL,NULL),(3,'ORD-000003','Table 6','dine_in',12.15,0.00,0.00,1.35,'completed',NULL,1,'card','2026-09-17 11:47:41','2026-09-17 11:48:12',2,NULL,NULL,NULL),(4,'ORD-000004','Bar 2','dine_in',8.50,0.00,0.00,0.00,'completed',NULL,1,'card','2026-09-17 14:42:46','2026-09-17 14:52:10',2,NULL,NULL,NULL),(5,'ORD-000005','Bar 3','dine_in',11.75,3.63,2.18,1.31,'completed',NULL,1,'mobile','2026-09-17 14:42:56','2026-09-17 14:43:54',2,NULL,NULL,NULL),(6,'ORD-000006','App Order','app',22.77,0.00,2.30,2.53,'completed',NULL,1,'card','2026-09-17 14:54:28','2026-09-17 14:55:26',3,NULL,NULL,NULL),(7,'ORD-000007','Bar 2','dine_in',20.00,0.00,0.00,0.00,'completed',NULL,1,'card+cash','2026-09-17 14:55:37','2026-09-17 14:56:22',3,NULL,NULL,NULL),(8,'ORD-000008','App Order','app',9.00,0.00,0.00,0.00,'completed',NULL,1,'mobile','2026-09-17 15:10:26','2026-09-17 15:15:16',3,NULL,NULL,NULL),(9,'ORD-000009','Takeaway','takeaway',19.50,0.00,0.00,0.00,'completed',NULL,1,'cash','2026-09-17 15:10:34','2026-09-17 15:15:31',3,NULL,NULL,NULL),(10,'ORD-000010','Bar 4','dine_in',8.50,0.00,0.00,0.00,'cancelled',NULL,1,NULL,'2026-09-17 16:31:49','2026-09-17 16:31:49',4,NULL,NULL,NULL),(11,'ORD-000011','Bar 4','dine_in',14.50,0.00,0.00,0.00,'completed',NULL,1,'card','2026-09-17 16:31:54','2026-09-17 16:33:04',4,NULL,NULL,NULL),(12,'ORD-000012','Bar 2','dine_in',17.00,0.00,0.00,0.00,'completed',NULL,1,'mobile','2026-09-17 16:33:15','2026-09-17 16:33:18',4,NULL,NULL,NULL),(13,'ORD-000013','Bar 3','dine_in',24.00,0.00,0.00,0.00,'completed',NULL,1,'mobile','2026-09-17 17:01:08','2026-09-17 17:02:49',4,NULL,NULL,NULL),(14,'ORD-000014','Bar 3','dine_in',13.00,0.00,0.00,0.00,'completed',NULL,1,'card','2026-09-17 17:19:44','2026-09-17 17:19:49',5,NULL,NULL,NULL),(15,'ORD-000015','Bar 4','dine_in',17.50,0.00,0.00,0.00,'completed',NULL,1,'mobile','2026-09-17 17:25:05','2026-09-17 17:25:42',5,NULL,NULL,NULL),(16,'ORD-000016','Bar 1','dine_in',20.00,0.00,0.00,0.00,'completed',NULL,1,'card','2026-09-18 10:09:04','2026-09-18 10:14:26',6,NULL,NULL,NULL),(17,'ORD-000017','Bar 4','dine_in',32.50,0.00,0.00,0.00,'completed',NULL,1,'cash','2026-09-18 10:17:12','2026-09-18 10:17:22',6,NULL,NULL,NULL),(18,'ORD-000018','Bar 1','dine_in',15.50,0.00,0.00,0.00,'completed',NULL,1,'card','2026-09-18 10:21:35','2026-09-18 10:29:25',6,NULL,NULL,NULL),(19,'ORD-000019','Takeaway','takeaway',23.00,0.00,0.00,0.00,'completed',NULL,1,'cash','2026-09-18 13:47:05','2026-09-18 14:43:56',6,NULL,NULL,NULL),(20,'ORD-000020','A1','dine_in',11.50,0.00,0.00,0.00,'completed',NULL,2,'card','2026-09-27 15:09:46','2026-09-27 15:15:31',7,NULL,NULL,NULL),(21,'ORD-000021','Bar 3','dine_in',12.60,0.00,0.00,1.40,'completed',NULL,2,'card','2026-09-27 15:13:22','2026-09-27 15:15:03',7,NULL,NULL,NULL),(22,'ORD-000022','Bar 3','dine_in',11.00,0.00,0.00,0.00,'confirmed',NULL,2,NULL,'2026-09-27 15:16:06','2026-09-27 15:16:06',7,NULL,NULL,NULL),(23,'ORD-000023','App Order','app',12.50,0.00,0.00,0.00,'completed',NULL,2,'mobile','2026-09-27 15:20:18','2026-09-30 11:43:55',7,NULL,NULL,NULL),(24,'ORD-000024','Takeaway','takeaway',6.50,0.00,0.00,0.00,'completed',NULL,2,'card','2026-09-27 15:21:20','2026-09-30 11:44:03',7,NULL,NULL,NULL),(25,'ORD-000025','A1','dine_in',11.20,0.00,0.00,0.00,'completed',NULL,1,'cash','2026-10-15 10:25:39','2026-10-15 10:27:33',9,NULL,NULL,NULL),(26,'ORD-000026','Takeaway','takeaway',8.20,0.00,0.00,0.00,'completed',NULL,1,'mobile','2026-10-15 10:25:54','2026-10-15 10:26:46',9,NULL,NULL,NULL),(27,'ORD-000027','App Order','app',13.50,0.00,0.00,0.00,'completed',NULL,1,'card','2026-10-15 10:26:08','2026-10-16 11:08:56',NULL,NULL,NULL,NULL),(28,'ORD-000028','Order','takeaway',13.00,0.00,0.00,0.00,'completed',NULL,1,'cash','2026-10-16 11:12:24','2026-10-16 14:28:04',NULL,NULL,NULL,NULL),(29,'ORD-000029','Bar 4','dine_in',11.00,0.00,0.00,0.00,'completed',NULL,1,'cash','2026-10-19 08:52:49','2026-10-19 09:26:40',13,NULL,11.00,0.00),(30,'ORD-000030','Bar 4','dine_in',9.00,0.00,0.00,0.00,'completed',NULL,1,'cash','2026-10-19 09:31:22','2026-10-19 09:51:35',14,NULL,9.00,0.00),(31,'ORD-000031','Bar 4','dine_in',6.00,0.00,0.00,0.00,'completed',NULL,1,'cash','2026-10-19 09:51:46','2026-10-19 09:52:00',14,NULL,6.00,0.00),(32,'ORD-000032','Bar 7','dine_in',8.00,0.00,0.00,0.00,'completed',NULL,1,'cash','2026-10-19 10:08:09','2026-10-19 10:08:40',15,NULL,8.00,0.00),(33,'ORD-000033','Bar 7','dine_in',42.00,0.00,0.00,0.00,'completed',NULL,1,'cash','2026-10-19 10:12:28','2026-10-19 10:12:53',16,NULL,42.00,0.00),(34,'ORD-000034','Bar 4','dine_in',11.00,0.00,0.00,0.00,'completed',NULL,1,'cash','2026-10-19 10:16:52','2026-10-19 10:29:39',17,NULL,11.00,0.00),(35,'ORD-000035','Table 6','dine_in',18.00,0.00,0.00,0.00,'completed',NULL,1,'cash','2026-10-19 10:31:03','2026-10-19 10:31:12',18,NULL,18.00,0.00),(36,'ORD-000036','Bar 3','dine_in',0.00,0.00,0.00,0.00,'merged',NULL,1,NULL,'2026-10-19 13:20:41','2026-10-19 14:28:28',19,37,NULL,NULL),(37,'ORD-000037','A1','dine_in',0.00,0.00,0.00,0.00,'merged',NULL,1,NULL,'2026-10-19 13:20:48','2026-10-19 16:11:38',19,39,NULL,NULL),(38,'ORD-000038','Bar 3','dine_in',0.00,0.00,0.00,0.00,'merged',NULL,1,NULL,'2026-10-19 16:07:43','2026-10-19 16:07:49',19,37,NULL,NULL),(39,'ORD-000039','Bar 3','dine_in',0.00,0.00,0.00,0.00,'merged',NULL,1,NULL,'2026-10-19 16:11:31','2026-10-19 16:14:38',19,40,NULL,NULL),(40,'ORD-000040','Bar 4','dine_in',58.00,0.00,0.00,0.00,'completed',NULL,1,'mobile','2026-10-19 16:14:31','2026-10-19 16:29:35',19,43,0.00,58.00),(41,'ORD-000041','A1','dine_in',0.00,0.00,0.00,0.00,'merged',NULL,1,NULL,'2026-10-19 16:14:53','2026-10-19 16:21:24',19,40,NULL,NULL),(42,'ORD-000042','Bar 3','dine_in',0.00,0.00,0.00,0.00,'merged',NULL,1,NULL,'2026-10-19 16:15:05','2026-10-19 16:21:03',19,40,NULL,NULL),(43,'ORD-000043','A1','dine_in',16.00,0.00,0.00,0.00,'completed',NULL,1,'cash','2026-10-19 16:22:13','2026-10-19 16:30:10',19,NULL,16.00,0.00);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (30,'App\\Models\\User',1,'auth_token','3b5d207e2c57ab5330f18c4ce60a810358cdd3706465a7a77e9737ad421e248e','[\"*\"]','2026-10-17 09:46:48',NULL,'2026-10-17 09:41:44','2026-10-17 09:46:48'),(44,'App\\Models\\User',1,'auth_token','96c8203a9fcb6f653d898496951b31d67505ec8935fbc8b13431b02982e30306','[\"*\"]','2026-10-20 09:23:09',NULL,'2026-10-19 16:36:22','2026-10-20 09:23:09'),(47,'App\\Models\\User',3,'auth_token','7f7f311f98a6cfa34be536fa9d6b62084f0ec0403bbe5e6d871ae8e30746efb7','[\"*\"]','2026-10-20 09:25:59',NULL,'2026-10-20 09:16:16','2026-10-20 09:25:59');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `printers`
--

DROP TABLE IF EXISTS `printers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `printers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('online','offline') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'offline',
  `categories` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `printers`
--

LOCK TABLES `printers` WRITE;
/*!40000 ALTER TABLE `printers` DISABLE KEYS */;
/*!40000 ALTER TABLE `printers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation_items`
--

DROP TABLE IF EXISTS `reservation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reservation_id` bigint unsigned NOT NULL,
  `menu_item_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `original_price` decimal(10,2) DEFAULT NULL,
  `discount_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_value` decimal(10,2) DEFAULT NULL,
  `discount_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reservation_items_reservation_id_foreign` (`reservation_id`),
  KEY `reservation_items_menu_item_id_foreign` (`menu_item_id`),
  CONSTRAINT `reservation_items_menu_item_id_foreign` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reservation_items_reservation_id_foreign` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation_items`
--

LOCK TABLES `reservation_items` WRITE;
/*!40000 ALTER TABLE `reservation_items` DISABLE KEYS */;
INSERT INTO `reservation_items` VALUES (1,1,20,'Chicken Wings',3.00,3.00,NULL,NULL,NULL,1,'2026-09-17 14:36:21','2026-09-17 14:36:21'),(2,1,19,'Beef Salad',5.50,5.50,NULL,NULL,NULL,1,'2026-09-17 14:36:21','2026-09-17 14:36:21'),(3,3,20,'Chicken Wings',3.00,3.00,NULL,NULL,NULL,1,'2026-09-17 16:16:01','2026-09-17 16:16:01'),(4,3,19,'Beef Salad',5.50,5.50,NULL,NULL,NULL,1,'2026-09-17 16:16:01','2026-09-17 16:16:01'),(5,4,20,'Chicken Wings',3.00,3.00,NULL,NULL,NULL,1,'2026-09-17 17:20:34','2026-09-17 17:20:34'),(6,4,19,'Beef Salad',5.50,5.50,NULL,NULL,NULL,1,'2026-09-17 17:20:34','2026-09-17 17:20:34'),(7,4,18,'Nhom Sdao',3.00,3.00,NULL,NULL,NULL,1,'2026-09-17 17:20:34','2026-09-17 17:20:34');
/*!40000 ALTER TABLE `reservation_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation_tables`
--

DROP TABLE IF EXISTS `reservation_tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation_tables` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reservation_id` bigint unsigned NOT NULL,
  `table_id` bigint unsigned NOT NULL,
  `status` enum('reserved','cancelled','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'reserved',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reservation_tables_reservation_id_foreign` (`reservation_id`),
  KEY `reservation_tables_table_id_foreign` (`table_id`),
  CONSTRAINT `reservation_tables_reservation_id_foreign` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reservation_tables_table_id_foreign` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation_tables`
--

LOCK TABLES `reservation_tables` WRITE;
/*!40000 ALTER TABLE `reservation_tables` DISABLE KEYS */;
INSERT INTO `reservation_tables` VALUES (1,1,7,'cancelled','2026-09-17 14:36:21','2026-09-17 14:42:42'),(2,1,8,'completed','2026-09-17 14:36:21','2026-09-17 14:42:46'),(3,2,7,'cancelled','2026-09-17 14:42:42','2026-09-17 14:42:42'),(4,3,10,'completed','2026-09-17 16:16:01','2026-09-17 16:31:50'),(5,4,7,'cancelled','2026-09-17 17:20:34','2026-09-17 17:21:36'),(6,4,8,'cancelled','2026-09-17 17:20:34','2026-09-17 17:21:34'),(7,5,8,'cancelled','2026-09-17 17:21:34','2026-09-17 17:21:34'),(8,6,7,'cancelled','2026-09-17 17:21:36','2026-09-17 17:21:36'),(9,7,15,'completed','2026-09-27 14:31:32','2026-09-27 15:08:53'),(10,7,7,'reserved','2026-09-27 14:31:32','2026-09-27 14:31:32'),(11,7,8,'reserved','2026-09-27 14:31:32','2026-09-27 14:31:32');
/*!40000 ALTER TABLE `reservation_tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `arrival_datetime` datetime DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled','completed','no_show') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `total_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` VALUES (1,'ORN Vinseyla','060583613','2026-09-17 14:50:00','completed',8.50,NULL,'2026-09-17 14:36:21','2026-09-17 14:42:46',NULL),(2,'ORN Vinseyla','060583613','2026-09-17 14:50:00','cancelled',0.00,'[partial cancel audit]','2026-09-17 14:42:42','2026-09-17 14:42:42',NULL),(3,'Seyla','060583613','2026-09-17 16:31:00','completed',8.50,NULL,'2026-09-17 16:16:01','2026-09-17 16:31:50',NULL),(4,'BB','0123456789','2026-09-17 17:31:00','cancelled',11.50,NULL,'2026-09-17 17:20:34','2026-09-17 17:21:36',NULL),(5,'BB','0123456789','2026-09-17 17:31:00','cancelled',0.00,'[partial cancel audit]','2026-09-17 17:21:34','2026-09-17 17:21:34',NULL),(6,'BB','0123456789','2026-09-17 17:31:00','cancelled',0.00,'[partial cancel audit]','2026-09-17 17:21:36','2026-09-17 17:21:36',NULL),(7,'Nong','012345678','2026-09-27 14:45:00','no_show',0.00,NULL,'2026-09-27 14:31:32','2026-09-27 17:38:01',NULL);
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurant_tables`
--

DROP TABLE IF EXISTS `restaurant_tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_tables` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seats` int NOT NULL DEFAULT '4',
  `floor` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'main',
  `status` enum('available','occupied','reserved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `reserve_time` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `restaurant_tables_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_tables`
--

LOCK TABLES `restaurant_tables` WRITE;
/*!40000 ALTER TABLE `restaurant_tables` DISABLE KEYS */;
INSERT INTO `restaurant_tables` VALUES (1,'Table 1',6,'main','available',NULL,'2026-09-17 10:02:56','2026-09-17 11:41:55'),(2,'Table 2',6,'main','available',NULL,'2026-09-17 10:03:08','2026-09-17 10:03:08'),(3,'Table 3',4,'main','available',NULL,'2026-09-17 10:03:15','2026-09-17 10:03:15'),(4,'Table 4',4,'main','available',NULL,'2026-09-17 10:03:23','2026-09-17 10:03:23'),(5,'Table 5',4,'main','available',NULL,'2026-09-17 10:03:33','2026-09-17 10:03:33'),(6,'Table 6',4,'main','available',NULL,'2026-09-17 10:03:40','2026-10-19 10:31:14'),(7,'Bar 1',4,'Bar','available',NULL,'2026-09-17 10:03:56','2026-10-19 16:29:53'),(8,'Bar 2',2,'Bar','available',NULL,'2026-09-17 10:04:07','2026-09-27 17:38:01'),(9,'Bar 3',4,'Bar','available',NULL,'2026-09-17 10:04:16','2026-10-19 16:29:40'),(10,'Bar 4',4,'Bar','available',NULL,'2026-09-17 10:04:31','2026-10-19 16:29:38'),(11,'Bar 5',4,'Bar','available',NULL,'2026-09-17 10:04:40','2026-09-17 10:04:40'),(12,'Bar 6',6,'Bar','available',NULL,'2026-09-17 10:04:49','2026-09-17 10:04:49'),(13,'Bar 7',6,'Bar','available',NULL,'2026-09-17 10:05:00','2026-10-19 10:12:55'),(14,'Bar 8',4,'Bar','available',NULL,'2026-09-17 10:05:08','2026-09-17 10:05:08'),(15,'A1',4,'Floor 2','available',NULL,'2026-09-27 14:26:15','2026-10-19 16:30:13');
/*!40000 ALTER TABLE `restaurant_tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint unsigned NOT NULL,
  `page` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `page_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permission` enum('view','create','edit','delete') COLLATE utf8mb4_unicode_ci NOT NULL,
  `granted` tinyint(1) NOT NULL DEFAULT '0',
  `label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `label_kh` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section_kh` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `href` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_role_id_page_permission_unique` (`role_id`,`page`,`permission`),
  CONSTRAINT `role_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2670 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (98,1,'dashboard','dashboard','view',1,'Dashboard','ផ្ទាំងគ្រប់គ្រង',NULL,NULL,'/','2026-09-17 11:49:57','2026-09-17 11:49:57'),(99,1,'menu','menu','view',1,'Menu List','បញ្ជីមុខម្ហូប','Menus','មុខម្ហូប','/menu','2026-09-17 11:49:57','2026-09-17 11:49:57'),(100,1,'menu','menu','create',1,'Menu List','បញ្ជីមុខម្ហូប','Menus','មុខម្ហូប','/menu','2026-09-17 11:49:57','2026-09-17 11:49:57'),(101,1,'menu','menu','edit',1,'Menu List','បញ្ជីមុខម្ហូប','Menus','មុខម្ហូប','/menu','2026-09-17 11:49:57','2026-09-17 11:49:57'),(102,1,'menu','menu','delete',1,'Menu List','បញ្ជីមុខម្ហូប','Menus','មុខម្ហូប','/menu','2026-09-17 11:49:57','2026-09-17 11:49:57'),(103,1,'menu-categories','menu-categories','view',1,'Categories','ប្រភេទម្ហូប','Menus','មុខម្ហូប','/menu/categories','2026-09-17 11:49:57','2026-09-17 11:49:57'),(104,1,'menu-categories','menu-categories','create',1,'Categories','ប្រភេទម្ហូប','Menus','មុខម្ហូប','/menu/categories','2026-09-17 11:49:57','2026-09-17 11:49:57'),(105,1,'menu-categories','menu-categories','edit',1,'Categories','ប្រភេទម្ហូប','Menus','មុខម្ហូប','/menu/categories','2026-09-17 11:49:57','2026-09-17 11:49:57'),(106,1,'menu-categories','menu-categories','delete',1,'Categories','ប្រភេទម្ហូប','Menus','មុខម្ហូប','/menu/categories','2026-09-17 11:49:57','2026-09-17 11:49:57'),(107,1,'reserved','reserved','view',1,'Reservations','ការកក់តុ',NULL,NULL,'/reserved','2026-09-17 11:49:57','2026-09-17 11:49:57'),(108,1,'reserved','reserved','create',1,'Reservations','ការកក់តុ',NULL,NULL,'/reserved','2026-09-17 11:49:57','2026-09-17 11:49:57'),(109,1,'reserved','reserved','edit',1,'Reservations','ការកក់តុ',NULL,NULL,'/reserved','2026-09-17 11:49:57','2026-09-17 11:49:57'),(110,1,'reserved','reserved','delete',1,'Reservations','ការកក់តុ',NULL,NULL,'/reserved','2026-09-17 11:49:57','2026-09-17 11:49:57'),(111,1,'discount','discount','view',1,'Discounts','ការបញ្ចុះតម្លៃ',NULL,NULL,'/discount','2026-09-17 11:49:57','2026-09-17 11:49:57'),(112,1,'discount','discount','create',1,'Discounts','ការបញ្ចុះតម្លៃ',NULL,NULL,'/discount','2026-09-17 11:49:57','2026-09-17 11:49:57'),(113,1,'discount','discount','edit',1,'Discounts','ការបញ្ចុះតម្លៃ',NULL,NULL,'/discount','2026-09-17 11:49:57','2026-09-17 11:49:57'),(114,1,'discount','discount','delete',1,'Discounts','ការបញ្ចុះតម្លៃ',NULL,NULL,'/discount','2026-09-17 11:49:57','2026-09-17 11:49:57'),(115,1,'tables','tables','view',1,'Tables','តុអាហារ',NULL,NULL,'/tables','2026-09-17 11:49:57','2026-09-17 11:49:57'),(116,1,'tables','tables','create',1,'Tables','តុអាហារ',NULL,NULL,'/tables','2026-09-17 11:49:57','2026-09-17 11:49:57'),(117,1,'tables','tables','edit',1,'Tables','តុអាហារ',NULL,NULL,'/tables','2026-09-17 11:49:57','2026-09-17 11:49:57'),(118,1,'tables','tables','delete',1,'Tables','តុអាហារ',NULL,NULL,'/tables','2026-09-17 11:49:57','2026-09-17 11:49:57'),(119,1,'vip-card','vip-card','view',1,'VIP Card','កាតសមាជិក',NULL,NULL,'/vip-card','2026-09-17 11:49:57','2026-09-17 11:49:57'),(120,1,'vip-card','vip-card','create',1,'VIP Card','កាតសមាជិក',NULL,NULL,'/vip-card','2026-09-17 11:49:57','2026-09-17 11:49:57'),(121,1,'vip-card','vip-card','edit',1,'VIP Card','កាតសមាជិក',NULL,NULL,'/vip-card','2026-09-17 11:49:57','2026-09-17 11:49:57'),(122,1,'vip-card','vip-card','delete',1,'VIP Card','កាតសមាជិក',NULL,NULL,'/vip-card','2026-09-17 11:49:57','2026-09-17 11:49:57'),(123,1,'inventory','inventory','view',1,'Stock','បញ្ជីស្តុក','Inventory','ស្តុកទំនិញ','/inventory','2026-09-17 11:49:57','2026-09-17 11:49:57'),(124,1,'inventory','inventory','create',1,'Stock','បញ្ជីស្តុក','Inventory','ស្តុកទំនិញ','/inventory','2026-09-17 11:49:57','2026-09-17 11:49:57'),(125,1,'inventory','inventory','edit',1,'Stock','បញ្ជីស្តុក','Inventory','ស្តុកទំនិញ','/inventory','2026-09-17 11:49:57','2026-09-17 11:49:57'),(126,1,'inventory','inventory','delete',1,'Stock','បញ្ជីស្តុក','Inventory','ស្តុកទំនិញ','/inventory','2026-09-17 11:49:57','2026-09-17 11:49:57'),(127,1,'inventory-categories','inventory-categories','view',1,'Categories','ប្រភេទស្តុក','Inventory','ស្តុកទំនិញ','/inventory/categories','2026-09-17 11:49:57','2026-09-17 11:49:57'),(128,1,'inventory-categories','inventory-categories','create',1,'Categories','ប្រភេទស្តុក','Inventory','ស្តុកទំនិញ','/inventory/categories','2026-09-17 11:49:57','2026-09-17 11:49:57'),(129,1,'inventory-categories','inventory-categories','edit',1,'Categories','ប្រភេទស្តុក','Inventory','ស្តុកទំនិញ','/inventory/categories','2026-09-17 11:49:57','2026-09-17 11:49:57'),(130,1,'inventory-categories','inventory-categories','delete',1,'Categories','ប្រភេទស្តុក','Inventory','ស្តុកទំនិញ','/inventory/categories','2026-09-17 11:49:57','2026-09-17 11:49:57'),(131,1,'supplier','supplier','view',1,'Supplier','អ្នកផ្គត់ផ្គង់','Inventory','ស្តុកទំនិញ','/inventory/suppliers','2026-09-17 11:49:57','2026-09-17 11:49:57'),(132,1,'supplier','supplier','create',1,'Supplier','អ្នកផ្គត់ផ្គង់','Inventory','ស្តុកទំនិញ','/inventory/suppliers','2026-09-17 11:49:57','2026-09-17 11:49:57'),(133,1,'supplier','supplier','edit',1,'Supplier','អ្នកផ្គត់ផ្គង់','Inventory','ស្តុកទំនិញ','/inventory/suppliers','2026-09-17 11:49:57','2026-09-17 11:49:57'),(134,1,'supplier','supplier','delete',1,'Supplier','អ្នកផ្គត់ផ្គង់','Inventory','ស្តុកទំនិញ','/inventory/suppliers','2026-09-17 11:49:57','2026-09-17 11:49:57'),(135,1,'spoilage','spoilage','view',1,'Spoilage','ទំនិញខូច','Inventory','ស្តុកទំនិញ','/inventory/spoilage','2026-09-17 11:49:57','2026-09-17 11:49:57'),(136,1,'spoilage','spoilage','create',1,'Spoilage','ទំនិញខូច','Inventory','ស្តុកទំនិញ','/inventory/spoilage','2026-09-17 11:49:57','2026-09-17 11:49:57'),(137,1,'spoilage','spoilage','edit',1,'Spoilage','ទំនិញខូច','Inventory','ស្តុកទំនិញ','/inventory/spoilage','2026-09-17 11:49:57','2026-09-17 11:49:57'),(138,1,'spoilage','spoilage','delete',1,'Spoilage','ទំនិញខូច','Inventory','ស្តុកទំនិញ','/inventory/spoilage','2026-09-17 11:49:57','2026-09-17 11:49:57'),(139,1,'stock-history','stock-history','view',1,'Stock History','ប្រវត្តិស្តុក','Inventory','ស្តុកទំនិញ','/inventory/stock-history','2026-09-17 11:49:57','2026-09-17 11:49:57'),(140,1,'stock-history','stock-history','create',1,'Stock History','ប្រវត្តិស្តុក','Inventory','ស្តុកទំនិញ','/inventory/stock-history','2026-09-17 11:49:57','2026-09-17 11:49:57'),(141,1,'stock-history','stock-history','edit',1,'Stock History','ប្រវត្តិស្តុក','Inventory','ស្តុកទំនិញ','/inventory/stock-history','2026-09-17 11:49:57','2026-09-17 11:49:57'),(142,1,'stock-history','stock-history','delete',1,'Stock History','ប្រវត្តិស្តុក','Inventory','ស្តុកទំនិញ','/inventory/stock-history','2026-09-17 11:49:57','2026-09-17 11:49:57'),(143,1,'transactions','transactions','view',1,'Transactions','ប្រតិបត្តិការ','Sales','ការលក់','/payments','2026-09-17 11:49:57','2026-09-17 11:49:57'),(144,1,'transactions','transactions','create',1,'Transactions','ប្រតិបត្តិការ','Sales','ការលក់','/payments','2026-09-17 11:49:57','2026-09-17 11:49:57'),(145,1,'transactions','transactions','edit',1,'Transactions','ប្រតិបត្តិការ','Sales','ការលក់','/payments','2026-09-17 11:49:57','2026-09-17 11:49:57'),(146,1,'transactions','transactions','delete',1,'Transactions','ប្រតិបត្តិការ','Sales','ការលក់','/payments','2026-09-17 11:49:57','2026-09-17 11:49:57'),(147,1,'orders-history','orders-history','view',1,'Order History','ប្រវត្តិលក់','Sales','ការលក់','/orders','2026-09-17 11:49:57','2026-09-17 11:49:57'),(148,1,'orders-history','orders-history','create',1,'Order History','ប្រវត្តិលក់','Sales','ការលក់','/orders','2026-09-17 11:49:57','2026-09-17 11:49:57'),(149,1,'orders-history','orders-history','edit',1,'Order History','ប្រវត្តិលក់','Sales','ការលក់','/orders','2026-09-17 11:49:57','2026-09-17 11:49:57'),(150,1,'orders-history','orders-history','delete',1,'Order History','ប្រវត្តិលក់','Sales','ការលក់','/orders','2026-09-17 11:49:57','2026-09-17 11:49:57'),(151,1,'income','income','view',1,'Income','ចំណូល','Records','កំណត់ត្រា','/records/income','2026-09-17 11:49:57','2026-09-17 11:49:57'),(152,1,'income','income','create',1,'Income','ចំណូល','Records','កំណត់ត្រា','/records/income','2026-09-17 11:49:57','2026-09-17 11:49:57'),(153,1,'income','income','edit',1,'Income','ចំណូល','Records','កំណត់ត្រា','/records/income','2026-09-17 11:49:57','2026-09-17 11:49:57'),(154,1,'income','income','delete',1,'Income','ចំណូល','Records','កំណត់ត្រា','/records/income','2026-09-17 11:49:57','2026-09-17 11:49:57'),(155,1,'finance-categories','finance-categories','view',1,'Categories','ប្រភេទ','Records','កំណត់ត្រា','/records/categories','2026-09-17 11:49:57','2026-09-17 11:49:57'),(156,1,'finance-categories','finance-categories','create',1,'Categories','ប្រភេទ','Records','កំណត់ត្រា','/records/categories','2026-09-17 11:49:57','2026-09-17 11:49:57'),(157,1,'finance-categories','finance-categories','edit',1,'Categories','ប្រភេទ','Records','កំណត់ត្រា','/records/categories','2026-09-17 11:49:57','2026-09-17 11:49:57'),(158,1,'finance-categories','finance-categories','delete',1,'Categories','ប្រភេទ','Records','កំណត់ត្រា','/records/categories','2026-09-17 11:49:57','2026-09-17 11:49:57'),(159,1,'expense','expense','view',1,'Expenses','ចំណាយ','Records','កំណត់ត្រា','/records/expense','2026-09-17 11:49:57','2026-09-17 11:49:57'),(160,1,'expense','expense','create',1,'Expenses','ចំណាយ','Records','កំណត់ត្រា','/records/expense','2026-09-17 11:49:57','2026-09-17 11:49:57'),(161,1,'expense','expense','edit',1,'Expenses','ចំណាយ','Records','កំណត់ត្រា','/records/expense','2026-09-17 11:49:57','2026-09-17 11:49:57'),(162,1,'expense','expense','delete',1,'Expenses','ចំណាយ','Records','កំណត់ត្រា','/records/expense','2026-09-17 11:49:57','2026-09-17 11:49:57'),(163,1,'overview-report','overview-report','view',1,'Overview','របាយការណ៍លក់','Reports','របាយការណ៍','/reports','2026-09-17 11:49:57','2026-09-17 11:49:57'),(164,1,'overview-report','overview-report','create',1,'Overview','របាយការណ៍លក់','Reports','របាយការណ៍','/reports','2026-09-17 11:49:57','2026-09-17 11:49:57'),(165,1,'overview-report','overview-report','edit',1,'Overview','របាយការណ៍លក់','Reports','របាយការណ៍','/reports','2026-09-17 11:49:57','2026-09-17 11:49:57'),(166,1,'overview-report','overview-report','delete',1,'Overview','របាយការណ៍លក់','Reports','របាយការណ៍','/reports','2026-09-17 11:49:57','2026-09-17 11:49:57'),(167,1,'shift-report','shift-report','view',1,'Shift Report','របាយការណ៍វេន','Reports','របាយការណ៍','/reports/shifts','2026-09-17 11:49:57','2026-09-17 11:49:57'),(168,1,'shift-report','shift-report','create',1,'Shift Report','របាយការណ៍វេន','Reports','របាយការណ៍','/reports/shifts','2026-09-17 11:49:57','2026-09-17 11:49:57'),(169,1,'shift-report','shift-report','edit',1,'Shift Report','របាយការណ៍វេន','Reports','របាយការណ៍','/reports/shifts','2026-09-17 11:49:57','2026-09-17 11:49:57'),(170,1,'shift-report','shift-report','delete',1,'Shift Report','របាយការណ៍វេន','Reports','របាយការណ៍','/reports/shifts','2026-09-17 11:49:57','2026-09-17 11:49:57'),(171,1,'inventory-report','inventory-report','view',1,'Inventory','របាយការណ៍ស្តុក','Reports','របាយការណ៍','/reports/inventory','2026-09-17 11:49:57','2026-09-17 11:49:57'),(172,1,'inventory-report','inventory-report','create',1,'Inventory','របាយការណ៍ស្តុក','Reports','របាយការណ៍','/reports/inventory','2026-09-17 11:49:57','2026-09-17 11:49:57'),(173,1,'inventory-report','inventory-report','edit',1,'Inventory','របាយការណ៍ស្តុក','Reports','របាយការណ៍','/reports/inventory','2026-09-17 11:49:57','2026-09-17 11:49:57'),(174,1,'inventory-report','inventory-report','delete',1,'Inventory','របាយការណ៍ស្តុក','Reports','របាយការណ៍','/reports/inventory','2026-09-17 11:49:57','2026-09-17 11:49:57'),(175,1,'general-settings','general-settings','view',1,'General Settings','ការកំណត់ទូទៅ','Settings','ការកំណត់','/settings/general','2026-09-17 11:49:57','2026-09-17 11:49:57'),(176,1,'general-settings','general-settings','create',1,'General Settings','ការកំណត់ទូទៅ','Settings','ការកំណត់','/settings/general','2026-09-17 11:49:57','2026-09-17 11:49:57'),(177,1,'general-settings','general-settings','edit',1,'General Settings','ការកំណត់ទូទៅ','Settings','ការកំណត់','/settings/general','2026-09-17 11:49:57','2026-09-17 11:49:57'),(178,1,'general-settings','general-settings','delete',1,'General Settings','ការកំណត់ទូទៅ','Settings','ការកំណត់','/settings/general','2026-09-17 11:49:57','2026-09-17 11:49:57'),(179,1,'staff','staff','view',1,'Staff','បុគ្គលិក','Settings','ការកំណត់','/settings/staff','2026-09-17 11:49:57','2026-09-17 11:49:57'),(180,1,'staff','staff','create',1,'Staff','បុគ្គលិក','Settings','ការកំណត់','/settings/staff','2026-09-17 11:49:57','2026-09-17 11:49:57'),(181,1,'staff','staff','edit',1,'Staff','បុគ្គលិក','Settings','ការកំណត់','/settings/staff','2026-09-17 11:49:57','2026-09-17 11:49:57'),(182,1,'staff','staff','delete',1,'Staff','បុគ្គលិក','Settings','ការកំណត់','/settings/staff','2026-09-17 11:49:57','2026-09-17 11:49:57'),(183,1,'users','users','view',1,'Users','អ្នកប្រើប្រាស់','Settings','ការកំណត់','/settings/users','2026-09-17 11:49:57','2026-09-17 11:49:57'),(184,1,'users','users','create',1,'Users','អ្នកប្រើប្រាស់','Settings','ការកំណត់','/settings/users','2026-09-17 11:49:57','2026-09-17 11:49:57'),(185,1,'users','users','edit',1,'Users','អ្នកប្រើប្រាស់','Settings','ការកំណត់','/settings/users','2026-09-17 11:49:57','2026-09-17 11:49:57'),(186,1,'users','users','delete',1,'Users','អ្នកប្រើប្រាស់','Settings','ការកំណត់','/settings/users','2026-09-17 11:49:57','2026-09-17 11:49:57'),(187,1,'roles','roles','view',1,'Role','កំណត់សិទ្ធិ','Settings','ការកំណត់','/settings/role','2026-09-17 11:49:57','2026-09-17 11:49:57'),(188,1,'roles','roles','create',1,'Role','កំណត់សិទ្ធិ','Settings','ការកំណត់','/settings/role','2026-09-17 11:49:57','2026-09-17 11:49:57'),(189,1,'roles','roles','edit',1,'Role','កំណត់សិទ្ធិ','Settings','ការកំណត់','/settings/role','2026-09-17 11:49:57','2026-09-17 11:49:57'),(190,1,'roles','roles','delete',1,'Role','កំណត់សិទ្ធិ','Settings','ការកំណត់','/settings/role','2026-09-17 11:49:57','2026-09-17 11:49:57'),(191,1,'workshifts','workshifts','view',1,'Working Shifts','វេនធ្វើការ','Settings','ការកំណត់','/settings/workshifts','2026-09-17 11:49:57','2026-09-17 11:49:57'),(192,1,'workshifts','workshifts','create',1,'Working Shifts','វេនធ្វើការ','Settings','ការកំណត់','/settings/workshifts','2026-09-17 11:49:57','2026-09-17 11:49:57'),(193,1,'workshifts','workshifts','edit',1,'Working Shifts','វេនធ្វើការ','Settings','ការកំណត់','/settings/workshifts','2026-09-17 11:49:57','2026-09-17 11:49:57'),(194,1,'workshifts','workshifts','delete',1,'Working Shifts','វេនធ្វើការ','Settings','ការកំណត់','/settings/workshifts','2026-09-17 11:49:57','2026-09-17 11:49:57'),(2566,2,'dashboard','dashboard','view',1,'Dashboard','ផ្ទាំងគ្រប់គ្រង',NULL,NULL,'/','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2567,2,'dashboard','dashboard','create',0,'Dashboard','ផ្ទាំងគ្រប់គ្រង',NULL,NULL,'/','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2568,2,'dashboard','dashboard','edit',0,'Dashboard','ផ្ទាំងគ្រប់គ្រង',NULL,NULL,'/','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2569,2,'dashboard','dashboard','delete',0,'Dashboard','ផ្ទាំងគ្រប់គ្រង',NULL,NULL,'/','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2570,2,'orders','orders','view',1,'POS','ការលក់',NULL,NULL,'/pos','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2571,2,'orders','orders','create',1,'POS','ការលក់',NULL,NULL,'/pos','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2572,2,'orders','orders','edit',0,'POS','ការលក់',NULL,NULL,'/pos','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2573,2,'orders','orders','delete',1,'POS','ការលក់',NULL,NULL,'/pos','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2574,2,'menu','menu','view',1,'Menu List','បញ្ជីមុខម្ហូប','Menus','មុខម្ហូប','/menu','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2575,2,'menu','menu','create',1,'Menu List','បញ្ជីមុខម្ហូប','Menus','មុខម្ហូប','/menu','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2576,2,'menu','menu','edit',0,'Menu List','បញ្ជីមុខម្ហូប','Menus','មុខម្ហូប','/menu','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2577,2,'menu','menu','delete',1,'Menu List','បញ្ជីមុខម្ហូប','Menus','មុខម្ហូប','/menu','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2578,2,'menu-categories','menu-categories','view',1,'Categories','ប្រភេទម្ហូប','Menus','មុខម្ហូប','/menu/categories','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2579,2,'menu-categories','menu-categories','create',1,'Categories','ប្រភេទម្ហូប','Menus','មុខម្ហូប','/menu/categories','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2580,2,'menu-categories','menu-categories','edit',0,'Categories','ប្រភេទម្ហូប','Menus','មុខម្ហូប','/menu/categories','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2581,2,'menu-categories','menu-categories','delete',1,'Categories','ប្រភេទម្ហូប','Menus','មុខម្ហូប','/menu/categories','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2582,2,'reserved','reserved','view',1,'Reservations','ការកក់តុ',NULL,NULL,'/reserved','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2583,2,'reserved','reserved','create',1,'Reservations','ការកក់តុ',NULL,NULL,'/reserved','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2584,2,'reserved','reserved','edit',0,'Reservations','ការកក់តុ',NULL,NULL,'/reserved','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2585,2,'reserved','reserved','delete',1,'Reservations','ការកក់តុ',NULL,NULL,'/reserved','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2586,2,'discount','discount','view',1,'Discounts','ការបញ្ចុះតម្លៃ',NULL,NULL,'/discount','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2587,2,'discount','discount','create',1,'Discounts','ការបញ្ចុះតម្លៃ',NULL,NULL,'/discount','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2588,2,'discount','discount','edit',0,'Discounts','ការបញ្ចុះតម្លៃ',NULL,NULL,'/discount','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2589,2,'discount','discount','delete',1,'Discounts','ការបញ្ចុះតម្លៃ',NULL,NULL,'/discount','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2590,2,'tables','tables','view',1,'Tables','តុអាហារ',NULL,NULL,'/tables','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2591,2,'tables','tables','create',1,'Tables','តុអាហារ',NULL,NULL,'/tables','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2592,2,'tables','tables','edit',0,'Tables','តុអាហារ',NULL,NULL,'/tables','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2593,2,'tables','tables','delete',1,'Tables','តុអាហារ',NULL,NULL,'/tables','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2594,2,'vip-card','vip-card','view',1,'VIP Card','កាតសមាជិក',NULL,NULL,'/vip-card','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2595,2,'vip-card','vip-card','create',1,'VIP Card','កាតសមាជិក',NULL,NULL,'/vip-card','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2596,2,'vip-card','vip-card','edit',0,'VIP Card','កាតសមាជិក',NULL,NULL,'/vip-card','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2597,2,'vip-card','vip-card','delete',1,'VIP Card','កាតសមាជិក',NULL,NULL,'/vip-card','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2598,2,'inventory','inventory','view',1,'Stock','បញ្ជីស្តុក','Inventory','ស្តុកទំនិញ','/inventory','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2599,2,'inventory','inventory','create',1,'Stock','បញ្ជីស្តុក','Inventory','ស្តុកទំនិញ','/inventory','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2600,2,'inventory','inventory','edit',0,'Stock','បញ្ជីស្តុក','Inventory','ស្តុកទំនិញ','/inventory','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2601,2,'inventory','inventory','delete',1,'Stock','បញ្ជីស្តុក','Inventory','ស្តុកទំនិញ','/inventory','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2602,2,'inventory-categories','inventory-categories','view',1,'Categories','ប្រភេទស្តុក','Inventory','ស្តុកទំនិញ','/inventory/categories','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2603,2,'inventory-categories','inventory-categories','create',1,'Categories','ប្រភេទស្តុក','Inventory','ស្តុកទំនិញ','/inventory/categories','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2604,2,'inventory-categories','inventory-categories','edit',0,'Categories','ប្រភេទស្តុក','Inventory','ស្តុកទំនិញ','/inventory/categories','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2605,2,'inventory-categories','inventory-categories','delete',1,'Categories','ប្រភេទស្តុក','Inventory','ស្តុកទំនិញ','/inventory/categories','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2606,2,'supplier','supplier','view',1,'Supplier','អ្នកផ្គត់ផ្គង់','Inventory','ស្តុកទំនិញ','/inventory/suppliers','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2607,2,'supplier','supplier','create',1,'Supplier','អ្នកផ្គត់ផ្គង់','Inventory','ស្តុកទំនិញ','/inventory/suppliers','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2608,2,'supplier','supplier','edit',0,'Supplier','អ្នកផ្គត់ផ្គង់','Inventory','ស្តុកទំនិញ','/inventory/suppliers','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2609,2,'supplier','supplier','delete',1,'Supplier','អ្នកផ្គត់ផ្គង់','Inventory','ស្តុកទំនិញ','/inventory/suppliers','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2610,2,'spoilage','spoilage','view',1,'Spoilage','ទំនិញខូច','Inventory','ស្តុកទំនិញ','/inventory/spoilage','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2611,2,'spoilage','spoilage','create',1,'Spoilage','ទំនិញខូច','Inventory','ស្តុកទំនិញ','/inventory/spoilage','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2612,2,'spoilage','spoilage','edit',0,'Spoilage','ទំនិញខូច','Inventory','ស្តុកទំនិញ','/inventory/spoilage','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2613,2,'spoilage','spoilage','delete',1,'Spoilage','ទំនិញខូច','Inventory','ស្តុកទំនិញ','/inventory/spoilage','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2614,2,'stock-history','stock-history','view',1,'Stock History','ប្រវត្តិស្តុក','Inventory','ស្តុកទំនិញ','/inventory/stock-history','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2615,2,'stock-history','stock-history','create',0,'Stock History','ប្រវត្តិស្តុក','Inventory','ស្តុកទំនិញ','/inventory/stock-history','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2616,2,'stock-history','stock-history','edit',0,'Stock History','ប្រវត្តិស្តុក','Inventory','ស្តុកទំនិញ','/inventory/stock-history','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2617,2,'stock-history','stock-history','delete',0,'Stock History','ប្រវត្តិស្តុក','Inventory','ស្តុកទំនិញ','/inventory/stock-history','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2618,2,'transactions','transactions','view',1,'Transactions','ប្រតិបត្តិការ','Sales','ការលក់','/payments','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2619,2,'transactions','transactions','create',0,'Transactions','ប្រតិបត្តិការ','Sales','ការលក់','/payments','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2620,2,'transactions','transactions','edit',0,'Transactions','ប្រតិបត្តិការ','Sales','ការលក់','/payments','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2621,2,'transactions','transactions','delete',0,'Transactions','ប្រតិបត្តិការ','Sales','ការលក់','/payments','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2622,2,'orders-history','orders-history','view',1,'Order History','ប្រវត្តិលក់','Sales','ការលក់','/orders','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2623,2,'orders-history','orders-history','create',0,'Order History','ប្រវត្តិលក់','Sales','ការលក់','/orders','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2624,2,'orders-history','orders-history','edit',0,'Order History','ប្រវត្តិលក់','Sales','ការលក់','/orders','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2625,2,'orders-history','orders-history','delete',0,'Order History','ប្រវត្តិលក់','Sales','ការលក់','/orders','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2626,2,'income','income','view',1,'Income','ចំណូល','Records','កំណត់ត្រា','/records/income','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2627,2,'income','income','create',1,'Income','ចំណូល','Records','កំណត់ត្រា','/records/income','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2628,2,'income','income','edit',0,'Income','ចំណូល','Records','កំណត់ត្រា','/records/income','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2629,2,'income','income','delete',1,'Income','ចំណូល','Records','កំណត់ត្រា','/records/income','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2630,2,'finance-categories','finance-categories','view',1,'Categories','ប្រភេទ','Records','កំណត់ត្រា','/records/categories','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2631,2,'finance-categories','finance-categories','create',1,'Categories','ប្រភេទ','Records','កំណត់ត្រា','/records/categories','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2632,2,'finance-categories','finance-categories','edit',0,'Categories','ប្រភេទ','Records','កំណត់ត្រា','/records/categories','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2633,2,'finance-categories','finance-categories','delete',1,'Categories','ប្រភេទ','Records','កំណត់ត្រា','/records/categories','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2634,2,'expense','expense','view',1,'Expenses','ចំណាយ','Records','កំណត់ត្រា','/records/expense','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2635,2,'expense','expense','create',1,'Expenses','ចំណាយ','Records','កំណត់ត្រា','/records/expense','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2636,2,'expense','expense','edit',0,'Expenses','ចំណាយ','Records','កំណត់ត្រា','/records/expense','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2637,2,'expense','expense','delete',1,'Expenses','ចំណាយ','Records','កំណត់ត្រា','/records/expense','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2638,2,'overview-report','overview-report','view',1,'Overview','របាយការណ៍លក់','Reports','របាយការណ៍','/reports','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2639,2,'overview-report','overview-report','create',0,'Overview','របាយការណ៍លក់','Reports','របាយការណ៍','/reports','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2640,2,'overview-report','overview-report','edit',0,'Overview','របាយការណ៍លក់','Reports','របាយការណ៍','/reports','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2641,2,'overview-report','overview-report','delete',0,'Overview','របាយការណ៍លក់','Reports','របាយការណ៍','/reports','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2642,2,'shift-report','shift-report','view',1,'Shift Report','របាយការណ៍វេន','Reports','របាយការណ៍','/reports/shifts','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2643,2,'shift-report','shift-report','create',0,'Shift Report','របាយការណ៍វេន','Reports','របាយការណ៍','/reports/shifts','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2644,2,'shift-report','shift-report','edit',0,'Shift Report','របាយការណ៍វេន','Reports','របាយការណ៍','/reports/shifts','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2645,2,'shift-report','shift-report','delete',0,'Shift Report','របាយការណ៍វេន','Reports','របាយការណ៍','/reports/shifts','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2646,2,'inventory-report','inventory-report','view',1,'Inventory','របាយការណ៍ស្តុក','Reports','របាយការណ៍','/reports/inventory','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2647,2,'inventory-report','inventory-report','create',0,'Inventory','របាយការណ៍ស្តុក','Reports','របាយការណ៍','/reports/inventory','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2648,2,'inventory-report','inventory-report','edit',0,'Inventory','របាយការណ៍ស្តុក','Reports','របាយការណ៍','/reports/inventory','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2649,2,'inventory-report','inventory-report','delete',0,'Inventory','របាយការណ៍ស្តុក','Reports','របាយការណ៍','/reports/inventory','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2650,2,'general-settings','general-settings','view',1,'General Settings','ការកំណត់ទូទៅ','Settings','ការកំណត់','/settings/general','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2651,2,'general-settings','general-settings','create',1,'General Settings','ការកំណត់ទូទៅ','Settings','ការកំណត់','/settings/general','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2652,2,'general-settings','general-settings','edit',0,'General Settings','ការកំណត់ទូទៅ','Settings','ការកំណត់','/settings/general','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2653,2,'general-settings','general-settings','delete',1,'General Settings','ការកំណត់ទូទៅ','Settings','ការកំណត់','/settings/general','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2654,2,'staff','staff','view',1,'Staff','បុគ្គលិក','Settings','ការកំណត់','/settings/staff','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2655,2,'staff','staff','create',1,'Staff','បុគ្គលិក','Settings','ការកំណត់','/settings/staff','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2656,2,'staff','staff','edit',0,'Staff','បុគ្គលិក','Settings','ការកំណត់','/settings/staff','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2657,2,'staff','staff','delete',1,'Staff','បុគ្គលិក','Settings','ការកំណត់','/settings/staff','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2658,2,'users','users','view',1,'Users','អ្នកប្រើប្រាស់','Settings','ការកំណត់','/settings/users','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2659,2,'users','users','create',1,'Users','អ្នកប្រើប្រាស់','Settings','ការកំណត់','/settings/users','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2660,2,'users','users','edit',0,'Users','អ្នកប្រើប្រាស់','Settings','ការកំណត់','/settings/users','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2661,2,'users','users','delete',1,'Users','អ្នកប្រើប្រាស់','Settings','ការកំណត់','/settings/users','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2662,2,'roles','roles','view',1,'Role','កំណត់សិទ្ធិ','Settings','ការកំណត់','/settings/role','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2663,2,'roles','roles','create',1,'Role','កំណត់សិទ្ធិ','Settings','ការកំណត់','/settings/role','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2664,2,'roles','roles','edit',0,'Role','កំណត់សិទ្ធិ','Settings','ការកំណត់','/settings/role','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2665,2,'roles','roles','delete',1,'Role','កំណត់សិទ្ធិ','Settings','ការកំណត់','/settings/role','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2666,2,'workshifts','workshifts','view',1,'Working Shifts','វេនធ្វើការ','Settings','ការកំណត់','/settings/workshifts','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2667,2,'workshifts','workshifts','create',1,'Working Shifts','វេនធ្វើការ','Settings','ការកំណត់','/settings/workshifts','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2668,2,'workshifts','workshifts','edit',0,'Working Shifts','វេនធ្វើការ','Settings','ការកំណត់','/settings/workshifts','2026-10-20 09:19:17','2026-10-20 09:19:17'),(2669,2,'workshifts','workshifts','delete',1,'Working Shifts','វេនធ្វើការ','Settings','ការកំណត់','/settings/workshifts','2026-10-20 09:19:17','2026-10-20 09:19:17');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Administrator','Full system access','2026-09-16 10:39:47','2026-09-16 10:39:47'),(2,'Sale','manage sale','2026-09-27 15:03:38','2026-09-27 15:03:38');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spoilages`
--

DROP TABLE IF EXISTS `spoilages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spoilages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `inventory_id` bigint unsigned NOT NULL,
  `category_id` bigint unsigned DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qty` decimal(10,2) NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `spoilages_inventory_id_foreign` (`inventory_id`),
  KEY `spoilages_category_id_foreign` (`category_id`),
  CONSTRAINT `spoilages_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `stock_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `spoilages_inventory_id_foreign` FOREIGN KEY (`inventory_id`) REFERENCES `inventories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spoilages`
--

LOCK TABLES `spoilages` WRITE;
/*!40000 ALTER TABLE `spoilages` DISABLE KEYS */;
INSERT INTO `spoilages` VALUES (1,5,5,'CoCa Cola','កំប៉ុង',4.00,'ធ្លាក់បែក','2026-09-26','2026-09-27 14:18:56','2026-09-27 14:18:56'),(2,5,5,'CoCa Cola','កំប៉ុង',1.00,'Test','2026-09-27','2026-09-27 14:20:37','2026-09-27 14:20:37'),(3,5,5,'CoCa Cola','កំប៉ុង',1.00,'Hello','2026-10-17','2026-10-17 23:47:01','2026-10-17 23:47:01');
/*!40000 ALTER TABLE `spoilages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gender` enum('Male','Female') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Male',
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('Active','Inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `pin_code` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `can_use_pos` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,'ORN Vinseyla','Male','060583613','vinseylaorn@gmail.com','Developer',100.00,'Active','123456','http://localhost:8000/storage/avatars/staff_6aab549c88b892.24346919.jpg','2026-01-01',1,'2026-09-17 09:46:52','2026-09-30 11:43:22'),(2,'Nong','Male','0123456789','nong@gmail.com','Sale',200.00,'Active','111111',NULL,'2026-01-01',1,'2026-09-27 14:59:53','2026-09-27 14:59:53');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_categories`
--

DROP TABLE IF EXISTS `stock_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_categories_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_categories`
--

LOCK TABLES `stock_categories` WRITE;
/*!40000 ALTER TABLE `stock_categories` DISABLE KEYS */;
INSERT INTO `stock_categories` VALUES (1,'Dry Goods','2026-09-16 14:16:16','2026-09-16 15:49:46'),(2,'Vegetables','2026-09-16 14:16:24','2026-09-16 14:16:24'),(3,'Raw Materials','2026-09-16 15:49:19','2026-09-16 15:49:19'),(4,'Fruits','2026-09-16 15:49:36','2026-09-16 15:49:36'),(5,'Beverages','2026-09-16 15:49:52','2026-09-16 15:49:52'),(6,'Coffee & Tea','2026-09-16 15:50:08','2026-09-16 15:50:08'),(7,'Packaging','2026-09-16 15:50:16','2026-09-16 15:50:16'),(8,'Cleaning Supplies','2026-09-16 15:50:57','2026-09-16 15:50:57');
/*!40000 ALTER TABLE `stock_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_histories`
--

DROP TABLE IF EXISTS `stock_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_histories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `inventory_id` bigint unsigned NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('IN','OUT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` decimal(10,3) NOT NULL,
  `unit` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_histories_inventory_id_foreign` (`inventory_id`),
  CONSTRAINT `stock_histories_inventory_id_foreign` FOREIGN KEY (`inventory_id`) REFERENCES `inventories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_histories`
--

LOCK TABLES `stock_histories` WRITE;
/*!40000 ALTER TABLE `stock_histories` DISABLE KEYS */;
INSERT INTO `stock_histories` VALUES (1,1,'Hello','IN',10.000,'គីឡូក្រាម','Initial stock',NULL,'2026-09-16 14:16:46','2026-09-16 14:16:46'),(2,2,'Dishwashing Liquid','IN',10.000,'លីត្រ','Initial stock',NULL,'2026-09-16 15:53:44','2026-09-16 15:53:44'),(3,1,'Floor Cleaner','OUT',2.000,'លីត្រ','Stock reduced',NULL,'2026-09-16 15:54:09','2026-09-16 15:54:09'),(4,3,'Hand Soap','IN',15.000,'គ្រាប់','Initial stock',NULL,'2026-09-16 15:55:00','2026-09-16 15:55:00'),(5,4,'Paper Cup','IN',10.000,'គ្រាប់','Initial stock',NULL,'2026-09-16 15:55:29','2026-09-16 15:55:29'),(6,5,'CoCa Cola','IN',48.000,'កំប៉ុង','Initial stock',NULL,'2026-09-17 09:23:30','2026-09-17 09:23:30'),(7,5,'CoCa Cola','OUT',2.000,'កំប៉ុង','Order #1 - Coca Cola',1,'2026-09-17 10:18:59','2026-09-17 10:18:59'),(8,5,'CoCa Cola','OUT',1.000,'កំប៉ុង','Order #2 - Coca Cola',2,'2026-09-17 10:51:09','2026-09-17 10:51:09'),(9,1,'Floor Cleaner','OUT',7.000,'លីត្រ','Stock reduced',NULL,'2026-09-17 16:16:53','2026-09-17 16:16:53'),(10,2,'Dishwashing Liquid','OUT',2.000,'លីត្រ','Stock reduced',NULL,'2026-09-17 17:03:36','2026-09-17 17:03:36'),(11,2,'Dishwashing Liquid','OUT',6.000,'លីត្រ','Stock reduced',NULL,'2026-09-17 17:04:03','2026-09-17 17:04:03'),(12,4,'Paper Cup','OUT',8.000,'គ្រាប់','Stock reduced',NULL,'2026-09-17 17:10:46','2026-09-17 17:10:46'),(13,4,'Paper Cup','IN',10.000,'គ្រាប់','Stock added',NULL,'2026-09-17 17:17:36','2026-09-17 17:17:36'),(14,4,'Paper Cup','OUT',10.000,'គ្រាប់','Stock reduced',NULL,'2026-09-17 17:17:48','2026-09-17 17:17:48'),(18,5,'CoCa Cola','OUT',4.000,'កំប៉ុង','Spoilage: ធ្លាក់បែក',NULL,'2026-09-27 14:18:56','2026-09-27 14:18:56'),(19,5,'CoCa Cola','OUT',1.000,'កំប៉ុង','Spoilage: Test',NULL,'2026-09-27 14:20:37','2026-09-27 14:20:37'),(20,5,'CoCa Cola','OUT',1.000,'កំប៉ុង','Spoilage: Hello',NULL,'2026-10-17 23:47:01','2026-10-17 23:47:01'),(21,5,'CoCa Cola','OUT',1.000,'កំប៉ុង','Order #35 - Coca Cola',35,'2026-10-19 10:31:03','2026-10-19 10:31:03');
/*!40000 ALTER TABLE `stock_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `category_id` bigint unsigned DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `suppliers_category_id_foreign` (`category_id`),
  CONSTRAINT `suppliers_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `stock_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Coca Cola','Mrr Liina','097 88 44 123','liina@gmail.com','Siem Reap',5,'Active',NULL,'2026-09-17 09:22:43','2026-09-17 09:22:43');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `system_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'My System',
  `system_logo` longtext COLLATE utf8mb4_unicode_ci,
  `exchange_rate` decimal(10,2) NOT NULL DEFAULT '4100.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `exchange_rate_mode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (1,'កន្លែងញ៉ាំ','data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCAEAAQADASIAAhEBAxEB/8QAHQABAAICAwEBAAAAAAAAAAAAAAcIBQYCAwQJAf/EAEoQAAEDAwIDBQUEBgUJCQAAAAEAAgMEBREGBxIhMQgTQVFhFCJxgZEyQlKhFRYjM7HBYnKCktEXJCVkorKzwuEnNFNzg5Sj0vD/xAAbAQEAAgMBAQAAAAAAAAAAAAAABAUBAwYCB//EADgRAAIBAwIDBQUGBQUAAAAAAAABAgMEEQUhEjFRBkFhcYETFCKhwRUyQpGx0RbS4fDxIyQmNLL/2gAMAwEAAhEDEQA/ALUoiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiALUNcbmWfRUJZK4VdeR7lJG73vi4/dC2/qtUvG2GlrzFOJraxs82Sahrj3gcfHJK1VvacP+nzJ+nO0VZO9TcOi+vh5bmoab3/o7pcoqO6Wo0DJXBrZ2Td41pJ5cQIGB681LQIIyDkFU7vtrlsN6rbZK7MlJO6LiAxnB5H59VbLTT3Sadtj354jSxZz/VCiWVedRuM+aOk7V6PaWkaVe0WIz7st9Gms7mSREVgcYEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBYfVWqbfo+0SXO4vPA0hrI2445XHo1o8/5ArMKAu0HSV8F9oKierdNSTROEEWMCIgjiGPXIOf8ABR7mq6VNySLnQdOp397C3qSwnv543wib7HeaXUFppbpRFxp6lnGziGCPAg+oIIXuWsbY0Ulv0HZoJRh/ccfycS4fkQtnW2m24pvmV95ThSuKlOn91NpeSYRFr+u9VQ6Q05U3F7m99w8EDD96Q9Pp1+SzKSinJmuhQnXqRpU1mUnhEAaqo5NV7r3Cio4+J09f3OPD3cNJ5eHukqzVJTMo6WGmjzwQsbG3PkBgKKtjtGPp6aTVdyYTVVufZ+Lq1hPN/wAXfw+KlpRLKk0nUfOR0vam/jUqU7Om8xorhz1eEn+WMfmERFNOVCIuMsscEbpJZGRsaMuc44AHqUCWdkckXlo7pQXAuFHWU9QW/aEUgcR9F6lhNPkepRlF4ksMIiLJ5CIiAIiIAiIgCIiAIiIAiIgCIiAx9/v9v0za5rnc5xDTxD+08+DWjxJXk0rPeLhSyXK7FkLastkp6Nrf+7R45Bzupcep8B4KEd8tSSXLVrbYHcVLbgAWeBeeZz+Slu2bo6QqrfDMb1SwEsGY5ncLmnyIUOFzGVVxbwl8zprnQ61CwpVYQcpVN3hZ4Vtheb5t+nXO3KG9y7bNrncu0acpSXRUkIkqnAfuWk8Tif7PCB6kBZ677xUVRUstelaZ93uUzuBmARE0+ZPiPgto0npx9kp5qmtlbU3WucJayoA+07wa3ya3oAs1HGv8EXt3/sarSNbSH71Wjwzaagnzy9uJruSWefN+pm4YmU8LIYmhkcbQ1rR0AHIBc0RSznm87s/HODWlziAAMknwUGXet/yubl09nikJs1AXOfg8pGtPvH5nA+Ckbde6VVo0LcqikyJXNbFxDOWhxAJHyKr/ALfaxOh7+Lkac1ET4zFIwHB4SQcj15KtvKyU405cubO47L6ZUlbVr2jvUScYeDxu/PfYtZDEyniZFE0MjY0Na0DAAHQLktIs28mkbuxvHX+wyEZLKlvDj0z0PyW0U2oLRWRiSC50cjXdCJW8/wA1OhVhL7rOTuLC6oSxWpyT8Uz3ouptXTvGWzxOHmHgr99oh/8AGj/vBe8kXhfQ8WoL/QaZtM90uUvd08I54GXOJ6NaPEk//sKE9UXTV259krbzbo209ionFvsjZD3kmBkuOB72Mjl9MrI9oi+F/wCi7NFJlmHVUgByCfst+nvfVZrQFytVh2mY6oqoY5KiOZ5j4gXueSWgcPXJwFXVqntajpN4ikdrptp9n2NLUYw4qs5JJNZwt+7q8c+4iPbi7VNo1paH0z3NE1THBI0Hk5r3cJz9cq1yhLaPaqshr4NRXuIwNhPHTUzh7xdjk53ljwU2r3p9OUab4u8j9s723ubyKoPLisNrrnl6BERTzkAiIgCIiAIiIAiIgCLSNxtwXaWpX0drppay6yN90NjLmQ5+87+Q8VCFXq7X9XMZZbpfWuPhE58Tf7rcD8lErXkKb4cZOk0vsxcX1P23EoR7s836dC0yKq0OttdUp5Xi8/8AqOe7/eyvW3czcBow27VpHrTtP/KtP2lDoyyl2Guvw1YfP9izyKr53V13Ecuvc7T/AEoI/wCbVzbvJrppAF64z5eyw/8A0WftKn0Zh9hb7unD83/KbxuVs9db5fp7xZXwSCpw6WGV/C4Oxjkei1y0bB6lrJmfpCakoYc+8ePvHj5Dl+akbbL9eLtGy76luzhSPbmKk9niY5+fvOIaCAvdujrgaPswipnZuddmKmb+HwLz6DI+eF4lQoyi60k0jdS1nVKFSOl0JxnJbZSbx6vC2XPY9+j9v7Loun4aGHjqXDD6mTm93+A+C2VeKyslis1Cyoc50zaeMSFxyS7hGcn4rQ9dbsSWmpfadM0RudxaeGSUML4oT5cvtO9MjH5KY5wowT5I5iFvd6ldSinxy723tjq33IklFW24s3ZvbjLUN1AWvH2IeKJhH9VmB+S1uu07qu2PE1bQXWF5PJ72uzn4qLK/a5QZ0VDsdGe0rqHF0W/1X6Fr66hprlSS0lXCyaCVvC9jxkOCjK+dn+yVrny2usqKB56MP7Rg+R5/moiodwNXWSUdzfbixzBju55DI0f2X5H5KY9pdyb1rGomobnRNkEMfF7bEzhbn8Lh0yfTHTosRuKNw1GcdzZW0XVNEpyuLasuBc8P6PZ/qaZW9nvUMT8Udwt9QzzeXRn6YKxsmxes4Xe5HRvI8WT/AOICsjJIyGN0kj2sY0Zc5xwAFFN87QNtoLm6ltttfX08buF9R3vAD6tGDn54WK1rb095PB703tFrd43ChBTxz2x9UjSG7QbgRgBhwPJtXhfv+SPcP8R/95/1VgLFeabUFopbpRkmCpYHtz1HmD6g8l7l7Wn0mspsiT7ZahCThOEE1z2f7lQ9V2C76cuYobzJx1IjDv3hfgHpzKm3aPbyzU1ioL/PCamuqGcbTNzbFzOOEfLqo730eXa+qG/hgiA/uhTnt8zg0RZB/qjD9RlaLSjFV5LoXHaPUq8tIoVE+F1MZxt3cvI2BERW581CIiAIiIAiIgCIiAIiIBgAk4HNMAovx72xsc97g1rRkknAAQHlrnW+jppKqt9mihjGXySgANHqStEqd5dC0s7oWiWYN+/FTAtPwzhY3VNkv27rw62V0FFp2CQtjMpPFUvBIMnCB0zkDJH5rVLx2f7/AEFO+agraS4cIz3YBjefgDyP1VfWrVm80o7dTstM0vTVFR1Cvio/wp4x5vGM/oSxp/UmjdYHhoBQzT44jDLC0SD5Ec/ks6LFaWnItlCD5iBv+CqJiusteMd/R1kD8+LHscP4Kxe0+4p1nbXUlwcwXWkA7wjl37PB4HgfMdM/HAxbXaqPgmsM96/2cqWNP3m1m5U+/fdePijfgA0AAYA6AKEt16dt53X07aySWOiha4Dw4pX5/IBTaoQp547z2hnO5uZTvcwA+Bjhx/vArbebxjDq0V3ZnMK1a4X4Kcn64wZ7evXNw03TU9ptpMMlaxzn1A6taOWG+vPqtE293d/U2gdb6u2NqoeJzhLGQ2QknPvHx8VOupNKWfVlIKW70bZ2NOWOBLXMPmCOYWg1nZ40/K0+yXS5wPPTvCyRo+XCD+a1V6Nf2ntKbLPSdT0f3H3O8g085bxzfc8rc9VJv7paZo9oiroHHwEYcB88rY7fubpG5vbHBe6Zr3DPDLlmPiSMfmoyuHZ0uUY/0ffaSoPlPC6L+BctPve1OrbEx8s9rfPC3JMtMRIMDxIHMD4heHcXNP78f79CXDRtAu9re4cX4v6SSZJFZspHqa8uvFRqNtXTzv43GGNuXDyBbywpPs1kt+n6GOht1MyCBgxho5n1J8SqnWfUd603Vd7bq+ppJGnm1rjg48C08j8CrGbYa/GubQ91QxkVwpSGztb0d5PA8Af4r1Z1qUpYSxJkftNpmo0aEZVKvHSjtssY6ZS29TTd5r7f7lfYNHWmCcRTxNkf3YOZ8k8s/hGOfzUb650RU6InoYKqVr5KmDvHBvRrgcEK1nA0uDi0cQ8cc1APaBqvbNVW+giaXSxQY4R1Je7kF4vaCUXUk8vuJPZTV5TrUrKlBRgk3J97eObJJ2Ya5u3Nr4s5JlIz5d67C3ZYvStq/QmnLbbuRNPTsjcR4kDmfqsorGlHhhFPocRqNZVrqrVjylJv82Vp3xH/AGg1f/kxf7gU8aCdx6Lsh/1OIf7IUHb7wmPXUjznEtPGR8hj+SmXauc1G39le4knuS36PcP5KBa/9ia/vmdhr6zodpLy/wDP9DakRFZnBhERAEREAREQBERAEREAUdb13+pt1gp7VQPLaq6SiAcJw7h8fryCkVRLqZg1RvNabZmOSntkXfSN8j1IPr9kqNdN8HCub2LvQKcHd+1qLMaacn6Lb54JJ03amWSw0FujGG08DGc+uQOayKIpCWFhFPUqSqTc5c3uRzvBt/FqOzyXWhgAudI0v9xvOZg6tPmR4KDNG6hm0xqSiuUTiBHIBIPxMPJw+ityqrbn6cGmdaV9JFHwU0zhUwDGAGP54A8g7ib8lVX9LgaqxPofY7UPeaVTTbjdYePLk189vUtNBMypgjnjdxRyND2nzBGQoK2ze257x3atHMZqZm/N2P8AmUj7TXl150LQSvJMkAMDiTknhPVRZsbM1u4dYHEcUlPMB6njaf5LdWnxypPqVmmWkrehqFN84x4fm/2LCKON090RpP8A0RbAH3WVoLnke7A09D6u8gpHVXNy61lfuVcXzP4Io6lsLnYJ4Wtw3OPgFsvq0qdP4ebIfZTTaV7eP2yzGKzjq9sFmLY+Rlpo3VUmZRAzvHv5ZdwjJPzXrBDhkEEHxCrnujqjVF5dT1E1DW2uxygOpGnkJWno5xHLiI548B9V1bbbpVmlK2Okuc0tRaZXYfxEudBn7zfTzC1+/wAFPga26kp9kLipau5pyTlu+Fb+mVtnw9Dc99dGURtI1FSQRw1MMgbOWDHetccZPrk9fitf7PUkw1JcGM/cupgX/EO5fzUg7x18Ltt6ueGWOWOcxd29rgQ8OcMEHx5c1r3Z6sUlNa7heJWuaKp7Yo89HNbnJ+pIXidNe9x4fMm217L+HKsa7zh8Kz6PHpuS8SGgknAHMlV4t7jrvenvnAyU8NSXgZ6Mi6Y9OIA/NTdrK5OtGlbrXMID4aaRzc/ixyUK9nylE2qqyqcfehpiB/aP/RbLt8VSFPxyQuztN0LG7vVzUeFevP6Fg1iKPVlmuF6nstNWxy11OMyRtPTzGfMeK0/dLXNfb3t01pxjprvUxOkkfHzdBGAScf0iAT6AeoUNbc3w2XWturZZXBj5e7ld1JDuXP54Wa14oVFBepq0zsxO6s6l1UeHjMV3vxfg8YXU2ztDsDdUW9wH2qIZ/vuUobQ89u7P/Uk/4jlGXaJcDqO2YIP+Z5/23KUtqqd9Nt9ZY3ghxhc7n5Oe4j8itdBf7qf99Cbq0v8Aj1qn1/mNrRFDW+faKt+1To7Taoqe6agfwvkp3uPd00fXMhBzxEdG9fE8sZsjhiZUUFbJ9poboai/Vy52OO21roXTRTQz8UcnDjLeEjIODy5nx6KdUAREQBERAEREAREQH494jY57ujRkqLtpGuv2o9Sarky5tTP3MDi3GWA8j9AAtq3NvJsWhrtVMJErou5jIOCHPIaCPhnPyXl2htgtmgrcOEtfUB07wfMn/ABRp/FWjHpv9C9tl7DTK1bvnJQXkvif0NyRF11Lpm08rqdrXzBhLGuOAXY5AqSUaWXg8dTqC10l1htU9bDHWztLo4nOwXBRR2ibSDFabu1rQQ51M93icjib9MO+qjDWE99/WWqmvjZqe5cfEQcjh8uH08iF7qrW1/1XZKfS9Sz9IyGdpp34Jm4ugb69fFU9a8VSMqcl5H03TOzFSxr0L2jUUkvvdMNbtPvX+STuzxO59hukLnEhlSC0eAy0KOdsrmyz7lUckx4WSTSQO9C8Foz8yFOO2OinaK097NUODqyod3s+DkNdj7I+CgLcO1S6e1zc4Gjux35nhLeXuu95uPhnHxBWK0ZU6dOT5oaVXoX9/fUYP4ai2fls388lqpZGwxPlecNY0uJ8gFWDS2mq7X2uXyGJ8tJ7WZaubo0M4skZ8yOQ+K3vTu+Ftr7M616kjqYJXwmB1VCOIOBGOIjqD9VKOl7ParLZqens8TWUhYHtcOsmfvE+JKlSULpxaey5lDQqXPZ+nWjUpvjntF92FnLT9Vt+Z6LrZqC9W2W211OyWlkbwlhHTyI8iFWLXujKjRd6lopA99I/36ecjk9vl8QrQXK60FnpnVVxrIKSBvWSZ4aPhz8VqtRr7b3UeKCrulvqWuP2amNzWf3nAAfVerujTqLDaTNHZzU7yxk5wpynTfNJPn18yK9Cac1JuBaae0VdQ+PTtJOJO8ePeyM+4w+I5/JT/bbdTWmhgoaOMRwQMDGNHgAudJTU9HTRwUkUcUDGgMZGMNA9F+y1UEEkUcs0bHzO4Y2udgvOM4HnyBW2hQVJbvL6kDV9XqahU+GPDBNtRXXvb6vqzUN43Pbt5dODOT3YPw425ULbUavpdHX2pqK0kU81M5vIdXjm0emeYVjr/Z4b/Zqy11BIjqonRlw6tyOo+Ci7RWxklqvPt1/npauGB2YIY8kPPg52R+XNR7mjUlWjOBd6FqdjS0yvbXb5vOFzeUuXqjL7V6craqa5awvkbhX3YlsTH9Y4Tz6eGeXLwDR5qEdZadqNL6irLfNC6NjZHOhJ6OjJ90g/BW1c6OCMuc5scbBkknAaAsBqrR1m1zb2RVrQ4D3oqiEjib6g+IWa1nxU1GPNfM1aT2odvezrVo/BPCwvwpcseSK+2S3X/dK7W+glkdKyiiEL6pwz3cXET7x8TzwPNWcoKKG20NPRU4Ihp4mxMB68LRgfwWO0vpW2aRtjaC2xcLM8T3u5vkd5krMLba2/slmW7ZX6/rSv6ihRjw0o5wvPm35/Ii/tE7mVm2OgH1tqdG2610wpaZ7wD3WQS6QA9SAOXqR16Kq22+mtD7gad1JNqu/1NFqxjn1NLPUVI4anLSSXcQy48QOef3grS9ofaat3X0hBTWmaGO6W+YzwNmcQyUEYcwnwJ5YPp65Ff9vOyPrG6X2F+sKaKz2mF4dK0TsklnH4WhhIGemSRjPQqUc+Zjsc7c109/qdb1kDoqGnhdT0pe39692OJw9AB19VbxY2yQ2a1UzLHaHUkTKBjY/ZYXtzCPDLRzHzWSQBERAEREAREQBERARVv/PPUWqy2WmjdJNXVhc1reruFuMfWQfRSJpugntdgt9FUlpmgp2Rv4RgZAXrno6aplhlmgjkkgdxxOc0EsPmPJdy0xpYqOo3zLKvqHtLOlaRjhRbbfVv+gREW4rTDam0hZtXUop7tRtm4fsSt92SM+jv5dFitJ7Xae0dWvrqCOeapcOFslQ8OMY8eHAGMrbkWt0oOXE1uTIahcwou3jUag+7OwWm7hba0Ou4opTL7JXwNLY5w3PE3rwu8xn6ZPmtyRZnCM48MuRrtLura1VWoSxJEIae2Drqe9wS3irpJqGJ3G9kWSZceHMdPNS3qC/2/SdnkuFc8RwQgNa1vV58GtHmsoq6bz6sfd9Yi3cbjQ2x4ZwA8nP++fj4fJRKnBaU24LdnS2buu0V5GFzL4YrLxtt4eL5f4M/qHb3We5MrL1WVVJSQvYHU1E97j3TDzHQY4j4qMNTaTuuka4Ud1p+6e4cTHg5a8ehUlU+792v+vrfT2trorW6UQtpsc5Wn7zvX+C23fOyx3HRMldwjvqCRsjXY58LiGkfmD8lEqUadWEqkG8r5nRWep3un3NCzuoxjCfJLnHLwvnz/Uw+zOti3SFxprhLxNtDO9jLjz7og+78AR+founbC/3HX+uq2+XBwEFDBwU9P92LjPUeuGnJ9VEVm1BPZaS6U8LA4XGmNM8n7oJBz+SnHYSxPt2lprhMzhfXS8TMjB4ByHy8Vm2qyqyhDuXP6HjXtPo2FG6uklxVGlHwz97HnuSctf1zri0bf2Ca83eXDG+7DCznJUSH7LGDxJK2AkAEk4A6lUn1tvLS3jfll7vDpKiwacmkFLRt5iV7AQCB0yX4OfIK5x3nzPJr+9d53V1W/wDTWsLXeLZYXyj2WkcxzKWLrw8uhfgn3jz546YC6tkN8LrtVd2U080tTp2okBqaQnPd55GRg8D5jxwuy/8AaW1zqGquDayWimtNbxMfbJoGyQiM/d588gDr1zzXPR2wd73CvNpqLVTyUmnLpEal1W48YpWhxa+PPi4EcgfAj1WAb7vZ2q7nU3H9EbeV4pKCMftbk2MOfO7HMM4gQGjPXGcjkR48tGdqXUbtuam2GmqL5rGN7mUsoh4v2PDnvZA37Rbz+PLPiVle1FtvpjRO0dgZaLbHDJQV7aSOYcnva+N7nF5+8SYwea8PYj09HLV6j1BI0l8TIqSMkcveJc4j190D5rODGSDaXdjXdv1P+sY1NdDdWu998sznNcM82OYfd4f6OMBTvV9ojWu62jRYdDWKpj1KKZ0l0npT+7jBDSYOecuyPVucDPVdfa92ps9moaXW9op4qOWeqFNWRRjDZXOaXNeB0B905+S5dh63Rum1ZcSwd5G2mga7Hg4vcR/sNWDJW1tTe9NXw1Inr7bd6aUkyh7o5o3+Jz1z1V3ezRu9X7p6XrYL1wvu9nfHFPOxvCKhjweB5HQOPA8EDlyzyzgan2ytG2l+jaTVMdLHFc4KxlO6VjQDKx4dycfHHDy+K8fYftE8Nh1VeXEdxV1VPSsHjxRMe535TNQFmkREAREQBERAEREAREQBERAEREARF4rpe7XZI2y3S5UVBG84a6qnbEHHyBcRlAe1Vj3S0zcaHXVwxTTStrZTPC5jCQ4OPQfA8vkplrt7tuLdMYajWFrD29eCQvH1aCFzod4turtI0U+rbO9wPu95KGY+bsKPc26rRSbwXWh6zPS60qsY8SaxjkYTafaoaaYy9Xhodc5G/s4T0pwfP+l/BSFe7TDfbRWWyoOIqqF0RIGS3I5EeoPP5LhbNRWa9Fwtl3t9eW9RTVDJMfHhJWQXunRjCHAlsRL3U7i7uPeqsvi7vDHLHkQHpLY25y3+RmoWNjt9K7OY3A+0+XD6eaninp4qSCOCCNscUbQ1jGjAaB4LsReaNvCksRN2q6zc6lNSrvZckuXn5s8N9c5lkuDmjLhTSEf3SvnxsZqCk07upY665SMbRSzGCodI3iHC8FvP0yQvojUwNqqaWB+eGVhYceRGF89dXbIa0sWs6yw0WnLlWM78ilmhhc+OSMn3Dx44Ry65IW8qjfu1htzZ7Dq3T9Zpagp4HX2KRj6OjZhr5WOZh7WjkOISAcgAeHPUkqzuzekKnQu2tjsVcGisgg4pw3we5xcR8RkD5KPdhdhavShg1PreokuOoGM4KOCaUyst7PTOff8AhyHh5qdUBXXtsXaKDQljtLge+q7l7Qz+rFG5p/4rVtPZU0pW6X2op3XCndTz3KpkrQx7eF4jIa1mQfMNyPRwW2at2vtut9Y2W930tq6GyxvdTUD25Y6dzgS9/mAGtw3pkc1uvTkgK79tO79zoiyWVkTny19w71pbzx3bCMY8c94Pots7MO39y0Btq2K80wprjcql1a+FwxJEwta1jH+uGl2PDix1yshri+7X0GubXcNWX+iZdrYwtpKWZ5eyB7j+8LQCA/pgnopJp54aqCOop5WTQytD45I3BzXtIyCCORBHigK49tfUBptKWSxMkZ/nlU6eRn3sMbhp+GXFSD2adM/qxs5Yo3xtZPXtdcJS373enLCfXu+7HyUV7vaFvO+e9wsVDmC02Onjiqq4t92Li95zR5v8h9VZu2W+G1W6loKcYhpomwsHk1owP4ID0oiIAiIgCIiAIiIAiIgCIiAL8c4NaXOIAHMk+C/VVntO7y3F2pWbb6fq30kZMUdxqYzh7nSYIjB8AGuBOPPHggNy3D3b1pqWuqNM7P2Oe5yxExVV74AIIXjqyN7yGcQ/ET8Byyojn7Ke72rJHXK+3m0+1zHikFwuEssmfUsY8fQq32mrJT6b0/b7PSxsZFR07IQGNwCQME49Tk/NZJAUqd2K9w2gkXfSzvQVM/P/AOFa9c+yputbnvEdip66Ngz3lLWxEH4BzmuP0V9kQHzNu+kNX6PcP0rZbzaS4kNdNBJEHY8jgZWwaZ363I0m5ooNUVssTQG9xWEVEYA8AH54flgr6ISxRzxuiljZJG8Yc1wyHDyIUcau7PG3GsOJ9TYIqGodj9vb/wBg7l6D3fyQEP6O7bOOCDWOmvPNVan/AE/ZSH6nj+SmjTG/u22rQ1tBqmihmdgdxWk08nEfugPxxH+rlQbqnsT10RfLpnUcM7MEiCtj4HZzyaHDI+ZUYXzs07n2J2HadfWtxkvo5GyAfwQF/oqiGcZhljkHmxwK7F8044td6I7wwt1HZGh3vmPvoGkjzIwCtosvaV3Qsro8akfWRxjAiq4mPaficAn6oD6CIqT0PbM19A/NZQ2aqb5NhdH+fEV7qntq6ulj4aew2qF+PtFzn8/hyQFylhNYWq+3qyS0On77HYquX3TWOpPaHMb48LeNoDvXnhVIZ2k969QQ8FstEfDJybLS2yRxHwcSQuVbJvdc6VlTrjWNTpSzlwLp6qZtO8g/gbGA9x9EBHeq9rdSwbpVOi6ed2oLxJMAKiPJ7zi58b854cDmcnlz5q/mjrCdLaSsthdP7Q620MFI6bGO8LGBpdjwzjp4KFdmNxdm9P1X6HtF3qJbzWPxPdbpGRJWSE4x3js8s9B0VgkBwjgiic90cbGOkPE8tGC4+Z81zREAREQBERAEREAREQBERAEREAXzc3Jrp4t2tUVrwe+ivtU/hcc4LZ3YHwGAF9I1VXtBdmi83XUVdq7RtOyrFc8zVdvbye2Uj3ns/FxHmR1ySgJw233g0puHZqGaivVC25yRDv6CSVrJ2SAe9+zJyRnoRkLdZqqnp4zLNPFFG0ZLnuAA+ZXzYrts9a26o9nqtL3aKXOOE07j/BbLpDs77haquVLA+wVduo5XAvrKtvAxjM8zz5k48EBfu23m2XqOSS2XGjrmRu4HuppmyBjvIlpOD6L2LBaI0ZatA6ao9P2eIR01M3m7ADpXn7T3eZJWdQBERAEREB1z00FUzgnhjmb+GRocPzWEue3+kryOG46ctVSPKSmaf5LPogNLbsvtwx3E3RViB8/ZWrN0Oi9NWyMR0dhtkDB0DKdg/ksyiAweqtS2Tb3TNbfrmWUtvoo+NwiYOJ5zhrGjllxJAHqfAc1QzWmuKjevWdVc7/e6SwUwYRRRVLZZIYWjozMbXHJ6l3DzPkMBXe3a27g3Q0PW6clnFNNIWzU05BIilactJHkRlp9HHxVfNAdjq7Q6ljqdYVlE61UsnF3NO4udVAdB/RafHPNAVprKWW3T90/OeT45A1zRI09Ht4gDwnqDhfTnTclTNp21SVhLqp9HC6YnxeWDi/PKpF2n6OAb1zW+jhjZE2npIGRMGGj3AA0Y6K9kTQyNjQMAAADyQHJERAEREAREQBERAEREAREQBERAEREAREQBV1rO0fqmj0qL9+iLLMJYamVsLBIDD3VdDTZeS/mCJSeWMHHhlWKWgaX2WsGlammlhrrpXRUkNXBBTVjoXRRtqXh8v2Y2l2SPvEgAnkgMjo/Ws+ptU6ttLoacU1kqYIIJoiSZQ+IPJcc45E45KKLh2i9TWuwUd7mtVnlhr3XWKGFgka6N1JnhLiXHId4gAKZ9DaLtm3+mKPTloM76SkDuGSctMjy5xcS4tABPPHToAtHquzjpett0VtqLvf5KOA1joITLABC6p/ekERAn04iQEB5bdvBqEa+l0ncKK1SdzdKOgdUU7ZG8TJ6V85IBccEFoH1Xvg3br5deU+mjR0XdyXyotbnAu7wRxwd4H4z1J5eS5N2HtTdS3O9wXett5qqumrKaK3RRReyvhp3Q9XNcHcQeXfZGCtj09ttadO3ll6bVXC4XFtG2idVV8jZZJGhxPG53CCXnOCc9AOSAwG6G5V60dcamktNLb5BR2KpvUrqtr3cfdPa0Rt4XDGeI8zlatDv9faijrnwWagnq4aynpoaaMvL5hJSd9yGck8XujCkPW219r1zVPqqu4XOiklt81rm9jfEBLTyODnNPGx2Dlo5jBXL/ACXWIXKhuTJKyKrobUbRDLG9rXiMtDQ/iDciQAcnAjHkgMDZ9ba0rLPLWV0em6Sq/QrLp7C/vW1VNJxe9HLCXcXBgEceR7wxjksOzdnV9TU6SoKekshrNRWuW4tJp6hzIy0N4YyGOJA945ceQW32zam3UFymudVe77dayW0foTv6+eN7203Hx9WxtLn5OeJ3ESump2etUjrHJSXu+22eyW59spp6SaJshheACSXRn3vdHNuMIDUrbvHqya9No6y3WXhZqpmmpoYO84wDGXuma4uxgYPLHNTSo1Ox9tp2UgorzceOLUsGpZ5a0tnfPLG3hLMjhwHDHM5Oc9VJSAoZuZO+6dpmaOU8WL7T04BH3RIwAK+Y6BVh0Zs3JrnffUOubi1zbFb7s6akPNvtc7HAjH9Frhk+ZGPNWeQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQH41jWDDWhoJzyC/URAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQH//Z',4000.00,'2026-09-17 09:24:47','2026-10-19 00:02:05','auto'),(2,'My System',NULL,4100.00,'2026-09-17 09:24:47','2026-09-17 09:24:47','manual');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `table_transfers`
--

DROP TABLE IF EXISTS `table_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `table_transfers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `from_table_id` bigint unsigned NOT NULL,
  `to_table_id` bigint unsigned NOT NULL,
  `staff_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `table_transfers_order_id_index` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `table_transfers`
--

LOCK TABLES `table_transfers` WRITE;
/*!40000 ALTER TABLE `table_transfers` DISABLE KEYS */;
INSERT INTO `table_transfers` VALUES (1,'merge',37,9,10,1,'2026-10-19 14:28:28','2026-10-19 14:28:28'),(2,'transfer',37,10,15,1,'2026-10-19 14:28:40','2026-10-19 14:28:40'),(3,'merge',37,9,15,1,'2026-10-19 16:07:49','2026-10-19 16:07:49'),(4,'merge',39,15,9,1,'2026-10-19 16:11:38','2026-10-19 16:11:38'),(5,'merge',40,9,10,1,'2026-10-19 16:14:38','2026-10-19 16:14:38'),(6,'merge',40,9,10,1,'2026-10-19 16:21:03','2026-10-19 16:21:03'),(7,'merge',40,15,9,1,'2026-10-19 16:21:24','2026-10-19 16:21:24'),(8,'merge',43,9,7,1,'2026-10-19 16:22:34','2026-10-19 16:22:34'),(9,'transfer',43,7,15,1,'2026-10-19 16:29:53','2026-10-19 16:29:53');
/*!40000 ALTER TABLE `table_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `role_id` bigint unsigned DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_role_id_foreign` (`role_id`),
  CONSTRAINT `users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'supperadmin','vinseylaorn@gmail.com',NULL,'$2y$12$k5wUdkd/ukqlTOtgCwvxRO.e2FhsD9nJGY5yBt3c36PS5Z1lXQxAS',NULL,'2026-09-16 10:39:47','2026-10-16 15:01:27',1,'Active','avatars/user_6aab54c5789159.92411466.jpg'),(2,'Sobin','sobin@123gmail.com',NULL,'$2y$12$mp7jqhQ0K5y4lD7LV8x56.6EjR6z/ldhkqLhDPbakWHIRewktEXPK',NULL,'2026-09-27 15:04:27','2026-09-27 15:05:08',2,'Active',NULL),(3,'seyla','seylaofficial2505@gmail.com',NULL,'$2y$12$FHa9RsIVcnKVSAWRdyo4v./HaEFaeAYlVJhQ6yPltBSmqrkjh4.PK',NULL,'2026-10-16 14:53:12','2026-10-19 16:37:26',2,'Active','avatars/user_6ad1d7ff2cc461.56095674.jpg');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vip_cards`
--

DROP TABLE IF EXISTS `vip_cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vip_cards` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tier_id` bigint unsigned NOT NULL,
  `total_visits` int unsigned NOT NULL DEFAULT '0',
  `used_this_month` tinyint unsigned NOT NULL DEFAULT '0',
  `monthly_limit` tinyint unsigned NOT NULL DEFAULT '0',
  `issued_at` date NOT NULL,
  `expires_at` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `note` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vip_cards_code_unique` (`code`),
  KEY `vip_cards_tier_id_foreign` (`tier_id`),
  CONSTRAINT `vip_cards_tier_id_foreign` FOREIGN KEY (`tier_id`) REFERENCES `vip_tiers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vip_cards`
--

LOCK TABLES `vip_cards` WRITE;
/*!40000 ALTER TABLE `vip_cards` DISABLE KEYS */;
INSERT INTO `vip_cards` VALUES (1,'000-000-001',1,3,3,0,'2026-09-17','2027-09-17',1,'','2026-09-17 10:06:21','2026-09-17 14:55:26'),(2,'000-000-002',2,1,1,0,'2026-09-27',NULL,1,'','2026-09-27 14:34:18','2026-09-27 15:15:03');
/*!40000 ALTER TABLE `vip_cards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vip_tiers`
--

DROP TABLE IF EXISTS `vip_tiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vip_tiers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_kh` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount` tinyint unsigned NOT NULL,
  `min_visits` int unsigned NOT NULL DEFAULT '0',
  `max_visits` int unsigned DEFAULT NULL,
  `upgrade_at` int unsigned DEFAULT NULL,
  `monthly_limit` tinyint unsigned NOT NULL DEFAULT '0',
  `color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#F0B429',
  `bg_from` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#1C1A0E',
  `bg_to` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#2A2410',
  `accent_color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#F0B429',
  `icon` enum('star','gem','crown') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'star',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vip_tiers`
--

LOCK TABLES `vip_tiers` WRITE;
/*!40000 ALTER TABLE `vip_tiers` DISABLE KEYS */;
INSERT INTO `vip_tiers` VALUES (1,'Gole','មាស',10,1,10,10,0,'#F0B429','#1C1A0E','#2A2410','#F0B429','star',1,'2026-09-17 10:05:41','2026-09-17 10:05:41'),(2,'Test','តេស្ត',10,1,2,2,0,'#1857D8','#0E0F1C','#14152A','#1857D8','crown',1,'2026-09-27 14:33:21','2026-09-27 14:33:21');
/*!40000 ALTER TABLE `vip_tiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vip_upgrade_logs`
--

DROP TABLE IF EXISTS `vip_upgrade_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vip_upgrade_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `card_id` bigint unsigned NOT NULL,
  `card_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_card_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_tier_id` bigint unsigned NOT NULL,
  `from_tier_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `to_tier_id` bigint unsigned NOT NULL,
  `to_tier_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_visits_at_upgrade` int unsigned NOT NULL,
  `upgraded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vip_upgrade_logs_card_id_foreign` (`card_id`),
  KEY `vip_upgrade_logs_from_tier_id_foreign` (`from_tier_id`),
  KEY `vip_upgrade_logs_to_tier_id_foreign` (`to_tier_id`),
  CONSTRAINT `vip_upgrade_logs_card_id_foreign` FOREIGN KEY (`card_id`) REFERENCES `vip_cards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vip_upgrade_logs_from_tier_id_foreign` FOREIGN KEY (`from_tier_id`) REFERENCES `vip_tiers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `vip_upgrade_logs_to_tier_id_foreign` FOREIGN KEY (`to_tier_id`) REFERENCES `vip_tiers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vip_upgrade_logs`
--

LOCK TABLES `vip_upgrade_logs` WRITE;
/*!40000 ALTER TABLE `vip_upgrade_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `vip_upgrade_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `working_shifts`
--

DROP TABLE IF EXISTS `working_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `working_shifts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `staff_id` bigint unsigned NOT NULL,
  `date` date NOT NULL,
  `shift_type` enum('Morning','Afternoon','Night','Full Day') COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `status` enum('Present','Absent','Late','Leave') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Present',
  `shift_status` enum('Open','Closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Closed',
  `open_time` timestamp NULL DEFAULT NULL,
  `open_amount_usd` decimal(12,2) NOT NULL DEFAULT '0.00',
  `open_amount_khr` decimal(14,0) NOT NULL DEFAULT '0',
  `close_time` timestamp NULL DEFAULT NULL,
  `close_amount_usd` decimal(12,2) NOT NULL DEFAULT '0.00',
  `close_amount_khr` decimal(14,0) NOT NULL DEFAULT '0',
  `expected_cash_usd` decimal(10,2) NOT NULL DEFAULT '0.00',
  `cash_difference_usd` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_orders` int unsigned NOT NULL DEFAULT '0',
  `total_revenue_usd` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_revenue_khr` decimal(14,0) NOT NULL DEFAULT '0',
  `overtime_hours` decimal(4,1) NOT NULL DEFAULT '0.0',
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `working_shifts_staff_id_foreign` (`staff_id`),
  CONSTRAINT `working_shifts_staff_id_foreign` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `working_shifts`
--

LOCK TABLES `working_shifts` WRITE;
/*!40000 ALTER TABLE `working_shifts` DISABLE KEYS */;
INSERT INTO `working_shifts` VALUES (1,1,'2026-09-17','Morning','10:17:00','11:42:00','Present','Closed','2026-09-17 10:17:43',45.00,60000,'2026-09-17 11:42:13',60.00,70000,0.00,0.00,2,40.30,165230,0.0,'Bank 20','2026-09-17 10:17:43','2026-09-17 11:42:13'),(2,1,'2026-09-17','Morning','11:47:00','14:52:00','Present','Closed','2026-09-17 11:47:06',50.00,50000,'2026-09-17 14:52:29',50.00,70000,0.00,0.00,3,32.40,132840,0.0,NULL,'2026-09-17 11:47:06','2026-09-17 14:52:29'),(3,1,'2026-09-17','Afternoon','14:54:00','15:15:00','Present','Closed','2026-09-17 14:54:04',40.00,80000,'2026-09-17 15:15:52',50.00,100000,0.00,0.00,4,71.27,292207,0.0,NULL,'2026-09-17 14:54:04','2026-09-17 15:15:52'),(4,1,'2026-09-17','Afternoon','16:31:00','17:03:00','Present','Closed','2026-09-17 16:31:42',67.00,98000,'2026-09-17 17:03:08',60.00,40000,0.00,0.00,3,55.50,227550,0.0,NULL,'2026-09-17 16:31:42','2026-09-17 17:03:08'),(5,1,'2026-09-17','Afternoon','17:19:00','09:07:00','Present','Closed','2026-09-17 17:19:38',67.00,89000,'2026-09-18 09:07:06',67.00,89000,0.00,0.00,2,30.50,125050,7.8,NULL,'2026-09-17 17:19:38','2026-09-18 09:07:06'),(6,1,'2026-09-18','Morning','10:08:00','15:15:00','Present','Closed','2026-09-18 10:08:42',60.00,60000,'2026-09-18 15:15:50',120.50,40000,0.00,0.00,4,91.00,364000,0.0,NULL,'2026-09-18 10:08:42','2026-09-18 15:15:50'),(7,2,'2026-09-27','Afternoon','15:07:00','15:24:00','Present','Closed','2026-09-27 15:07:56',60.00,80000,'2026-09-27 15:24:46',65.00,60000,0.00,0.00,2,24.10,96400,0.0,NULL,'2026-09-27 15:07:56','2026-09-27 15:24:46'),(8,1,'2026-09-30','Morning','11:43:00','11:44:00','Present','Closed','2026-09-30 11:43:44',40.00,60000,'2026-09-30 11:44:32',40.00,60000,0.00,0.00,0,0.00,0,0.0,NULL,'2026-09-30 11:43:44','2026-09-30 11:44:32'),(9,1,'2026-10-15','Morning','10:24:00','10:28:00','Present','Closed','2026-10-15 10:24:51',50.00,400000,'2026-10-15 10:28:38',61.20,400000,0.00,0.00,2,19.40,77600,0.0,NULL,'2026-10-15 10:24:51','2026-10-15 10:28:38'),(10,1,'2026-10-15','Morning','10:28:00','10:29:00','Present','Closed','2026-10-15 10:28:58',50.00,40000,'2026-10-15 10:29:33',10.00,400,0.00,0.00,0,0.00,0,0.0,NULL,'2026-10-15 10:28:58','2026-10-15 10:29:33'),(13,1,'2026-10-19','Morning','09:24:00','09:27:00','Present','Closed','2026-10-19 09:24:21',50.00,200000,'2026-10-19 09:27:19',61.00,200000,0.00,0.00,1,11.00,44737,0.0,NULL,'2026-10-19 09:24:21','2026-10-19 09:27:19'),(14,1,'2026-10-19','Morning','09:30:00','09:52:00','Present','Closed','2026-10-19 09:30:46',60.00,80000,'2026-10-19 09:52:34',75.00,80000,0.00,0.00,2,15.00,61005,0.0,NULL,'2026-10-19 09:30:46','2026-10-19 09:52:34'),(15,1,'2026-10-19','Morning','10:08:00','10:09:00','Present','Closed','2026-10-19 10:08:03',60.00,85000,'2026-10-19 10:09:02',60.00,85000,0.00,0.00,1,8.00,32536,0.0,NULL,'2026-10-19 10:08:03','2026-10-19 10:09:02'),(16,1,'2026-10-19','Morning','10:12:00','10:13:00','Present','Closed','2026-10-19 10:12:12',55.00,50000,'2026-10-19 10:13:20',97.00,50000,0.00,0.00,1,42.00,170814,0.0,NULL,'2026-10-19 10:12:12','2026-10-19 10:13:20'),(17,1,'2026-10-19','Morning','10:16:00','10:30:00','Present','Closed','2026-10-19 10:16:38',40.00,60000,'2026-10-19 10:30:05',51.00,60000,65.75,0.00,1,11.00,44737,0.0,NULL,'2026-10-19 10:16:38','2026-10-19 10:30:05'),(18,1,'2026-10-19','Morning','10:30:00','10:31:00','Present','Closed','2026-10-19 10:30:51',70.00,60000,'2026-10-19 10:31:39',70.00,60000,102.75,-18.00,1,18.00,73206,0.0,NULL,'2026-10-19 10:30:51','2026-10-19 10:31:39'),(19,1,'2026-10-19','Morning','10:48:00','16:30:00','Present','Closed','2026-10-19 10:48:34',60.00,50000,'2026-10-19 16:30:39',76.00,50000,88.29,0.00,2,74.00,300958,0.0,NULL,'2026-10-19 10:48:34','2026-10-19 16:30:39');
/*!40000 ALTER TABLE `working_shifts` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-20  2:30:10
