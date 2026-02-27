-- ITAM Database Backup
-- Generated: 2026-02-27T06:48:43.661Z
-- Database: itamdb

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `AlertRules`;
CREATE TABLE `AlertRules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `eventType` varchar(255) NOT NULL DEFAULT 'Any',
  `severity` varchar(255) NOT NULL DEFAULT 'High',
  `module` varchar(255) NOT NULL DEFAULT 'All',
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `AnalyticsEvents`;
CREATE TABLE `AnalyticsEvents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `eventType` varchar(255) NOT NULL,
  `page` varchar(255) DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `entity` varchar(255) DEFAULT NULL,
  `metadata` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `AssetCategories`;
CREATE TABLE `AssetCategories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `name_4` (`name`),
  UNIQUE KEY `name_5` (`name`),
  UNIQUE KEY `name_6` (`name`),
  UNIQUE KEY `name_7` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `AssetCategories` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES (1, 'Laptop', '', '2026-02-03 06:56:48', '2026-02-03 06:56:48');
INSERT INTO `AssetCategories` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES (2, 'Desktop', '', '2026-02-03 06:56:55', '2026-02-03 06:56:55');
INSERT INTO `AssetCategories` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES (3, 'Printer', '', '2026-02-03 06:57:03', '2026-02-03 06:57:03');
INSERT INTO `AssetCategories` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES (4, 'Access Points', '', '2026-02-03 06:57:12', '2026-02-03 06:57:12');
INSERT INTO `AssetCategories` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES (5, 'Switch', '', '2026-02-03 06:57:29', '2026-02-03 06:57:29');
INSERT INTO `AssetCategories` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES (6, 'Mouse', '', '2026-02-09 04:42:12', '2026-02-09 04:42:12');
INSERT INTO `AssetCategories` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES (7, 'Test', '', '2026-02-13 07:03:43', '2026-02-13 07:03:43');

DROP TABLE IF EXISTS `AssetDisposals`;
CREATE TABLE `AssetDisposals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assetId` varchar(255) NOT NULL,
  `assetName` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `serialNumber` varchar(255) DEFAULT NULL,
  `entity` varchar(255) DEFAULT NULL,
  `purchasePrice` varchar(255) DEFAULT NULL,
  `disposalReason` varchar(255) NOT NULL DEFAULT 'End of Life',
  `disposalMethod` varchar(255) NOT NULL DEFAULT 'Scrap',
  `disposalDate` date DEFAULT NULL,
  `saleValue` varchar(255) DEFAULT NULL,
  `authorizedBy` varchar(255) DEFAULT NULL,
  `performedBy` varchar(255) DEFAULT NULL,
  `notes` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `AssetIdPrefixes`;
CREATE TABLE `AssetIdPrefixes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entityCode` varchar(255) NOT NULL,
  `categoryName` varchar(255) NOT NULL,
  `shortCode` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_id_prefixes_entity_code_category_name` (`entityCode`,`categoryName`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `AssetIdPrefixes` (`id`, `entityCode`, `categoryName`, `shortCode`, `createdAt`, `updatedAt`) VALUES (1, 'OFB', 'Laptop', 'ITL', '2026-02-20 05:32:55', '2026-02-20 05:32:55');
INSERT INTO `AssetIdPrefixes` (`id`, `entityCode`, `categoryName`, `shortCode`, `createdAt`, `updatedAt`) VALUES (2, 'OFB', 'Desktop', 'ITD', '2026-02-20 05:33:12', '2026-02-20 05:33:12');
INSERT INTO `AssetIdPrefixes` (`id`, `entityCode`, `categoryName`, `shortCode`, `createdAt`, `updatedAt`) VALUES (3, 'OFB', 'Printer', 'ITPR', '2026-02-20 05:33:27', '2026-02-20 05:33:27');
INSERT INTO `AssetIdPrefixes` (`id`, `entityCode`, `categoryName`, `shortCode`, `createdAt`, `updatedAt`) VALUES (4, 'OFB', 'Access Points', 'ITAP', '2026-02-20 05:34:03', '2026-02-20 05:34:03');
INSERT INTO `AssetIdPrefixes` (`id`, `entityCode`, `categoryName`, `shortCode`, `createdAt`, `updatedAt`) VALUES (5, 'OFB', 'Switch', 'ITSW', '2026-02-20 05:34:17', '2026-02-20 05:34:17');
INSERT INTO `AssetIdPrefixes` (`id`, `entityCode`, `categoryName`, `shortCode`, `createdAt`, `updatedAt`) VALUES (6, 'OFB', 'Mouse', 'ITM', '2026-02-20 05:34:28', '2026-02-20 05:34:28');
INSERT INTO `AssetIdPrefixes` (`id`, `entityCode`, `categoryName`, `shortCode`, `createdAt`, `updatedAt`) VALUES (7, 'OXYZO', 'Laptop', 'ITL', '2026-02-20 05:34:56', '2026-02-20 05:34:56');
INSERT INTO `AssetIdPrefixes` (`id`, `entityCode`, `categoryName`, `shortCode`, `createdAt`, `updatedAt`) VALUES (8, 'OXYZO', 'Desktop', 'ITD', '2026-02-20 05:35:06', '2026-02-20 05:35:06');
INSERT INTO `AssetIdPrefixes` (`id`, `entityCode`, `categoryName`, `shortCode`, `createdAt`, `updatedAt`) VALUES (9, 'OXYZO', 'Access Points', 'ITAP', '2026-02-20 05:35:55', '2026-02-20 05:35:55');
INSERT INTO `AssetIdPrefixes` (`id`, `entityCode`, `categoryName`, `shortCode`, `createdAt`, `updatedAt`) VALUES (10, 'OXYZO', 'Printer', 'ITPR', '2026-02-20 05:36:14', '2026-02-20 05:36:14');
INSERT INTO `AssetIdPrefixes` (`id`, `entityCode`, `categoryName`, `shortCode`, `createdAt`, `updatedAt`) VALUES (11, 'OXYZO', 'Switch', 'ITSW', '2026-02-20 05:40:53', '2026-02-20 05:40:53');

DROP TABLE IF EXISTS `Assets`;
CREATE TABLE `Assets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assetId` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `entity` varchar(255) NOT NULL,
  `status` enum('In Use','Available','Under Repair','Retired','Theft/Missing','Not Submitted') NOT NULL DEFAULT 'Available',
  `employeeId` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `makeModel` varchar(255) DEFAULT NULL,
  `serialNumber` varchar(255) DEFAULT NULL,
  `cpu` varchar(255) DEFAULT NULL,
  `ram` varchar(255) DEFAULT NULL,
  `storage` varchar(255) DEFAULT NULL,
  `os` varchar(255) DEFAULT NULL,
  `condition` varchar(255) DEFAULT NULL,
  `comments` text,
  `additionalItems` varchar(255) DEFAULT NULL,
  `insuranceStatus` varchar(255) DEFAULT NULL,
  `dateOfPurchase` date DEFAULT NULL,
  `warrantyExpireDate` date DEFAULT NULL,
  `price` varchar(255) DEFAULT NULL,
  `invoiceNumber` varchar(255) DEFAULT NULL,
  `vendorName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assetId` (`assetId`),
  UNIQUE KEY `assetId_2` (`assetId`),
  UNIQUE KEY `assetId_3` (`assetId`),
  UNIQUE KEY `assetId_4` (`assetId`),
  UNIQUE KEY `assetId_5` (`assetId`),
  UNIQUE KEY `assetId_6` (`assetId`),
  UNIQUE KEY `assetId_7` (`assetId`),
  UNIQUE KEY `assetId_8` (`assetId`),
  UNIQUE KEY `assetId_9` (`assetId`),
  UNIQUE KEY `assetId_10` (`assetId`),
  UNIQUE KEY `assetId_11` (`assetId`),
  UNIQUE KEY `assetId_12` (`assetId`),
  UNIQUE KEY `assetId_13` (`assetId`),
  UNIQUE KEY `assetId_14` (`assetId`),
  UNIQUE KEY `assetId_15` (`assetId`),
  UNIQUE KEY `assetId_16` (`assetId`),
  UNIQUE KEY `assetId_17` (`assetId`),
  UNIQUE KEY `assetId_18` (`assetId`),
  UNIQUE KEY `assetId_19` (`assetId`),
  UNIQUE KEY `assetId_20` (`assetId`),
  UNIQUE KEY `assetId_21` (`assetId`),
  UNIQUE KEY `assetId_22` (`assetId`),
  UNIQUE KEY `assetId_23` (`assetId`),
  UNIQUE KEY `assetId_24` (`assetId`),
  UNIQUE KEY `assetId_25` (`assetId`),
  UNIQUE KEY `assetId_26` (`assetId`),
  UNIQUE KEY `assetId_27` (`assetId`),
  UNIQUE KEY `assetId_28` (`assetId`),
  UNIQUE KEY `assetId_29` (`assetId`),
  UNIQUE KEY `assetId_30` (`assetId`),
  UNIQUE KEY `assetId_31` (`assetId`),
  UNIQUE KEY `assetId_32` (`assetId`),
  UNIQUE KEY `assetId_33` (`assetId`),
  UNIQUE KEY `assetId_34` (`assetId`),
  UNIQUE KEY `assetId_35` (`assetId`),
  UNIQUE KEY `assetId_36` (`assetId`),
  UNIQUE KEY `assetId_37` (`assetId`),
  UNIQUE KEY `assetId_38` (`assetId`),
  UNIQUE KEY `assetId_39` (`assetId`),
  UNIQUE KEY `assetId_40` (`assetId`),
  UNIQUE KEY `assetId_41` (`assetId`),
  UNIQUE KEY `assetId_42` (`assetId`),
  UNIQUE KEY `assetId_43` (`assetId`),
  UNIQUE KEY `assetId_44` (`assetId`),
  UNIQUE KEY `assetId_45` (`assetId`),
  UNIQUE KEY `assetId_46` (`assetId`),
  UNIQUE KEY `assetId_47` (`assetId`),
  UNIQUE KEY `assetId_48` (`assetId`),
  UNIQUE KEY `assetId_49` (`assetId`),
  UNIQUE KEY `assetId_50` (`assetId`),
  UNIQUE KEY `assetId_51` (`assetId`),
  UNIQUE KEY `assetId_52` (`assetId`),
  UNIQUE KEY `assetId_53` (`assetId`),
  UNIQUE KEY `assetId_54` (`assetId`),
  UNIQUE KEY `assetId_55` (`assetId`),
  UNIQUE KEY `assetId_56` (`assetId`),
  UNIQUE KEY `assetId_57` (`assetId`),
  UNIQUE KEY `assetId_58` (`assetId`),
  UNIQUE KEY `assetId_59` (`assetId`),
  UNIQUE KEY `assetId_60` (`assetId`),
  UNIQUE KEY `assetId_61` (`assetId`),
  UNIQUE KEY `assetId_62` (`assetId`),
  UNIQUE KEY `assetId_63` (`assetId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `AssetTransfers`;
CREATE TABLE `AssetTransfers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sourceAssetId` varchar(255) NOT NULL,
  `assetName` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `serialNumber` varchar(255) DEFAULT NULL,
  `makeModel` varchar(255) DEFAULT NULL,
  `fromEntity` varchar(255) NOT NULL,
  `toEntity` varchar(255) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `notes` text,
  `authorizedBy` varchar(255) DEFAULT NULL,
  `transferDate` date DEFAULT NULL,
  `targetAssetId` varchar(255) DEFAULT NULL,
  `status` enum('Completed','Pending','Cancelled') DEFAULT 'Completed',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `AssetTransfers` (`id`, `sourceAssetId`, `assetName`, `category`, `serialNumber`, `makeModel`, `fromEntity`, `toEntity`, `reason`, `notes`, `authorizedBy`, `transferDate`, `targetAssetId`, `status`, `createdAt`, `updatedAt`) VALUES (1, 'AST-2944', 'OXYZOL-1226', 'Laptop', 'NA', 'Lenovo', 'OXYZO', 'OFB', 'Employee Transfer', '', 'Manish Kumar Bhaskar', '2026-02-20', 'AST-2944', 'Completed', '2026-02-20 04:56:53', '2026-02-20 04:56:53');
INSERT INTO `AssetTransfers` (`id`, `sourceAssetId`, `assetName`, `category`, `serialNumber`, `makeModel`, `fromEntity`, `toEntity`, `reason`, `notes`, `authorizedBy`, `transferDate`, `targetAssetId`, `status`, `createdAt`, `updatedAt`) VALUES (2, 'AST-4812', 'Dell 3420', 'Laptop', '1234ZAQ1', 'Dell 3420', 'OFB', 'OXYZO', 'Employee Transfer', '', 'Manish Kumar Bhaskar', '2026-02-20', 'OXYZO/ITL/001', 'Completed', '2026-02-20 05:41:33', '2026-02-20 05:41:33');
INSERT INTO `AssetTransfers` (`id`, `sourceAssetId`, `assetName`, `category`, `serialNumber`, `makeModel`, `fromEntity`, `toEntity`, `reason`, `notes`, `authorizedBy`, `transferDate`, `targetAssetId`, `status`, `createdAt`, `updatedAt`) VALUES (3, 'AST-5844', 'OFB/ITL/009', 'Laptop', 'xyz', 'Thinkpad E14', 'OFB', 'OXYZO', 'Employee Transfer', '', 'Manish Kumar Bhaskar', '2026-02-20', 'OXYZO/ITL/002', 'Completed', '2026-02-20 05:42:12', '2026-02-20 05:42:12');

DROP TABLE IF EXISTS `AuditLogs`;
CREATE TABLE `AuditLogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timestamp` datetime DEFAULT NULL,
  `user` varchar(255) NOT NULL DEFAULT 'System',
  `action` varchar(255) NOT NULL,
  `ip` varchar(255) DEFAULT '127.0.0.1',
  `details` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=174 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (1, '2026-02-03 11:38:07', 'manish', 'Login failed', '::ffff:172.18.0.1', 'User not found', '2026-02-03 11:38:07', '2026-02-03 11:38:07');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (2, '2026-02-03 11:38:15', 'manish@ofbusiness.in', 'Login failed', '::ffff:172.18.0.1', 'Invalid credentials', '2026-02-03 11:38:15', '2026-02-03 11:38:15');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (3, '2026-02-03 11:38:19', 'manish@ofbusiness.in', 'Login failed', '::ffff:172.18.0.1', 'Invalid credentials', '2026-02-03 11:38:19', '2026-02-03 11:38:19');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (4, '2026-02-03 11:38:25', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-03 11:38:25', '2026-02-03 11:38:25');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (5, '2026-02-03 12:51:04', 'itsupport@ofbusiness.in', 'Login successful', '::ffff:192.168.101.59', 'Role: admin', '2026-02-03 12:51:04', '2026-02-03 12:51:04');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (6, '2026-02-03 12:51:20', 'itsupport@ofbusiness.in', 'Login successful', '::ffff:192.168.101.59', 'Role: admin', '2026-02-03 12:51:20', '2026-02-03 12:51:20');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (7, '2026-02-04 07:12:17', 'itsupport@ofbusiness.in', 'Login successful', '::ffff:192.168.103.36', 'Role: admin', '2026-02-04 07:12:17', '2026-02-04 07:12:17');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (8, '2026-02-04 13:31:06', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-04 13:31:06', '2026-02-04 13:31:06');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (9, '2026-02-06 07:06:46', 'manish@ofbusiness.in', 'Login successful', '::ffff:192.168.100.165', 'Role: admin', '2026-02-06 07:06:46', '2026-02-06 07:06:46');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (10, '2026-02-06 07:11:53', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-06 07:11:53', '2026-02-06 07:11:53');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (11, '2026-02-06 09:08:17', 'itsupport@ofbusiness.in', 'Login successful', '::ffff:192.168.103.36', 'Role: admin', '2026-02-06 09:08:17', '2026-02-06 09:08:17');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (12, '2026-02-07 11:00:05', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-07 11:00:05', '2026-02-07 11:00:05');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (13, '2026-02-07 11:21:06', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-07 11:21:06', '2026-02-07 11:21:06');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (14, '2026-02-07 11:26:26', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-07 11:26:26', '2026-02-07 11:26:26');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (15, '2026-02-07 11:58:53', 'itsupport@ofbusiness.in', 'Login successful', '::ffff:192.168.103.36', 'Role: admin', '2026-02-07 11:58:53', '2026-02-07 11:58:53');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (16, '2026-02-09 03:51:57', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-09 03:51:57', '2026-02-09 03:51:57');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (17, '2026-02-09 03:56:26', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-09 03:56:26', '2026-02-09 03:56:26');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (18, '2026-02-09 04:32:04', 'itsupport@ofbusiness.in', 'Login successful', '::ffff:192.168.103.36', 'Role: admin', '2026-02-09 04:32:04', '2026-02-09 04:32:04');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (19, '2026-02-09 04:39:09', 'itsupport@ofbusiness.in', 'Login successful', '::ffff:192.168.103.36', 'Role: admin', '2026-02-09 04:39:09', '2026-02-09 04:39:09');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (20, '2026-02-09 06:19:08', 'manish@ofbusiness.in', 'Login failed', '::ffff:172.18.0.1', 'Invalid credentials', '2026-02-09 06:19:08', '2026-02-09 06:19:08');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (21, '2026-02-09 06:19:15', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-09 06:19:15', '2026-02-09 06:19:15');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (22, '2026-02-09 09:03:18', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-09 09:03:18', '2026-02-09 09:03:18');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (23, '2026-02-09 09:03:33', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-09 09:03:33', '2026-02-09 09:03:33');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (24, '2026-02-09 09:03:58', 'manish@ofbusiness.in', 'Login failed', '::ffff:172.18.0.1', 'Invalid credentials', '2026-02-09 09:03:58', '2026-02-09 09:03:58');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (25, '2026-02-09 09:04:05', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-09 09:04:05', '2026-02-09 09:04:05');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (26, '2026-02-09 09:30:47', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-09 09:30:47', '2026-02-09 09:30:47');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (27, '2026-02-09 09:50:08', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-09 09:50:08', '2026-02-09 09:50:08');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (28, '2026-02-10 04:26:29', 'itsupport@ofbusiness.in', 'Login successful', '::ffff:192.168.103.36', 'Role: admin', '2026-02-10 04:26:29', '2026-02-10 04:26:29');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (29, '2026-02-10 11:43:44', 'manish@ofbusiness.in', 'Login failed', '::ffff:192.168.102.244', 'Invalid credentials', '2026-02-10 11:43:44', '2026-02-10 11:43:44');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (30, '2026-02-10 11:43:53', 'manish@ofbusiness.in', 'Login successful', '::ffff:192.168.102.244', 'Role: admin', '2026-02-10 11:43:53', '2026-02-10 11:43:53');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (31, '2026-02-10 12:56:10', 'itsupport@ofbusiness.in', 'Login successful', '::ffff:10.10.31.135', 'Role: admin', '2026-02-10 12:56:10', '2026-02-10 12:56:10');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (32, '2026-02-10 12:57:39', 'itsupport@ofbusiness.in', 'Asset updated', '::ffff:192.168.102.19', 'Asset ID: AST-2944, Status: In Use', '2026-02-10 12:57:39', '2026-02-10 12:57:39');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (33, '2026-02-10 13:31:57', 'shashi@oxyzo.in', 'Login successful', '::ffff:192.168.102.19', 'Role: custom_1', '2026-02-10 13:31:57', '2026-02-10 13:31:57');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (34, '2026-02-10 13:33:04', 'shashi@oxyzo.in', 'Login successful', '::ffff:192.168.102.19', 'Role: custom_1', '2026-02-10 13:33:04', '2026-02-10 13:33:04');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (35, '2026-02-11 07:31:09', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-11 07:31:09', '2026-02-11 07:31:09');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (36, '2026-02-11 07:33:14', 'shashi@ofbusiness.in', 'Login failed', '::ffff:172.18.0.1', 'User not found', '2026-02-11 07:33:14', '2026-02-11 07:33:14');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (37, '2026-02-11 07:33:25', 'manish@ofbusiness.in', 'Login failed', '::ffff:172.18.0.1', 'Invalid credentials', '2026-02-11 07:33:25', '2026-02-11 07:33:25');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (38, '2026-02-11 07:33:32', 'manish@ofbusiness.in', 'Login failed', '::ffff:172.18.0.1', 'Invalid credentials', '2026-02-11 07:33:32', '2026-02-11 07:33:32');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (39, '2026-02-11 07:33:38', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-11 07:33:38', '2026-02-11 07:33:38');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (40, '2026-02-11 07:33:58', 'shashi@oxyzo.in', 'Login successful', '::ffff:172.18.0.1', 'Role: custom_1', '2026-02-11 07:33:58', '2026-02-11 07:33:58');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (41, '2026-02-11 07:35:21', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-11 07:35:21', '2026-02-11 07:35:21');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (42, '2026-02-11 09:27:30', 'itsupport@ofbusiness.in', 'Login failed', '::ffff:10.10.31.135', 'Invalid credentials', '2026-02-11 09:27:30', '2026-02-11 09:27:30');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (43, '2026-02-11 09:27:45', 'itsupport@ofbusiness.in', 'Login successful', '::ffff:10.10.31.135', 'Role: admin', '2026-02-11 09:27:45', '2026-02-11 09:27:45');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (44, '2026-02-12 12:24:13', 'shashi@oxyzo.in', 'Login failed', '::ffff:172.18.0.1', 'Invalid credentials', '2026-02-12 12:24:13', '2026-02-12 12:24:13');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (45, '2026-02-12 12:24:23', 'shashi@oxyzo.in', 'Login failed', '::ffff:172.18.0.1', 'Invalid credentials', '2026-02-12 12:24:23', '2026-02-12 12:24:23');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (46, '2026-02-12 12:24:30', 'shashi@oxyzo.in', 'Login failed', '::ffff:172.18.0.1', 'Invalid credentials', '2026-02-12 12:24:30', '2026-02-12 12:24:30');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (47, '2026-02-12 12:24:47', 'manish@ofbusiness.in', 'Login failed', '::ffff:172.18.0.1', 'Invalid credentials', '2026-02-12 12:24:47', '2026-02-12 12:24:47');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (48, '2026-02-12 12:24:52', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-12 12:24:52', '2026-02-12 12:24:52');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (49, '2026-02-12 12:26:09', 'shashi@oxyzo.in', 'Login successful', '::ffff:172.18.0.1', 'Role: custom_1', '2026-02-12 12:26:09', '2026-02-12 12:26:09');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (50, '2026-02-12 12:26:41', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-12 12:26:41', '2026-02-12 12:26:41');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (51, '2026-02-13 04:35:31', 'itsupport@ofbusiness.in', 'Login successful', '::ffff:10.10.31.135', 'Role: admin', '2026-02-13 04:35:31', '2026-02-13 04:35:31');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (52, '2026-02-13 04:47:24', 'shashi@oxyzo.in', 'Login successful', '::ffff:172.18.0.1', 'Role: custom_1', '2026-02-13 04:47:24', '2026-02-13 04:47:24');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (53, '2026-02-13 04:48:09', 'manish@ofbusiness.in', 'Login successful', '::ffff:172.18.0.1', 'Role: admin', '2026-02-13 04:48:09', '2026-02-13 04:48:09');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (54, '2026-02-13 05:00:31', 'itsupport@ofbusiness.in', 'Asset created', '::ffff:10.10.31.135', 'Asset ID: AST-9807', '2026-02-13 05:00:31', '2026-02-13 05:00:31');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (55, '2026-02-13 05:02:25', 'itsupport@ofbusiness.in', 'Asset updated', '::ffff:10.10.31.135', 'Asset ID: AST-9807, Status: Available', '2026-02-13 05:02:25', '2026-02-13 05:02:25');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (56, '2026-02-13 06:20:45', 'itsupport@ofbusiness.in', 'Login successful', '::ffff:10.10.31.135', 'Role: admin', '2026-02-13 06:20:45', '2026-02-13 06:20:45');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (57, '2026-02-13 07:00:10', 'itsupport@ofbusiness.in', 'Software license assigned', '::ffff:10.10.31.135', 'License: Office 365, Employee: OXYZO1001', '2026-02-13 07:00:10', '2026-02-13 07:00:10');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (58, '2026-02-13 08:57:42', 'itsupport@ofbusiness.in', 'Login successful', '::ffff:10.10.31.135', 'Role: admin', '2026-02-13 08:57:42', '2026-02-13 08:57:42');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (59, '2026-02-17 07:26:35', 'manish@ofbusiness.in', 'Login successful', '::1', 'Role: admin', '2026-02-17 07:26:35', '2026-02-17 07:26:35');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (60, '2026-02-17 08:31:48', 'itsupport@ofbusiness.in', 'Login failed', '10.10.31.135', 'Invalid credentials', '2026-02-17 08:31:48', '2026-02-17 08:31:48');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (61, '2026-02-17 08:32:02', 'itsupport@ofbusiness.in', 'Login successful', '10.10.31.135', 'Role: admin', '2026-02-17 08:32:02', '2026-02-17 08:32:02');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (62, '2026-02-17 08:39:47', 'manish@ofbusiness.in', 'Login successful', '::1', 'Role: admin', '2026-02-17 08:39:47', '2026-02-17 08:39:47');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (63, '2026-02-17 09:11:44', 'itsupport@ofbusiness.in', 'Login successful', '10.10.31.135', 'Role: admin', '2026-02-17 09:11:44', '2026-02-17 09:11:44');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (64, '2026-02-17 09:29:38', 'manish@ofbusiness.in', 'Login successful', '::1', 'Role: admin', '2026-02-17 09:29:38', '2026-02-17 09:29:38');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (65, '2026-02-17 09:29:44', 'admin@ofbusiness.in', 'Login failed', '::1', 'User not found', '2026-02-17 09:29:44', '2026-02-17 09:29:44');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (66, '2026-02-17 09:29:49', 'manish@ofbusiness.in', 'Login failed', '::1', 'Invalid credentials', '2026-02-17 09:29:49', '2026-02-17 09:29:49');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (67, '2026-02-17 09:30:12', 'manish@ofbusiness.in', 'Login failed', '::1', 'Invalid credentials', '2026-02-17 09:30:12', '2026-02-17 09:30:12');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (68, '2026-02-17 09:30:15', 'manish@ofbusiness.in', 'Login failed', '::1', 'Invalid credentials', '2026-02-17 09:30:15', '2026-02-17 09:30:15');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (69, '2026-02-17 09:30:20', 'manish@ofbusiness.in', 'Login failed', '::1', 'Invalid credentials', '2026-02-17 09:30:20', '2026-02-17 09:30:20');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (70, '2026-02-17 09:32:21', 'manish@ofbusiness.in', 'Login failed', '::1', 'Invalid credentials', '2026-02-17 09:32:21', '2026-02-17 09:32:21');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (71, '2026-02-17 10:14:03', 'manish@ofbusiness.in', 'Login failed', '::1', 'Invalid credentials', '2026-02-17 10:14:03', '2026-02-17 10:14:03');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (72, '2026-02-17 11:11:27', 'itsupport@ofbusiness.in', 'Login successful', '10.10.31.135', 'Role: admin', '2026-02-17 11:11:27', '2026-02-17 11:11:27');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (73, '2026-02-17 11:56:56', 'itsupport@ofbusiness.in', 'Login successful', '10.10.31.135', 'Role: admin', '2026-02-17 11:56:56', '2026-02-17 11:56:56');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (74, '2026-02-17 12:18:02', 'itsupport@ofbusiness.in', 'Asset updated', '10.10.31.135', 'Asset ID: AST-2944, Status: Available', '2026-02-17 12:18:02', '2026-02-17 12:18:02');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (75, '2026-02-17 12:18:51', 'itsupport@ofbusiness.in', 'Asset updated', '10.10.31.135', 'Asset ID: AST-9807, Status: In Use', '2026-02-17 12:18:51', '2026-02-17 12:18:51');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (76, '2026-02-17 12:18:57', 'itsupport@ofbusiness.in', 'Asset updated', '10.10.31.135', 'Asset ID: AST-9807, Status: Available', '2026-02-17 12:18:57', '2026-02-17 12:18:57');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (77, '2026-02-17 12:28:07', 'itsupport@ofbusiness.in', 'Asset created', '10.10.31.135', 'Asset ID: AST-6614', '2026-02-17 12:28:07', '2026-02-17 12:28:07');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (78, '2026-02-17 12:28:34', 'itsupport@ofbusiness.in', 'Asset updated', '10.10.31.135', 'Asset ID: AST-6614, Status: In Use', '2026-02-17 12:28:34', '2026-02-17 12:28:34');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (79, '2026-02-17 12:37:28', 'cherabandaraju.peruri@ofbusiness.in', 'Login failed', '192.168.103.36', 'User not found', '2026-02-17 12:37:28', '2026-02-17 12:37:28');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (80, '2026-02-17 12:38:29', 'itsupport@ofbusiness.in', 'Login successful', '192.168.103.36', 'Role: admin', '2026-02-17 12:38:29', '2026-02-17 12:38:29');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (81, '2026-02-17 13:05:29', 'itsupport@ofbusiness.in', 'Login successful', '192.168.11.87', 'Role: admin', '2026-02-17 13:05:29', '2026-02-17 13:05:29');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (82, '2026-02-17 13:07:21', 'itsupport@ofbusiness.in', 'Asset created', '192.168.11.87', 'Asset ID: AST-8335', '2026-02-17 13:07:21', '2026-02-17 13:07:21');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (83, '2026-02-17 13:11:23', 'itsupport@ofbusiness.in', 'Asset updated', '192.168.11.87', 'Asset ID: AST-8335, Status: In Use', '2026-02-17 13:11:23', '2026-02-17 13:11:23');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (84, '2026-02-17 13:11:58', 'itsupport@ofbusiness.in', 'Asset updated', '192.168.11.87', 'Asset ID: AST-8335, Status: Under Repair', '2026-02-17 13:11:58', '2026-02-17 13:11:58');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (85, '2026-02-17 13:13:58', 'itsupport@ofbusiness.in', 'Asset updated', '192.168.11.87', 'Asset ID: 1, Status: Unknown', '2026-02-17 13:13:58', '2026-02-17 13:13:58');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (86, '2026-02-17 13:14:18', 'itsupport@ofbusiness.in', 'Asset updated', '192.168.11.87', 'Asset ID: 1, Status: Unknown', '2026-02-17 13:14:18', '2026-02-17 13:14:18');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (87, '2026-02-18 04:16:37', 'itsupport@ofbusiness.in', 'Login successful', '10.10.31.135', 'Role: admin', '2026-02-18 04:16:37', '2026-02-18 04:16:37');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (88, '2026-02-18 04:17:25', 'itsupport@ofbusiness.in', 'Asset updated', '10.10.31.135', 'Asset ID: 5, Status: Unknown', '2026-02-18 04:17:25', '2026-02-18 04:17:25');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (89, '2026-02-18 04:17:32', 'itsupport@ofbusiness.in', 'Asset updated', '10.10.31.135', 'Asset ID: 5, Status: Unknown', '2026-02-18 04:17:32', '2026-02-18 04:17:32');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (90, '2026-02-18 04:17:45', 'itsupport@ofbusiness.in', 'Asset updated', '10.10.31.135', 'Asset ID: 1, Status: Unknown', '2026-02-18 04:17:45', '2026-02-18 04:17:45');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (91, '2026-02-18 04:18:56', 'itsupport@ofbusiness.in', 'Asset updated', '10.10.31.135', 'Asset ID: 5, Status: Unknown', '2026-02-18 04:18:56', '2026-02-18 04:18:56');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (92, '2026-02-18 04:18:58', 'itsupport@ofbusiness.in', 'Asset updated', '10.10.31.135', 'Asset ID: 1, Status: Unknown', '2026-02-18 04:18:58', '2026-02-18 04:18:58');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (93, '2026-02-18 04:19:25', 'itsupport@ofbusiness.in', 'Asset updated', '10.10.31.135', 'Asset ID: 5, Status: Unknown', '2026-02-18 04:19:25', '2026-02-18 04:19:25');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (94, '2026-02-18 09:38:12', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-7313, Status: In Use', '2026-02-18 09:38:12', '2026-02-18 09:38:12');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (95, '2026-02-18 10:13:03', 'itsupport@ofbusiness.in', 'Login successful', '192.168.103.36', 'Role: admin', '2026-02-18 10:13:03', '2026-02-18 10:13:03');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (96, '2026-02-18 13:19:55', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-2944, Status: In Use', '2026-02-18 13:19:55', '2026-02-18 13:19:55');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (97, '2026-02-18 13:21:24', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-8929, Status: In Use', '2026-02-18 13:21:24', '2026-02-18 13:21:24');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (98, '2026-02-18 13:21:43', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: 2, Status: Unknown', '2026-02-18 13:21:43', '2026-02-18 13:21:43');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (99, '2026-02-18 13:22:02', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: 2, Status: Unknown', '2026-02-18 13:22:02', '2026-02-18 13:22:02');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (100, '2026-02-18 13:32:17', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: 5, Status: Unknown', '2026-02-18 13:32:17', '2026-02-18 13:32:17');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (101, '2026-02-18 13:32:37', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-7313, Status: Available', '2026-02-18 13:32:37', '2026-02-18 13:32:37');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (102, '2026-02-18 13:32:41', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-6614, Status: Available', '2026-02-18 13:32:41', '2026-02-18 13:32:41');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (103, '2026-02-18 13:32:44', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-2944, Status: Available', '2026-02-18 13:32:44', '2026-02-18 13:32:44');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (104, '2026-02-18 13:32:57', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-4812, Status: Available', '2026-02-18 13:32:57', '2026-02-18 13:32:57');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (105, '2026-02-18 13:33:01', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-8929, Status: Available', '2026-02-18 13:33:01', '2026-02-18 13:33:01');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (106, '2026-02-18 13:33:42', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-4812, Status: In Use', '2026-02-18 13:33:42', '2026-02-18 13:33:42');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (107, '2026-02-18 13:39:20', 'manish@ofbusiness.in', 'Login failed', '::1', 'Invalid credentials', '2026-02-18 13:39:20', '2026-02-18 13:39:20');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (108, '2026-02-18 13:39:26', 'manish@ofbusiness.in', 'Login successful', '::1', 'Role: admin', '2026-02-18 13:39:26', '2026-02-18 13:39:26');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (109, '2026-02-19 10:06:50', 'manish@ofbusiness.in', 'Login successful', '192.168.103.214', 'Role: admin', '2026-02-19 10:06:50', '2026-02-19 10:06:50');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (110, '2026-02-19 10:09:49', 'manish@ofbusiness.in', 'Asset updated', '192.168.103.214', 'Asset ID: AST-5844, Status: In Use', '2026-02-19 10:09:49', '2026-02-19 10:09:49');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (111, '2026-02-19 11:29:26', 'itsupport@ofbusiness.in', 'Login successful', '192.168.103.36', 'Role: admin', '2026-02-19 11:29:26', '2026-02-19 11:29:26');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (112, '2026-02-19 11:43:28', 'itsupport@ofbusiness.in', 'Asset updated', '192.168.103.36', 'Asset ID: AST-8929, Status: In Use', '2026-02-19 11:43:28', '2026-02-19 11:43:28');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (113, '2026-02-19 11:58:09', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-9807, Status: In Use', '2026-02-19 11:58:09', '2026-02-19 11:58:09');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (114, '2026-02-19 12:03:40', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-7313, Status: In Use', '2026-02-19 12:03:40', '2026-02-19 12:03:40');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (115, '2026-02-19 13:27:25', 'manish@ofbusiness.in', 'Login failed', '::1', 'Invalid credentials', '2026-02-19 13:27:25', '2026-02-19 13:27:25');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (116, '2026-02-19 13:27:31', 'manish@ofbusiness.in', 'Login successful', '::1', 'Role: admin', '2026-02-19 13:27:31', '2026-02-19 13:27:31');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (117, '2026-02-20 04:54:20', 'manish@ofbusiness.in', 'Login failed', '::1', 'Invalid credentials', '2026-02-20 04:54:20', '2026-02-20 04:54:20');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (118, '2026-02-20 04:54:27', 'manish@ofbusiness.in', 'Login failed', '::1', 'Invalid credentials', '2026-02-20 04:54:27', '2026-02-20 04:54:27');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (119, '2026-02-20 04:54:34', 'manish@ofbusiness.in', 'Login failed', '::1', 'Invalid credentials', '2026-02-20 04:54:34', '2026-02-20 04:54:34');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (120, '2026-02-20 04:56:53', 'manish@ofbusiness.in', 'ASSET_TRANSFER', '::1', 'Asset AST-2944 (OXYZOL-1226) transferred from OXYZO to OFB. Reason: Employee Transfer', '2026-02-20 04:56:53', '2026-02-20 04:56:53');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (121, '2026-02-20 05:10:25', 'itsupport@ofbusiness.in', 'Login successful', '192.168.103.36', 'Role: admin', '2026-02-20 05:10:25', '2026-02-20 05:10:25');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (122, '2026-02-20 05:41:33', 'manish@ofbusiness.in', 'ASSET_TRANSFER', '::1', 'Asset AST-4812 (Dell 3420) transferred from OFB to OXYZO. Reason: Employee Transfer', '2026-02-20 05:41:33', '2026-02-20 05:41:33');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (123, '2026-02-20 05:42:12', 'manish@ofbusiness.in', 'ASSET_TRANSFER', '::1', 'Asset AST-5844 (OFB/ITL/009) transferred from OFB to OXYZO. Reason: Employee Transfer', '2026-02-20 05:42:12', '2026-02-20 05:42:12');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (124, '2026-02-20 05:44:25', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-2944, Status: In Use', '2026-02-20 05:44:25', '2026-02-20 05:44:25');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (125, '2026-02-20 08:45:20', 'manish@ofbusiness.in', 'Login failed', '::1', 'Invalid credentials', '2026-02-20 08:45:20', '2026-02-20 08:45:20');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (126, '2026-02-20 08:45:24', 'manish@ofbusiness.in', 'Login successful', '::1', 'Role: admin', '2026-02-20 08:45:24', '2026-02-20 08:45:24');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (127, '2026-02-20 08:46:16', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-2944, Status: Available', '2026-02-20 08:46:16', '2026-02-20 08:46:16');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (128, '2026-02-20 08:47:37', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-2944, Status: In Use', '2026-02-20 08:47:37', '2026-02-20 08:47:37');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (129, '2026-02-20 08:55:47', 'itsupport@ofbusiness.in', 'Login successful', '10.10.31.135', 'Role: admin', '2026-02-20 08:55:47', '2026-02-20 08:55:47');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (130, '2026-02-20 12:08:55', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: OXYZO/ITL/001, Status: In Use', '2026-02-20 12:08:55', '2026-02-20 12:08:55');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (131, '2026-02-20 12:24:03', 'itsupport@ofbusiness.in', 'Asset updated', '192.168.103.36', 'Asset ID: AST-8929, Status: Available', '2026-02-20 12:24:03', '2026-02-20 12:24:03');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (132, '2026-02-20 12:25:05', 'itsupport@ofbusiness.in', 'Asset updated', '192.168.103.36', 'Asset ID: AST-8929, Status: In Use', '2026-02-20 12:25:05', '2026-02-20 12:25:05');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (133, '2026-02-21 04:38:34', 'itsupport@ofbusiness.in', 'Login successful', '192.168.103.36', 'Role: admin', '2026-02-21 04:38:34', '2026-02-21 04:38:34');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (134, '2026-02-21 04:38:58', 'itsupport@ofbusiness.in', 'Asset updated', '192.168.103.36', 'Asset ID: AST-8929, Status: Available', '2026-02-21 04:38:58', '2026-02-21 04:38:58');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (135, '2026-02-21 04:40:17', 'itsupport@ofbusiness.in', 'Asset updated', '192.168.103.36', 'Asset ID: AST-8929, Status: In Use', '2026-02-21 04:40:17', '2026-02-21 04:40:17');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (136, '2026-02-21 04:40:19', 'itsupport@ofbusiness.in', 'Asset updated', '192.168.103.36', 'Asset ID: AST-8929, Status: In Use', '2026-02-21 04:40:19', '2026-02-21 04:40:19');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (137, '2026-02-21 05:14:54', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-6614, Status: In Use', '2026-02-21 05:14:54', '2026-02-21 05:14:54');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (138, '2026-02-21 05:16:24', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-2944, Status: Available', '2026-02-21 05:16:24', '2026-02-21 05:16:24');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (139, '2026-02-21 05:16:29', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-6614, Status: Available', '2026-02-21 05:16:29', '2026-02-21 05:16:29');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (140, '2026-02-21 05:16:36', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-7313, Status: Available', '2026-02-21 05:16:36', '2026-02-21 05:16:36');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (141, '2026-02-21 05:16:39', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-8929, Status: Available', '2026-02-21 05:16:39', '2026-02-21 05:16:39');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (142, '2026-02-21 05:16:43', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-9807, Status: Available', '2026-02-21 05:16:43', '2026-02-21 05:16:43');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (143, '2026-02-21 05:16:47', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: OXYZO/ITL/001, Status: Available', '2026-02-21 05:16:47', '2026-02-21 05:16:47');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (144, '2026-02-21 05:21:42', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-7313, Status: In Use', '2026-02-21 05:21:42', '2026-02-21 05:21:42');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (145, '2026-02-21 06:01:10', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-7313, Status: Available', '2026-02-21 06:01:10', '2026-02-21 06:01:10');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (146, '2026-02-21 07:11:59', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-2944, Status: In Use', '2026-02-21 07:11:59', '2026-02-21 07:11:59');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (147, '2026-02-21 07:45:40', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-2944, Status: Available', '2026-02-21 07:45:40', '2026-02-21 07:45:40');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (148, '2026-02-21 08:14:53', 'itsupport@ofbusiness.in', 'Login successful', '10.10.31.135', 'Role: admin', '2026-02-21 08:14:53', '2026-02-21 08:14:53');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (149, '2026-02-21 09:28:45', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-2944, Status: In Use', '2026-02-21 09:28:45', '2026-02-21 09:28:45');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (150, '2026-02-21 09:30:02', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-2944, Status: Available', '2026-02-21 09:30:02', '2026-02-21 09:30:02');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (151, '2026-02-21 10:55:21', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-7592, Status: Available', '2026-02-21 10:55:21', '2026-02-21 10:55:21');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (152, '2026-02-21 10:55:26', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-8335, Status: Available', '2026-02-21 10:55:26', '2026-02-21 10:55:26');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (153, '2026-02-21 11:12:10', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-6614, Status: Available', '2026-02-21 11:12:10', '2026-02-21 11:12:10');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (154, '2026-02-21 11:12:43', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-9807, Status: Available', '2026-02-21 11:12:43', '2026-02-21 11:12:43');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (155, '2026-02-21 11:13:25', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-2944, Status: Available', '2026-02-21 11:13:25', '2026-02-21 11:13:25');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (156, '2026-02-21 11:16:01', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-7313, Status: Available', '2026-02-21 11:16:01', '2026-02-21 11:16:01');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (157, '2026-02-21 11:57:18', 'admin@admin.com', 'Login failed', '127.0.0.1', 'User not found', '2026-02-21 11:57:18', '2026-02-21 11:57:18');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (158, '2026-02-21 11:57:30', 'manish@ofbusiness.in', 'Login failed', '127.0.0.1', 'Invalid credentials', '2026-02-21 11:57:30', '2026-02-21 11:57:30');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (159, '2026-02-22 08:32:28', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-2944, Status: In Use', '2026-02-22 08:32:28', '2026-02-22 08:32:28');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (160, '2026-02-22 08:48:12', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-2944, Status: Available', '2026-02-22 08:48:12', '2026-02-22 08:48:12');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (161, '2026-02-22 08:54:49', 'manish@ofbusiness.in', 'Asset updated', '::1', 'Asset ID: AST-6614, Status: In Use', '2026-02-22 08:54:49', '2026-02-22 08:54:49');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (162, '2026-02-24 10:19:25', 'manish@ofbusiness.in', 'Login successful', '::1', 'Role: admin', '2026-02-24 10:19:25', '2026-02-24 10:19:25');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (163, '2026-02-25 11:16:25', 'manish@ofbusiness.in', 'Login failed', '::1', 'Invalid credentials', '2026-02-25 11:16:25', '2026-02-25 11:16:25');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (164, '2026-02-25 11:16:30', 'manish@ofbusiness.in', 'Login successful', '::1', 'Role: admin', '2026-02-25 11:16:30', '2026-02-25 11:16:30');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (165, '2026-02-25 11:38:27', 'itsupport@ofbusiness.in', 'Login successful', '192.168.103.36', 'Role: admin', '2026-02-25 11:38:27', '2026-02-25 11:38:27');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (166, '2026-02-25 11:40:49', 'itsupport@ofbusiness.in', 'Asset updated', '192.168.103.36', 'Asset ID: AST-8929, Status: In Use', '2026-02-25 11:40:49', '2026-02-25 11:40:49');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (167, '2026-02-25 11:40:52', 'itsupport@ofbusiness.in', 'Asset updated', '192.168.103.36', 'Asset ID: AST-8929, Status: In Use', '2026-02-25 11:40:52', '2026-02-25 11:40:52');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (168, '2026-02-25 12:08:13', 'manish@ofbusiness.in', 'Login successful', '::1', 'Role: admin', '2026-02-25 12:08:13', '2026-02-25 12:08:13');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (169, '2026-02-25 12:13:02', 'shashi@oxyzo.in', 'Login blocked', '::1', 'Email domain not permitted', '2026-02-25 12:13:02', '2026-02-25 12:13:02');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (170, '2026-02-25 12:14:58', 'manish@ofbusiness.in', 'Login successful', '::1', 'Role: admin', '2026-02-25 12:14:58', '2026-02-25 12:14:58');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (171, '2026-02-26 05:08:02', 'itsupport@ofbusiness.in', 'Login successful', '192.168.103.36', 'Role: admin', '2026-02-26 05:08:02', '2026-02-26 05:08:02');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (172, '2026-02-26 12:38:02', 'manish@ofbusiness.in', 'Login successful', '::1', 'Role: admin', '2026-02-26 12:38:02', '2026-02-26 12:38:02');
INSERT INTO `AuditLogs` (`id`, `timestamp`, `user`, `action`, `ip`, `details`, `createdAt`, `updatedAt`) VALUES (173, '2026-02-27 06:44:39', 'itsupport@ofbusiness.in', 'Login successful', '192.168.103.36', 'Role: admin', '2026-02-27 06:44:39', '2026-02-27 06:44:39');

DROP TABLE IF EXISTS `Departments`;
CREATE TABLE `Departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `head` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `employees` int DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `Departments` (`id`, `name`, `head`, `location`, `employees`, `createdAt`, `updatedAt`) VALUES (1, 'Technology', 'Bhuvan Gupta', 'GBP', 0, '2026-01-19 11:53:08', '2026-01-19 11:53:08');
INSERT INTO `Departments` (`id`, `name`, `head`, `location`, `employees`, `createdAt`, `updatedAt`) VALUES (2, 'Finance', 'Bhubneshwar Jha', 'GBP', 0, '2026-01-30 07:11:16', '2026-01-30 07:11:16');
INSERT INTO `Departments` (`id`, `name`, `head`, `location`, `employees`, `createdAt`, `updatedAt`) VALUES (3, 'HR', NULL, 'GBP', 0, '2026-02-10 12:58:19', '2026-02-10 12:58:19');
INSERT INTO `Departments` (`id`, `name`, `head`, `location`, `employees`, `createdAt`, `updatedAt`) VALUES (5, 'Test', NULL, 'Hyderabad', 0, '2026-02-13 06:59:11', '2026-02-13 06:59:11');

DROP TABLE IF EXISTS `EmailSettings`;
CREATE TABLE `EmailSettings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `smtpUser` varchar(255) NOT NULL,
  `smtpPass` varchar(255) NOT NULL,
  `fromName` varchar(255) DEFAULT NULL,
  `fromEmail` varchar(255) DEFAULT NULL,
  `host` varchar(255) DEFAULT '',
  `port` int DEFAULT '587',
  `secure` tinyint(1) DEFAULT '0',
  `notifyEmail` varchar(255) DEFAULT NULL,
  `returnToName` varchar(255) DEFAULT NULL,
  `returnToEmail` varchar(255) DEFAULT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `provider` varchar(255) NOT NULL DEFAULT 'custom',
  `backendUrl` varchar(2048) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `EmailSettings` (`id`, `smtpUser`, `smtpPass`, `fromName`, `fromEmail`, `host`, `port`, `secure`, `notifyEmail`, `returnToName`, `returnToEmail`, `enabled`, `createdAt`, `updatedAt`, `provider`, `backendUrl`) VALUES (1, 'itsupport@ofbusiness.in', 'zegi nezj omnd vdzs', 'IT Support', 'itsupport@ofbusiness.in', 'smtp.gmail.com', 587, 0, 'it-team@ofbusiness.in', 'IT Team', 'it-team@ofbusiness.in', 1, '2026-02-19 12:07:00', '2026-02-20 08:45:47', 'custom', NULL);

DROP TABLE IF EXISTS `Employees`;
CREATE TABLE `Employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `entity` varchar(255) NOT NULL,
  `status` varchar(255) DEFAULT 'Active',
  `assetsCount` int DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `employeeId` varchar(255) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `joiningDate` date DEFAULT NULL,
  `type` varchar(255) DEFAULT 'Permanent',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `email_25` (`email`),
  UNIQUE KEY `email_26` (`email`),
  UNIQUE KEY `email_27` (`email`),
  UNIQUE KEY `email_28` (`email`),
  UNIQUE KEY `email_29` (`email`),
  UNIQUE KEY `email_30` (`email`),
  UNIQUE KEY `email_31` (`email`),
  UNIQUE KEY `email_32` (`email`),
  UNIQUE KEY `email_33` (`email`),
  UNIQUE KEY `email_34` (`email`),
  UNIQUE KEY `email_35` (`email`),
  UNIQUE KEY `email_36` (`email`),
  UNIQUE KEY `email_37` (`email`),
  UNIQUE KEY `email_38` (`email`),
  UNIQUE KEY `email_39` (`email`),
  UNIQUE KEY `email_40` (`email`),
  UNIQUE KEY `email_41` (`email`),
  UNIQUE KEY `email_42` (`email`),
  UNIQUE KEY `email_43` (`email`),
  UNIQUE KEY `email_44` (`email`),
  UNIQUE KEY `email_45` (`email`),
  UNIQUE KEY `email_46` (`email`),
  UNIQUE KEY `email_47` (`email`),
  UNIQUE KEY `email_48` (`email`),
  UNIQUE KEY `email_49` (`email`),
  UNIQUE KEY `email_50` (`email`),
  UNIQUE KEY `email_51` (`email`),
  UNIQUE KEY `email_52` (`email`),
  UNIQUE KEY `email_53` (`email`),
  UNIQUE KEY `email_54` (`email`),
  UNIQUE KEY `email_55` (`email`),
  UNIQUE KEY `email_56` (`email`),
  UNIQUE KEY `email_57` (`email`),
  UNIQUE KEY `email_58` (`email`),
  UNIQUE KEY `email_59` (`email`),
  UNIQUE KEY `email_60` (`email`),
  UNIQUE KEY `email_61` (`email`),
  UNIQUE KEY `email_62` (`email`),
  UNIQUE KEY `email_63` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Entities`;
CREATE TABLE `Entities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `taxId` varchar(255) DEFAULT NULL,
  `address` text,
  `contactPerson` varchar(255) DEFAULT NULL,
  `contactEmail` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `logo` mediumtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `code_2` (`code`),
  UNIQUE KEY `code_3` (`code`),
  UNIQUE KEY `code_4` (`code`),
  UNIQUE KEY `code_5` (`code`),
  UNIQUE KEY `code_6` (`code`),
  UNIQUE KEY `code_7` (`code`),
  UNIQUE KEY `code_8` (`code`),
  UNIQUE KEY `code_9` (`code`),
  UNIQUE KEY `code_10` (`code`),
  UNIQUE KEY `code_11` (`code`),
  UNIQUE KEY `code_12` (`code`),
  UNIQUE KEY `code_13` (`code`),
  UNIQUE KEY `code_14` (`code`),
  UNIQUE KEY `code_15` (`code`),
  UNIQUE KEY `code_16` (`code`),
  UNIQUE KEY `code_17` (`code`),
  UNIQUE KEY `code_18` (`code`),
  UNIQUE KEY `code_19` (`code`),
  UNIQUE KEY `code_20` (`code`),
  UNIQUE KEY `code_21` (`code`),
  UNIQUE KEY `code_22` (`code`),
  UNIQUE KEY `code_23` (`code`),
  UNIQUE KEY `code_24` (`code`),
  UNIQUE KEY `code_25` (`code`),
  UNIQUE KEY `code_26` (`code`),
  UNIQUE KEY `code_27` (`code`),
  UNIQUE KEY `code_28` (`code`),
  UNIQUE KEY `code_29` (`code`),
  UNIQUE KEY `code_30` (`code`),
  UNIQUE KEY `code_31` (`code`),
  UNIQUE KEY `code_32` (`code`),
  UNIQUE KEY `code_33` (`code`),
  UNIQUE KEY `code_34` (`code`),
  UNIQUE KEY `code_35` (`code`),
  UNIQUE KEY `code_36` (`code`),
  UNIQUE KEY `code_37` (`code`),
  UNIQUE KEY `code_38` (`code`),
  UNIQUE KEY `code_39` (`code`),
  UNIQUE KEY `code_40` (`code`),
  UNIQUE KEY `code_41` (`code`),
  UNIQUE KEY `code_42` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `Entities` (`id`, `name`, `code`, `taxId`, `address`, `contactPerson`, `contactEmail`, `createdAt`, `updatedAt`, `logo`) VALUES (4, 'OFB TECH LIMITED', 'OFB', '', '6th Floor, Tower A, Global Business Park, MG Road, Gurugram, Harayana-122002', NULL, NULL, '2026-01-23 07:26:44', '2026-02-18 09:47:15', 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMiIgZGF0YS1uYW1lPSJMYXllciAyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgMTYzLjIxIDUyLjkzIj4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBmaWxsOiB1cmwoI2xpbmVhci1ncmFkaWVudCk7CiAgICAgIH0KCiAgICAgIC5jbHMtMiB7CiAgICAgICAgZmlsbDogIzBmMTcyYTsKICAgICAgfQogICAgPC9zdHlsZT4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ibGluZWFyLWdyYWRpZW50IiB4MT0iMCIgeTE9Ii0xNjM1LjM5IiB4Mj0iMTYzLjIxIiB5Mj0iLTE2MzUuMzkiIGdyYWRpZW50VHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtMTYxNi4zNCkgc2NhbGUoMSAtMSkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjMTljZGE1Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzNiOGZkZSIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPGcgaWQ9IkNvbG9yIj4KICAgIDxnPgogICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Im0xMjEuNTEsNTEuNTNjMTMuMjQtMi44MywyNy0yLjg1LDQwLjMxLS40OC0xMy4yNC0xLjg5LTI2Ljk2LTEuNDEtMzkuOTQsMS44NC0uOTEuMjctMS4zMS0xLjE0LS4zNy0xLjM3aDBaIi8+CiAgICAgIDxwYXRoIGlkPSJsb2dvIiBjbGFzcz0iY2xzLTEiIGQ9Im00NC4wNiwxLjk4YzEyLjc2LTUuNjEsMjEuNSwxLjU5LDIwLjk3LDEwLjgtLjUzLDguNTgtNC41NSwxNC44My05LjUzLDE5LjQzLTIuNywyLjQ5LTQuNjYsMi40NC02LjA5LDMuMzksNy4wNC00LjY2LDExLjMzLTEzLjg3LDExLjI4LTIwLjYtLjA1LTguMzctNi4wOS0xMy41LTE2LjU3LTguNzktNy44OSwzLjYtMTMuNzcsMTAuNTktMTMuODcsMTkuNDktLjExLDcuNzgsNS42MSwxMS4wNywxMy41LDguMjEsNy40Ny0zLjQ0LDcuMjUtNy4yNSw3LjI1LTguNjgtLjA1LTIuMTctMS43NS0zLjE4LTMuODEtMi4zMy0yLjMzLjk1LTMuNiwyLjkxLTMuNiw1LjAzLjA1LDIuNTksMy4xOCwyLjEyLDMuMTgsMi4xMi02LjU3LDQuNjYtOC4xNi0uMTEtOC4xNi0uMTFsLS4xMS0xNy41M2MzLjM0LTEuMzIsNC40NSwxLjMyLDQuNDUsMS4zMmwuMDUsNy42OGM1LjAzLTQuNSw5LTMuMTgsMTAuNDktMS41OSwyLjY1LDIuODYuNzQsOS4zMi00LjA4LDEzLjA4LTEuMDYuODUtMS45NiwxLjQzLTIuNywyLjAxLTEyLjM0LDYuODMtMjEuOTgsMi4zMy0yMC43Ni0xMC4xMSwxLjE2LTEwLjExLDkuMzItMTkuMDEsMTguMTEtMjIuODJaTTYuOTQsMTYuNTRjMi44NiwwLDQuNjYuNDgsNS42MSwxLjM4LjkuOTUsMS4zMiwyLjk3LDEuMzIsNS45MywwLDMuMzQtLjQyLDUuNjEtMS4yNyw2LjYyLS44NSwxLjA2LTIuNjUsMS41OS01LjQ1LDEuNTktMy4wMiwwLTQuOTgtLjQ4LTUuODMtMS40My0uOS0uOTUtMS4zMi0zLjEyLTEuMzItNi40MXMuNDItNS4yNCwxLjMyLTYuMmMuNzktMS4wMSwyLjctMS40OCw1LjYxLTEuNDhabTIuNzUsMTEuNzZjLjM3LS42NC41OC0yLjA3LjU4LTQuMzQsMC0xLjk2LS4yMS0zLjE4LS41OC0zLjcxLS40Mi0uNTMtMS4zMi0uNzktMi43NS0uNzlzLTIuMzguMjYtMi44MS43OWMtLjQyLjUzLS41OCwxLjgtLjU4LDMuODEsMCwyLjI4LjIxLDMuNzEuNTgsNC4yOS4zNy41OCwxLjMyLjg1LDIuODYuODUsMS4zOCwwLDIuMjgtLjI2LDIuNy0uOVptMTAuNjQtMTMuMTl2MS42NGwzLjYtLjA1djIuNzVoLTMuNjV2MTIuNWgtMy41NXYtMTIuNDRoLTIuMDF2LTIuNzVoMi4wN3YtMS42NGMwLTEuOTYuNDItMy4yOCwxLjIyLTQuMDIuNzktLjc0LDIuMjItMS4xMSw0LjQtMS4xMS4zNywwLC45LDAsMS40OC4wNXYyLjg2Yy0uNDgtLjExLS45LS4xNi0xLjIyLS4xNi0xLjU0LDAtMi4zMy43OS0yLjMzLDIuMzhabTU1LjM5LDEwLjExdi03Ljk0aDMuNTV2MTQuNjJoLTMuNTVsLjIxLTIuNDktLjA1LS4wNWMtLjY5LDEuOC0yLjI4LDIuNy00Ljc3LDIuNy0zLjM5LDAtNS4wMy0xLjY0LTUuMDMtNC45OHYtOS44aDMuNTV2OC45NWMwLDEuMjIuMjEsMi4wNy41MywyLjQ0LjM3LjQyLDEuMDYuNTgsMi4xNy41OCwyLjIyLDAsMy4zOS0xLjMyLDMuMzktNC4wMlptMTguMjctMS4yMmMuNzQuNTgsMS4xMSwxLjY0LDEuMTEsMy4yOCwwLDEuNzUtLjUzLDMuMDItMS41NCwzLjcxLTEuMDEuNjktMi44NiwxLjAxLTUuNTEsMS4wMXMtNC4yOS0uMzItNS4xOS0uOTVjLS45LS42NC0xLjM4LTEuNzUtMS4zOC0zLjV2LS4zN2gzLjcxYy0uMDUuMjEtLjExLjM3LS4xMS40OC0uMTYsMS4yNy44NSwxLjkxLDMuMDIsMS45MXMzLjM5LS42NCwzLjM5LTEuOTEtLjY5LTEuODUtMi4xMi0xLjg1Yy0zLjE4LDAtNS4yNC0uMzItNi4yNS0uOS0xLjAxLS41OC0xLjU0LTEuOC0xLjU0LTMuNjUsMC0xLjY5LjQ4LTIuODEsMS4zOC0zLjM5LjktLjU4LDIuNy0uOSw1LjMtLjksMi40NCwwLDQuMTMuMzIsNC45OC44NS44NS41OCwxLjI3LDEuNjksMS4yNywzLjM0aC0zLjQ0YzAtLjExLS4wNS0uMjEtLjA1LS4yNi0uMDUtLjY5LS4yNi0xLjExLS41OC0xLjMyLS4zMi0uMTYtMS4xMS0uMjYtMi40NC0uMjYtMS44NSwwLTIuNzUuNTgtMi43NSwxLjc1LDAsLjc5LjE2LDEuMjcuNDgsMS40My4zMi4xNiwxLjQzLjI2LDMuMjguMzcsMi41NC4yNiw0LjE4LjY0LDQuOTgsMS4xNlptMTcuNzktNi45NGMzLjUsMCw1LjI0LDEuNTksNS4yNCw0LjgydjkuOTZoLTMuNTV2LTkuMzJsLS4wNS0xLjAxYy0uMjEtMS4xMS0xLjA2LTEuNjQtMi41OS0xLjY0LTIuMzgsMC0zLjYsMS4xMS0zLjYsMy4zNHY4LjY4aC0zLjU1di0xNC42MmgzLjU1bC0uMTEsMi40NGguMDVjLjY0LTEuNzUsMi4yMi0yLjY1LDQuNjEtMi42NVptMTQuNTEsMGMyLjY1LDAsNC40LjQ4LDUuMywxLjQzLjkuOTUsMS4zOCwyLjgxLDEuMzgsNS42MXYxLjA2aC0xMC4wMWMtLjA1LjMyLS4wNS41OC0uMDUuNjQsMCwxLjQzLjIxLDIuMzguNjQsMi44Ni40Mi40OCwxLjMyLjY5LDIuNy42OXMyLjE3LS4xNiwyLjU0LS40MmMuNDItLjI2LjU4LS44NS41OC0xLjhoMy41NXYuNThjMCwyLjg2LTIuMTcsNC4yOS02LjUxLDQuMjktMi45MSwwLTQuODctLjQ4LTUuNzctMS40OC0uOS0xLjAxLTEuMzgtMy4wNy0xLjM4LTYuMjUsMC0yLjgxLjQ4LTQuNzcsMS40My01LjcyLDEuMDEtLjk1LDIuODYtMS40OCw1LjYxLTEuNDhabS0yLjc1LDMuMjNjLS40Mi40Mi0uNTgsMS4zMi0uNTgsMi43NWw2LjQ2LjA1LS4wNS0uNThjMC0xLjE2LS4yMS0xLjkxLS41OC0yLjI4LS40Mi0uMzItMS4yNy0uNTMtMi42NS0uNTNzLTIuMTcuMjEtMi41OS41OFptMjMuNTEsMy43MWMuNzQuNTgsMS4xMSwxLjY0LDEuMTEsMy4yOCwwLDEuNzUtLjUzLDMuMDItMS41NCwzLjcxLTEuMDEuNjktMi44NiwxLjAxLTUuNTEsMS4wMXMtNC4yNC0uMzItNS4xOS0uOTVjLS45LS42NC0xLjM4LTEuNzUtMS4zOC0zLjV2LS4zN2gzLjcxYy0uMDUuMjEtLjExLjM3LS4xMS40OC0uMTYsMS4yNy44NSwxLjkxLDMuMDIsMS45MXMzLjM5LS42NCwzLjM5LTEuOTEtLjY5LTEuODUtMi4xMi0xLjg1Yy0zLjE4LDAtNS4yNC0uMzItNi4yNS0uOS0xLjAxLS41OC0xLjU0LTEuOC0xLjU0LTMuNjUsMC0xLjY5LjQ4LTIuODEsMS4zOC0zLjM5LjktLjU4LDIuNy0uOSw1LjMtLjksMi40NCwwLDQuMTMuMzIsNC45OC44NS44NS41OCwxLjI3LDEuNjksMS4yNywzLjM0aC0zLjQ0YzAtLjExLS4wNS0uMjEtLjA1LS4yNi0uMDUtLjY5LS4yNi0xLjExLS41OC0xLjMyLS4zMi0uMTYtMS4xMS0uMjYtMi40NC0uMjYtMS44NSwwLTIuNzUuNTgtMi43NSwxLjc1LDAsLjc5LjE2LDEuMjcuNDgsMS40My4zMi4xNiwxLjQzLjI2LDMuMjguMzcsMi41NC4yNiw0LjI0LjY0LDQuOTgsMS4xNlptMTUuMDQsMGMuNzQuNTgsMS4xMSwxLjY0LDEuMTEsMy4yOCwwLDEuNzUtLjUzLDMuMDItMS41NCwzLjcxLTEuMDEuNjktMi44NiwxLjAxLTUuNTEsMS4wMXMtNC4yNC0uMzItNS4xOS0uOTVjLS45LS42NC0xLjM4LTEuNzUtMS4zOC0zLjV2LS4zN2gzLjcxYy0uMDUuMjEtLjExLjM3LS4xMS40OC0uMTYsMS4yNy44NSwxLjkxLDMuMDIsMS45MXMzLjM5LS42NCwzLjM5LTEuOTEtLjY5LTEuODUtMi4xMi0xLjg1Yy0zLjE4LDAtNS4yNC0uMzItNi4yNS0uOS0xLjAxLS41OC0xLjQ4LTEuNzUtMS40OC0zLjYsMC0xLjY5LjQ4LTIuODEsMS4zOC0zLjM5LjktLjU4LDIuNy0uOSw1LjMtLjksMi40NCwwLDQuMTMuMzIsNC45OC44NS44NS41OCwxLjI3LDEuNjksMS4yNywzLjM0aC0zLjQ0YzAtLjExLS4wNS0uMjEtLjA1LS4yNi0uMDUtLjY5LS4yNi0xLjExLS41OC0xLjMyLS4zMi0uMTYtMS4xMS0uMjYtMi40NC0uMjYtMS44NSwwLTIuNzUuNTgtMi43NSwxLjc1LDAsLjc5LjE2LDEuMjcuNDgsMS40My4zMi4xNiwxLjQzLjI2LDMuMjguMzcsMi41NC4yMSw0LjE4LjU4LDQuOTIsMS4xMVptLTY0LjgyLDh2LTE0LjcyaDMuNDR2MTQuNjdoLTMuNDR2LjA1WiIvPgogICAgICA8Zz4KICAgICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Im01Mi4wNywzOS40M2gyLjExYy4zNSwwLC42Ni4wNy45MS4yLjI2LjE0LjQ2LjMyLjU5LjU0LjE0LjIzLjIuNDcuMi43NCwwLC4zNi0uMS42Ny0uMzEuOTEtLjIuMjQtLjQ2LjQxLS43Ni41MXYuMDVjLjUzLjI4LjguNy44LDEuMjYsMCwuMzYtLjEuNjgtLjMuOTYtLjIuMjktLjQ3LjUxLS44MS42Ny0uMzQuMTYtLjcyLjI0LTEuMTMuMjRoLTIuMzlsMS4wOC02LjA4Wm0xLjQ2LDUuMmMuMywwLC41Ni0uMDkuNzktLjI2LjIyLS4xNy4zMy0uNDEuMzMtLjcyLDAtLjI1LS4wOC0uNDUtLjI0LS42LS4xNi0uMTUtLjM4LS4yMi0uNjYtLjIyaC0xLjM0bC0uMzEsMS44aDEuNDNabS4zMy0yLjY1Yy4zMiwwLC41OC0uMDguNzctLjI0LjItLjE2LjMtLjM4LjMtLjY2LDAtLjIyLS4wNy0uNC0uMjItLjU1cy0uMzQtLjIyLS41OS0uMjJoLTEuMjZsLS4zLDEuNjdoMS4zWiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0ibTU5LjIxLDQ0Ljk1Yy0uMTUuMjItLjM0LjM4LS41OC41MS0uMjQuMTItLjUyLjE5LS44My4xOS0uNDQsMC0uNzgtLjEyLTEuMDItLjM2LS4yNS0uMjQtLjM3LS41NS0uMzctLjk0LDAtLjE5LjAyLS4zOC4wNi0uNThsLjQ2LTIuNTloLjkzbC0uNDUsMi41NWMtLjAzLjE0LS4wNC4yNi0uMDQuMzcsMCwuMjIuMDcuMzguMjIuNTEuMTUuMTIuMzQuMTkuNTguMTkuMzMsMCwuNjEtLjEyLjg0LS4zNXMuMzgtLjU0LjQ1LS45MWwuNDItMi4zNWguOTNsLS43Niw0LjMzaC0uODhsLjEtLjU2aC0uMDVaIi8+CiAgICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJtNjEuNjEsNDUuMzJjLS4zMS0uMjItLjUyLS41MS0uNjItLjg2bC44Ny0uMzZjLjA1LjIzLjE3LjQxLjM2LjUzLjE5LjEyLjQxLjE4LjY1LjE4LjIzLDAsLjQxLS4wNS41Ni0uMTUuMTUtLjEuMjItLjIzLjIyLS4zOXMtLjA1LS4yOC0uMTYtLjM3Yy0uMS0uMS0uMjctLjE3LS40OS0uMjJsLS40NC0uMTFjLS4zMy0uMDktLjYxLS4yMy0uODEtLjQzLS4yMS0uMi0uMzEtLjQ1LS4zMS0uNzUsMC0uMjYuMDgtLjQ5LjIzLS43LjE1LS4yLjM2LS4zNi42My0uNDhzLjU4LS4xNy45My0uMTdjLjQsMCwuNzUuMDksMS4wNC4yNy4yOS4xOC40OS40Mi42LjczbC0uODcuMzNjLS4wNi0uMTYtLjE3LS4yOS0uMzItLjM5LS4xNS0uMDktLjMzLS4xNC0uNTMtLjE0LS4yMywwLS40Mi4wNS0uNTUuMTQtLjE0LjA5LS4yLjIxLS4yLjM1LDAsLjEuMDUuMi4xNC4yOC4xLjA5LjIzLjE1LjM5LjJsLjU5LjE0Yy4zNC4wOC42MS4yNC44MS40NXMuMjkuNDcuMjkuNzdjMCwuNDQtLjE2LjgtLjQ5LDEuMDctLjMzLjI3LS43Ny40LTEuMzUuNC0uNDgsMC0uODctLjExLTEuMTgtLjMzWiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0ibTY1Ljk2LDQxLjE4aC45M2wtLjc2LDQuMzNoLS45M2wuNzYtNC4zM1ptLjI1LS44Yy0uMTItLjEyLS4xOC0uMjctLjE4LS40NXMuMDYtLjMyLjE4LS40NWMuMTItLjEyLjI3LS4xOC40NS0uMThzLjMyLjA2LjQ1LjE4LjE4LjI3LjE4LjQ1LS4wNi4zMi0uMTguNDVjLS4xMi4xMi0uMjcuMTgtLjQ1LjE4cy0uMzItLjA2LS40NS0uMThaIi8+CiAgICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJtNjguOTEsNDEuNzVjLjE1LS4yMi4zNC0uMzkuNTgtLjUyLjI0LS4xMi41MS0uMTkuODItLjE5LjQ0LDAsLjc4LjEyLDEuMDMuMzYuMjQuMjQuMzcuNTYuMzcuOTUsMCwuMTgtLjAyLjM3LS4wNS41N2wtLjQ2LDIuNTloLS45M2wuNDUtMi41NGMuMDMtLjE1LjA0LS4yOC4wNC0uMzcsMC0uMjEtLjA3LS4zOC0uMjItLjVzLS4zNC0uMTgtLjU4LS4xOGMtLjMzLDAtLjYxLjEyLS44NC4zNS0uMjQuMjMtLjM4LjU0LS40NS45MWwtLjQyLDIuMzRoLS45M2wuNzYtNC4zM2guODhsLS4xLjU3aC4wNVoiLz4KICAgICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Im03My4zMiw0NS4zOGMtLjMtLjE4LS41NC0uNDMtLjctLjczcy0uMjQtLjY1LS4yNC0xLjAxYzAtLjQ1LjEtLjg4LjMxLTEuMjcuMjEtLjQuNS0uNzEuODgtLjk1LjM4LS4yNC44MS0uMzYsMS4zLS4zNi4zOCwwLC43Mi4wOCwxLC4yNS4yOC4xNy41LjM5LjY0LjY3LjE1LjI4LjIyLjU4LjIyLjkxLDAsLjI1LS4wMy40OC0uMDkuNjhoLTMuMzNzMCwuMSwwLC4xOWMwLC4zMy4xMi41OS4zNC43OHMuNDguMjkuNzkuMjkuNTgtLjA2Ljc5LS4xOGMuMjEtLjEyLjM4LS4zLjUzLS41NGwuNzEuMzljLS40Ni43OC0xLjE2LDEuMTYtMi4xLDEuMTYtLjQsMC0uNzUtLjA5LTEuMDUtLjI3Wm0yLjUyLTIuNTR2LS4wN2MwLS4yNS0uMDktLjQ2LS4yOC0uNjUtLjE5LS4xOC0uNDUtLjI3LS43Ny0uMjdzLS42LjA5LS44NC4yOGMtLjI0LjE5LS40LjQyLS41LjdoMi4zOVoiLz4KICAgICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Im03Ny43Miw0NS4zMmMtLjMxLS4yMi0uNTItLjUxLS42Mi0uODZsLjg3LS4zNmMuMDUuMjMuMTcuNDEuMzYuNTMuMTkuMTIuNDEuMTguNjUuMTguMjMsMCwuNDEtLjA1LjU2LS4xNS4xNS0uMS4yMi0uMjMuMjItLjM5cy0uMDUtLjI4LS4xNi0uMzdjLS4xLS4xLS4yNy0uMTctLjQ5LS4yMmwtLjQ0LS4xMWMtLjMzLS4wOS0uNjEtLjIzLS44MS0uNDMtLjIxLS4yLS4zMS0uNDUtLjMxLS43NSwwLS4yNi4wOC0uNDkuMjMtLjcuMTUtLjIuMzYtLjM2LjYzLS40OHMuNTgtLjE3LjkzLS4xN2MuNCwwLC43NS4wOSwxLjA0LjI3LjI5LjE4LjQ5LjQyLjYuNzNsLS44Ny4zM2MtLjA2LS4xNi0uMTctLjI5LS4zMi0uMzktLjE1LS4wOS0uMzMtLjE0LS41My0uMTQtLjIzLDAtLjQyLjA1LS41NS4xNC0uMTQuMDktLjIuMjEtLjIuMzUsMCwuMS4wNS4yLjE0LjI4LjEuMDkuMjMuMTUuMzkuMmwuNTkuMTRjLjM0LjA4LjYxLjI0LjgxLjQ1cy4yOS40Ny4yOS43N2MwLC40NC0uMTYuOC0uNDksMS4wNy0uMzMuMjctLjc3LjQtMS4zNS40LS40OCwwLS44Ny0uMTEtMS4xOC0uMzNaIi8+CiAgICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJtODEuODIsNDUuMzJjLS4zMS0uMjItLjUyLS41MS0uNjItLjg2bC44Ny0uMzZjLjA1LjIzLjE3LjQxLjM2LjUzLjE5LjEyLjQxLjE4LjY1LjE4LjIzLDAsLjQxLS4wNS41Ni0uMTUuMTUtLjEuMjItLjIzLjIyLS4zOXMtLjA1LS4yOC0uMTYtLjM3Yy0uMS0uMS0uMjctLjE3LS40OS0uMjJsLS40NC0uMTFjLS4zMy0uMDktLjYxLS4yMy0uODEtLjQzLS4yMS0uMi0uMzEtLjQ1LS4zMS0uNzUsMC0uMjYuMDgtLjQ5LjIzLS43LjE1LS4yLjM2LS4zNi42My0uNDhzLjU4LS4xNy45My0uMTdjLjQsMCwuNzUuMDksMS4wNC4yNy4yOS4xOC40OS40Mi42LjczbC0uODcuMzNjLS4wNi0uMTYtLjE3LS4yOS0uMzItLjM5LS4xNS0uMDktLjMzLS4xNC0uNTMtLjE0LS4yMywwLS40Mi4wNS0uNTUuMTQtLjE0LjA5LS4yLjIxLS4yLjM1LDAsLjEuMDUuMi4xNC4yOC4xLjA5LjIzLjE1LjM5LjJsLjU5LjE0Yy4zNC4wOC42MS4yNC44MS40NXMuMjkuNDcuMjkuNzdjMCwuNDQtLjE2LjgtLjQ5LDEuMDctLjMzLjI3LS43Ny40LTEuMzUuNC0uNDgsMC0uODctLjExLTEuMTgtLjMzWiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0ibTg4LjQ5LDM5LjQzaDEuMjdsLjk0LDQuNjFoLjA0bDIuNTYtNC42MWgxLjMybC0xLjA4LDYuMDhoLS45NGwuNi0zLjQuMjUtMS4xaC0uMDVsLTIuNSw0LjVoLS43OGwtLjk2LTQuNWgtLjA1bC0uMTQsMS4xLS42LDMuNGgtLjk0bDEuMDgtNi4wOFoiLz4KICAgICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Im05NS41Miw0NS40N2MtLjIxLS4xMi0uMzktLjI4LS41MS0uNDgtLjEzLS4yLS4xOS0uNDMtLjE5LS42OSwwLS40OC4xNy0uODYuNTItMS4xNS4zNC0uMjguODMtLjQyLDEuNDUtLjQyLjIxLDAsLjQyLjAyLjYyLjA3LjIuMDQuMzkuMS41NS4xOGwuMDQtLjIxYy4wMi0uMDguMDMtLjE1LjAzLS4yLDAtLjIxLS4wOS0uMzktLjI4LS41MnMtLjQxLS4yLS42Ny0uMmMtLjQ0LDAtLjguMTctMS4wOS41MWwtLjY3LS40OGMuMjItLjI3LjQ4LS40Ny44MS0uNjEuMzItLjE0LjY3LS4yMSwxLjA1LS4yMS41NCwwLC45Ny4xMywxLjI4LjM5LjMxLjI2LjQ3LjYxLjQ3LDEuMDQsMCwuMTItLjAxLjI3LS4wNC40NWwtLjQ2LDIuNTloLS45MmwuMDktLjUyaC0uMDVjLS4xNC4yLS4zMi4zNi0uNTQuNDhzLS40OC4xNy0uNzcuMTdjLS4yNiwwLS41LS4wNi0uNzEtLjE3Wm0xLjg2LS45M2MuMjQtLjIyLjM5LS41LjQ1LS44NS0uMTYtLjA4LS4zMi0uMTUtLjQ3LS4xOS0uMTYtLjA0LS4zNS0uMDYtLjU4LS4wNi0uMzEsMC0uNTUuMDctLjczLjIxLS4xOC4xNC0uMjcuMzMtLjI3LjU4LDAsLjE5LjA3LjM1LjIxLjQ2cy4zMS4xNy41Mi4xN2MuMzQsMCwuNjMtLjExLjg4LS4zM1oiLz4KICAgICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Im0xMDAuMTUsNDUuM2MtLjItLjE5LS4zMS0uNDUtLjMxLS43OCwwLS4xNS4wMS0uMjkuMDQtLjQzbC4zNy0yLjA4aC0uNzZsLjE1LS44MmguNzVsLjIyLTEuMjJoLjkzbC0uMjIsMS4yMmgxLjA2bC0uMTUuODJoLTEuMDVsLS4zNiwyYy0uMDIuMTItLjAzLjIyLS4wMy4yOCwwLC4xMy4wNC4yMy4xMi4zMS4wOC4wOC4xOS4xMS4zMy4xMS4yLDAsLjM4LS4wNS41NS0uMTZsLS4xNS45MWMtLjIuMDgtLjQzLjEzLS42OS4xMy0uMzQsMC0uNjEtLjA5LS44Mi0uMjhaIi8+CiAgICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJtMTAzLjYzLDM5LjQzaC45M2wtMS4wNyw2LjA4aC0uOTNsMS4wNy02LjA4WiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0ibTEwNS40LDQ1LjQ3Yy0uMjEtLjEyLS4zOS0uMjgtLjUxLS40OC0uMTMtLjItLjE5LS40My0uMTktLjY5LDAtLjQ4LjE3LS44Ni41Mi0xLjE1LjM0LS4yOC44My0uNDIsMS40NS0uNDIuMjEsMCwuNDIuMDIuNjIuMDcuMi4wNC4zOS4xLjU1LjE4bC4wNC0uMjFjLjAyLS4wOC4wMy0uMTUuMDMtLjIsMC0uMjEtLjA5LS4zOS0uMjgtLjUycy0uNDEtLjItLjY3LS4yYy0uNDQsMC0uOC4xNy0xLjA5LjUxbC0uNjctLjQ4Yy4yMi0uMjcuNDgtLjQ3LjgxLS42MS4zMi0uMTQuNjctLjIxLDEuMDUtLjIxLjU0LDAsLjk3LjEzLDEuMjguMzkuMzEuMjYuNDcuNjEuNDcsMS4wNCwwLC4xMi0uMDEuMjctLjA0LjQ1bC0uNDYsMi41OWgtLjkybC4wOS0uNTJoLS4wNWMtLjE0LjItLjMyLjM2LS41NC40OHMtLjQ4LjE3LS43Ny4xN2MtLjI2LDAtLjUtLjA2LS43MS0uMTdabTEuODYtLjkzYy4yNC0uMjIuMzktLjUuNDUtLjg1LS4xNi0uMDgtLjMyLS4xNS0uNDctLjE5LS4xNi0uMDQtLjM1LS4wNi0uNTgtLjA2LS4zMSwwLS41NS4wNy0uNzMuMjEtLjE4LjE0LS4yNy4zMy0uMjcuNTgsMCwuMTkuMDcuMzUuMjEuNDZzLjMxLjE3LjUyLjE3Yy4zNCwwLC42My0uMTEuODgtLjMzWiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0ibTExMC43NCw0NS40NWMtLjI0LS4xMy0uNDMtLjMtLjU2LS41aC0uMDRsLS4xLjU2aC0uODhsMS4wNy02LjA4aC45M2wtLjMxLDEuNzEtLjE1LjYxaC4wNWMuMTItLjIuMzEtLjM3LjU0LS41LjI0LS4xNC41Mi0uMi44NC0uMi4zNCwwLC42NS4wOC45Mi4yNS4yNy4xNy40OS40MS42NS43Mi4xNi4zMS4yNC42Ni4yNCwxLjA2LDAsLjQ4LS4xLjkxLS4zMSwxLjMtLjIxLjM5LS40OS43LS44NS45M3MtLjc3LjM0LTEuMjEuMzRjLS4zMSwwLS41OS0uMDctLjgzLS4yWm0xLjUyLS44N2MuMjMtLjE0LjQyLS4zMy41NS0uNThzLjItLjUzLjItLjg0YzAtLjM2LS4xMS0uNjUtLjMzLS44OS0uMjItLjI0LS41LS4zNi0uODMtLjM2LS4yOCwwLS41My4wOC0uNzUuMjMtLjIyLjE1LS4zOS4zNi0uNTIuNjItLjEzLjI2LS4xOS41NC0uMTkuODQsMCwuMzYuMTEuNjUuMzIuODdzLjQ4LjMzLjc5LjMzYy4yOCwwLC41My0uMDcuNzYtLjIxWiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0ibTExNy44LDQ1LjI5Yy0uNDMtLjIzLS43Ny0uNTYtMS4wMS0uOTgtLjI1LS40Mi0uMzctLjktLjM3LTEuNDUsMC0uNjMuMTUtMS4yMi40NS0xLjc2LjMtLjU1LjczLS45OCwxLjI3LTEuMzEuNTUtLjMzLDEuMTctLjQ5LDEuODYtLjQ5LjUzLDAsMS4wMS4xMiwxLjQ0LjM2LjQzLjI0Ljc2LjU3LDEuMDEuOTkuMjQuNDIuMzcuOS4zNywxLjQ0LDAsLjYzLS4xNSwxLjIxLS40NSwxLjc2LS4zLjU1LS43My45OC0xLjI3LDEuMzFzLTEuMTYuNDktMS44NS40OWMtLjUzLDAtMS0uMTItMS40NC0uMzVabTIuOC0uOTJjLjM5LS4yNC42OS0uNTcuOTItLjk3LjIyLS40LjMzLS44My4zMy0xLjI4LDAtLjM4LS4wOC0uNzEtLjI1LTEuMDEtLjE3LS4yOS0uNC0uNTItLjctLjY3cy0uNjMtLjI0LS45OS0uMjRjLS40NiwwLS44OC4xMi0xLjI3LjM2cy0uNjkuNTYtLjkyLjk2Yy0uMjIuNC0uMzQuODMtLjM0LDEuMjgsMCwuMzkuMDguNzIuMjUsMS4wMS4xNy4yOS40LjUyLjcuNjcuMjkuMTYuNjIuMjQuOTkuMjQuNDYsMCwuODktLjEyLDEuMjgtLjM3WiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0ibTEyNC4yNSw0Mi4wMWgtLjc5bC4xNC0uODJoLjhsLjA1LS4zNGMuMDctLjQ2LjI3LS44My41OS0xLjA5LjMyLS4yNi43MS0uMzksMS4xOC0uMzkuMjcsMCwuNDguMDQuNjUuMTFsLS4xNi45Yy0uMTYtLjA5LS4zNS0uMTQtLjU2LS4xNC0uMTksMC0uMzUuMDYtLjUuMThzLS4yNC4yOC0uMjcuNDlsLS4wNC4yN2gxLjA4bC0uMTQuODJoLTEuMDlsLS42MiwzLjUxaC0uOTNsLjYyLTMuNTFaIi8+CiAgICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJtMTI3Ljc2LDM5LjQzaDIuMTFjLjM1LDAsLjY2LjA3LjkxLjIuMjYuMTQuNDYuMzIuNTkuNTQuMTQuMjMuMi40Ny4yLjc0LDAsLjM2LS4xLjY3LS4zMS45MS0uMi4yNC0uNDYuNDEtLjc2LjUxdi4wNWMuNTMuMjguOC43LjgsMS4yNiwwLC4zNi0uMS42OC0uMy45Ni0uMi4yOS0uNDcuNTEtLjgxLjY3LS4zNC4xNi0uNzIuMjQtMS4xMy4yNGgtMi4zOWwxLjA4LTYuMDhabTEuNDYsNS4yYy4zLDAsLjU2LS4wOS43OS0uMjYuMjItLjE3LjMzLS40MS4zMy0uNzIsMC0uMjUtLjA4LS40NS0uMjQtLjYtLjE2LS4xNS0uMzgtLjIyLS42Ni0uMjJoLTEuMzRsLS4zMSwxLjhoMS40M1ptLjMzLTIuNjVjLjMyLDAsLjU4LS4wOC43Ny0uMjQuMi0uMTYuMy0uMzguMy0uNjYsMC0uMjItLjA3LS40LS4yMi0uNTVzLS4zNC0uMjItLjU5LS4yMmgtMS4yNmwtLjMsMS42N2gxLjNaIi8+CiAgICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJtMTM0LjksNDQuOTVjLS4xNS4yMi0uMzQuMzgtLjU4LjUxLS4yNC4xMi0uNTIuMTktLjgzLjE5LS40NCwwLS43OC0uMTItMS4wMi0uMzYtLjI1LS4yNC0uMzctLjU1LS4zNy0uOTQsMC0uMTkuMDItLjM4LjA2LS41OGwuNDYtMi41OWguOTNsLS40NSwyLjU1Yy0uMDMuMTQtLjA0LjI2LS4wNC4zNywwLC4yMi4wNy4zOC4yMi41MS4xNS4xMi4zNC4xOS41OC4xOS4zMywwLC42MS0uMTIuODQtLjM1cy4zOC0uNTQuNDUtLjkxbC40Mi0yLjM1aC45M2wtLjc2LDQuMzNoLS44OGwuMS0uNTZoLS4wNVoiLz4KICAgICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Im0xMzcuMjksNDUuMzJjLS4zMS0uMjItLjUyLS41MS0uNjItLjg2bC44Ny0uMzZjLjA1LjIzLjE3LjQxLjM2LjUzLjE5LjEyLjQxLjE4LjY1LjE4LjIzLDAsLjQxLS4wNS41Ni0uMTUuMTUtLjEuMjItLjIzLjIyLS4zOXMtLjA1LS4yOC0uMTYtLjM3Yy0uMS0uMS0uMjctLjE3LS40OS0uMjJsLS40NC0uMTFjLS4zMy0uMDktLjYxLS4yMy0uODEtLjQzLS4yMS0uMi0uMzEtLjQ1LS4zMS0uNzUsMC0uMjYuMDgtLjQ5LjIzLS43LjE1LS4yLjM2LS4zNi42My0uNDhzLjU4LS4xNy45My0uMTdjLjQsMCwuNzUuMDksMS4wNC4yNy4yOS4xOC40OS40Mi42LjczbC0uODcuMzNjLS4wNi0uMTYtLjE3LS4yOS0uMzItLjM5LS4xNS0uMDktLjMzLS4xNC0uNTMtLjE0LS4yMywwLS40Mi4wNS0uNTUuMTQtLjE0LjA5LS4yLjIxLS4yLjM1LDAsLjEuMDUuMi4xNC4yOC4xLjA5LjIzLjE1LjM5LjJsLjU5LjE0Yy4zNC4wOC42MS4yNC44MS40NXMuMjkuNDcuMjkuNzdjMCwuNDQtLjE2LjgtLjQ5LDEuMDctLjMzLjI3LS43Ny40LTEuMzUuNC0uNDgsMC0uODctLjExLTEuMTgtLjMzWiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0ibTE0MS42NSw0MS4xOGguOTNsLS43Niw0LjMzaC0uOTNsLjc2LTQuMzNabS4yNS0uOGMtLjEyLS4xMi0uMTgtLjI3LS4xOC0uNDVzLjA2LS4zMi4xOC0uNDVjLjEyLS4xMi4yNy0uMTguNDUtLjE4cy4zMi4wNi40NS4xOC4xOC4yNy4xOC40NS0uMDYuMzItLjE4LjQ1Yy0uMTIuMTItLjI3LjE4LS40NS4xOHMtLjMyLS4wNi0uNDUtLjE4WiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0ibTE0NC42LDQxLjc1Yy4xNS0uMjIuMzQtLjM5LjU4LS41Mi4yNC0uMTIuNTEtLjE5LjgyLS4xOS40NCwwLC43OC4xMiwxLjAzLjM2LjI0LjI0LjM3LjU2LjM3Ljk1LDAsLjE4LS4wMi4zNy0uMDUuNTdsLS40NiwyLjU5aC0uOTNsLjQ1LTIuNTRjLjAzLS4xNS4wNC0uMjguMDQtLjM3LDAtLjIxLS4wNy0uMzgtLjIyLS41cy0uMzQtLjE4LS41OC0uMThjLS4zMywwLS42MS4xMi0uODQuMzUtLjI0LjIzLS4zOC41NC0uNDUuOTFsLS40MiwyLjM0aC0uOTNsLjc2LTQuMzNoLjg4bC0uMS41N2guMDVaIi8+CiAgICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJtMTQ5LDQ1LjM4Yy0uMy0uMTgtLjU0LS40My0uNy0uNzNzLS4yNC0uNjUtLjI0LTEuMDFjMC0uNDUuMS0uODguMzEtMS4yNy4yMS0uNC41LS43MS44OC0uOTUuMzgtLjI0LjgxLS4zNiwxLjMtLjM2LjM4LDAsLjcyLjA4LDEsLjI1LjI4LjE3LjUuMzkuNjQuNjcuMTUuMjguMjIuNTguMjIuOTEsMCwuMjUtLjAzLjQ4LS4wOS42OGgtMy4zM3MwLC4xLDAsLjE5YzAsLjMzLjEyLjU5LjM0Ljc4cy40OC4yOS43OS4yOS41OC0uMDYuNzktLjE4Yy4yMS0uMTIuMzgtLjMuNTMtLjU0bC43MS4zOWMtLjQ2Ljc4LTEuMTYsMS4xNi0yLjEsMS4xNi0uNCwwLS43NS0uMDktMS4wNS0uMjdabTIuNTItMi41NHYtLjA3YzAtLjI1LS4wOS0uNDYtLjI4LS42NS0uMTktLjE4LS40NS0uMjctLjc3LS4yN3MtLjYuMDktLjg0LjI4Yy0uMjQuMTktLjQuNDItLjUuN2gyLjM5WiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0ibTE1My40MSw0NS4zMmMtLjMxLS4yMi0uNTItLjUxLS42Mi0uODZsLjg3LS4zNmMuMDUuMjMuMTcuNDEuMzYuNTMuMTkuMTIuNDEuMTguNjUuMTguMjMsMCwuNDEtLjA1LjU2LS4xNS4xNS0uMS4yMi0uMjMuMjItLjM5cy0uMDUtLjI4LS4xNi0uMzdjLS4xLS4xLS4yNy0uMTctLjQ5LS4yMmwtLjQ0LS4xMWMtLjMzLS4wOS0uNjEtLjIzLS44MS0uNDMtLjIxLS4yLS4zMS0uNDUtLjMxLS43NSwwLS4yNi4wOC0uNDkuMjMtLjcuMTUtLjIuMzYtLjM2LjYzLS40OHMuNTgtLjE3LjkzLS4xN2MuNCwwLC43NS4wOSwxLjA0LjI3LjI5LjE4LjQ5LjQyLjYuNzNsLS44Ny4zM2MtLjA2LS4xNi0uMTctLjI5LS4zMi0uMzktLjE1LS4wOS0uMzMtLjE0LS41My0uMTQtLjIzLDAtLjQyLjA1LS41NS4xNC0uMTQuMDktLjIuMjEtLjIuMzUsMCwuMS4wNS4yLjE0LjI4LjEuMDkuMjMuMTUuMzkuMmwuNTkuMTRjLjM0LjA4LjYxLjI0LjgxLjQ1cy4yOS40Ny4yOS43N2MwLC40NC0uMTYuOC0uNDksMS4wNy0uMzMuMjctLjc3LjQtMS4zNS40LS40OCwwLS44Ny0uMTEtMS4xOC0uMzNaIi8+CiAgICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJtMTU3LjUxLDQ1LjMyYy0uMzEtLjIyLS41Mi0uNTEtLjYyLS44NmwuODctLjM2Yy4wNS4yMy4xNy40MS4zNi41My4xOS4xMi40MS4xOC42NS4xOC4yMywwLC40MS0uMDUuNTYtLjE1LjE1LS4xLjIyLS4yMy4yMi0uMzlzLS4wNS0uMjgtLjE2LS4zN2MtLjEtLjEtLjI3LS4xNy0uNDktLjIybC0uNDQtLjExYy0uMzMtLjA5LS42MS0uMjMtLjgxLS40My0uMjEtLjItLjMxLS40NS0uMzEtLjc1LDAtLjI2LjA4LS40OS4yMy0uNy4xNS0uMi4zNi0uMzYuNjMtLjQ4cy41OC0uMTcuOTMtLjE3Yy40LDAsLjc1LjA5LDEuMDQuMjcuMjkuMTguNDkuNDIuNi43M2wtLjg3LjMzYy0uMDYtLjE2LS4xNy0uMjktLjMyLS4zOS0uMTUtLjA5LS4zMy0uMTQtLjUzLS4xNC0uMjMsMC0uNDIuMDUtLjU1LjE0LS4xNC4wOS0uMi4yMS0uMi4zNSwwLC4xLjA1LjIuMTQuMjguMS4wOS4yMy4xNS4zOS4ybC41OS4xNGMuMzQuMDguNjEuMjQuODEuNDVzLjI5LjQ3LjI5Ljc3YzAsLjQ0LS4xNi44LS40OSwxLjA3LS4zMy4yNy0uNzcuNC0xLjM1LjQtLjQ4LDAtLjg3LS4xMS0xLjE4LS4zM1oiLz4KICAgICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Im0xNjEuMjcsNDUuMzdjLS4xMy0uMTMtLjE5LS4yOC0uMTktLjQ2cy4wNi0uMzMuMTktLjQ2Yy4xMy0uMTIuMjgtLjE5LjQ2LS4xOXMuMzMuMDYuNDYuMTljLjEzLjEyLjE5LjI4LjE5LjQ2cy0uMDYuMzMtLjE5LjQ2Yy0uMTMuMTMtLjI4LjE5LS40Ni4xOXMtLjMzLS4wNi0uNDYtLjE5Wm0uNjItNC4xbC4zMi0xLjg0aC45NWwtLjMzLDEuODQtLjQ5LDIuMjZoLS43NmwuMzEtMi4yNloiLz4KICAgICAgPC9nPgogICAgPC9nPgogIDwvZz4KPC9zdmc+');
INSERT INTO `Entities` (`id`, `name`, `code`, `taxId`, `address`, `contactPerson`, `contactEmail`, `createdAt`, `updatedAt`, `logo`) VALUES (5, 'OXYZO FINANCIAL SERVICES LIMITED', 'OXYZO', '', '1st Floor, Tower A, Global Business Park, MG Road, Gurugram, Harayana-122002', NULL, NULL, '2026-01-23 07:27:32', '2026-02-18 11:11:43', 'data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgNzg3IDI1NyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJsaW5lYXItZ3JhZGllbnQiIHgxPSIyMjIuMDYiIHkxPSIxMTUuNTUiIHgyPSI2OTUuMzQiIHkyPSIyMjcuNDYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMwMWQ2YTQiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMDdjZmEiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0ibGluZWFyLWdyYWRpZW50LTIiIHgxPSIyMjUuMzQiIHkxPSIxMTAuMTQiIHgyPSI2OTguNjIiIHkyPSIyMjIuMDUiIHhsaW5rOmhyZWY9IiNsaW5lYXItZ3JhZGllbnQiLz48bGluZWFyR3JhZGllbnQgaWQ9ImxpbmVhci1ncmFkaWVudC0zIiB4MT0iMjM5LjIyIiB5MT0iNjQuMTEiIHgyPSI3MTIuNSIgeTI9IjE3Ni4wMiIgeGxpbms6aHJlZj0iI2xpbmVhci1ncmFkaWVudCIvPjxsaW5lYXJHcmFkaWVudCBpZD0ibGluZWFyLWdyYWRpZW50LTQiIHgxPSIyNDQuOTciIHkxPSIzOS44MiIgeDI9IjcxOC4yNSIgeTI9IjE1MS43NCIgeGxpbms6aHJlZj0iI2xpbmVhci1ncmFkaWVudCIvPjxsaW5lYXJHcmFkaWVudCBpZD0ibGluZWFyLWdyYWRpZW50LTUiIHgxPSIxNjIuMzciIHkxPSI0MC41NyIgeDI9IjYwLjciIHkyPSIxNjYuNDQiIHhsaW5rOmhyZWY9IiNsaW5lYXItZ3JhZGllbnQiLz48bGluZWFyR3JhZGllbnQgaWQ9ImxpbmVhci1ncmFkaWVudC02IiB4MT0iMTA0LjA3IiB5MT0iODguMTQiIHgyPSIxNzMuMTQiIHkyPSIxOTYuMTciIHhsaW5rOmhyZWY9IiNsaW5lYXItZ3JhZGllbnQiLz48bGluZWFyR3JhZGllbnQgaWQ9ImxpbmVhci1ncmFkaWVudC03IiB4MT0iMjY5LjU3IiB5MT0iOTEuODEiIHgyPSIxODMuMDkiIHkyPSIxNTUuNzEiIHhsaW5rOmhyZWY9IiNsaW5lYXItZ3JhZGllbnQiLz48bGluZWFyR3JhZGllbnQgaWQ9ImxpbmVhci1ncmFkaWVudC04IiB4MT0iMTEzLjY1IiB5MT0iMTk3LjM5IiB4Mj0iMjIyLjM0IiB5Mj0iMTAzLjA2IiB4bGluazpocmVmPSIjbGluZWFyLWdyYWRpZW50Ii8+PGxpbmVhckdyYWRpZW50IGlkPSJsaW5lYXItZ3JhZGllbnQtOSIgeDE9Ijk0MTUuNzMiIHkxPSItNTg5MS42NyIgeDI9Ijk1MzQuMDUiIHkyPSItNTk1My4yMyIgZ3JhZGllbnRUcmFuc2Zvcm09InRyYW5zbGF0ZSgxMTA0Mi4zNyAyNTY4LjEzKSByb3RhdGUoLTEzNSkiIHhsaW5rOmhyZWY9IiNsaW5lYXItZ3JhZGllbnQiLz48bGluZWFyR3JhZGllbnQgaWQ9ImxpbmVhci1ncmFkaWVudC0xMCIgeDE9IjIwMC4xMiIgeTE9IjIwLjEyIiB4Mj0iMjAwLjk1IiB5Mj0iMTI2Ljc2IiB4bGluazpocmVmPSIjbGluZWFyLWdyYWRpZW50Ii8+PC9kZWZzPjxwYXRoIGQ9Ik0zNTMuNDgsMTk1LjE2bC0xOS43Ni0yNi45MS0xNS4yNSwyNi45MUgyNzcuNjNsMzUuMTktNTUuMzNMMjc2LjEzLDg5LjU4aDQxLjRsMTkuNTcsMjYuNzMsMTUuNDQtMjYuNzNoNDAuODRsLTM2LjMzLDU0LDM3LjgzLDUxLjU2WiIgZmlsbD0idXJsKCNsaW5lYXItZ3JhZGllbnQpIi8+PHBhdGggZD0iTTQzNy41Myw4OS41OGwyMi41OSw1OS4xTDQ4MSw4OS41OGg0MWwtNjYuODEsMTU2SDQxNC41N2wyNS43OC01NC45NS00NC0xMDEuMDdaIiBmaWxsPSJ1cmwoI2xpbmVhci1ncmFkaWVudC0yKSIvPjxwYXRoIGQ9Ik01NjguMzIsMTY0LjQ5aDQ2LjN2MzAuNjdoLTg3VjE2Nmw0Mi45MS00NS43M0g1MjguNDJWODkuNThoODQuMzJ2MjlaIiBmaWxsPSJ1cmwoI2xpbmVhci1ncmFkaWVudC0zKSIvPjxwYXRoIGQ9Ik03MDYuOTMsOTQuNzZhNDcuNzksNDcuNzksMCwwLDEsMTkuNjcsMTguODJxNy4xNCwxMi4zMyw3LjE1LDI4LjcsMCwxNi41Ni03LjE1LDI4Ljc5YTQ4LjU1LDQ4LjU1LDAsMCwxLTE5LjY3LDE4LjgyLDY0LjM2LDY0LjM2LDAsMCwxLTU2Ljc0LDAsNDguMjksNDguMjksMCwwLDEtMTkuNzYtMTguODJxLTcuMTUtMTIuMjMtNy4xNS0yOC43OXQ3LjE1LTI4LjhhNDcuNzMsNDcuNzMsMCwwLDEsMTkuNzYtMTguNzIsNjUuMTYsNjUuMTYsMCwwLDEsNTYuNzQsMFpNNjY1LjgxLDEyNS45cS01LjA5LDUuNjUtNS4wOCwxNi4zOCwwLDEwLjkyLDUuMDgsMTYuNTZhMTYuNSwxNi41LDAsMCwwLDEyLjgsNS42NSwxNi4yLDE2LjIsMCwwLDAsMTIuNjEtNS43NHE1LjA3LTUuNzUsNS4wOC0xNi40N3QtNS4wOC0xNi4zOGExNi4zMSwxNi4zMSwwLDAsMC0xMi42MS01LjY0QTE2LjQ5LDE2LjQ5LDAsMCwwLDY2NS44MSwxMjUuOVoiIGZpbGw9InVybCgjbGluZWFyLWdyYWRpZW50LTQpIi8+PHBhdGggZD0iTTkzLjgsMTU0YTg0LjQ3LDg0LjQ3LDAsMCwxLTEwLjI5LTQxYy4yLTI3LjQ2LDEzLjI5LTQ3LjQ0LDMzLTU2Ljk1LDI1Ljc0LTEyLjM4LDQ0LjQtNi43OSw2Ni41LDguOTJBNzQuNTMsNzQuNTMsMCwwLDAsMTQ2LjM2LDcyaDBDOTgsOTMsODEuNDEsMTIzLDkzLjgsMTU0WiIgZmlsbC1ydWxlPSJldmVub2RkIiBmaWxsPSJ1cmwoI2xpbmVhci1ncmFkaWVudC01KSIvPjxwYXRoIGQ9Ik0xNDkuMTgsMTk3LjU0Yy4xNC4wNy4wNywwLDAsMGE5MS45Miw5MS45MiwwLDAsMS0xNC4yMi01LjIyQTg5LjUxLDg5LjUxLDAsMCwxLDkzLjgsMTU0QzgxLjQxLDEyMyw5OCw5MywxNDYuMzUsNzJoMGMtNDMuOTQsMjAuNTEtNjguNjMsNzkuODctMTAuOTEsMTE3LjcxQTEyNy41LDEyNy41LDAsMCwwLDE0OS4xOCwxOTcuNTRaIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGZpbGw9InVybCgjbGluZWFyLWdyYWRpZW50LTYpIi8+PHBhdGggZD0iTTEzMSwxNDAuMzZjMjYuMTMsMzkuOTQsODkuMDcsMjcsMTE3LTguOTIsOS4xLTExLjcxLDE0LjQ4LTI1Ljg2LDEzLjYyLTQxLjQxYTg0LDg0LDAsMCwxLC41OCw0NC44Miw4Niw4NiwwLDAsMS01LjEsMTQuMTlDMjI2LjU1LDE5NC42NCwxNjIuNjksMTk0Ljg0LDEzMSwxNDAuMzZaIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGZpbGw9InVybCgjbGluZWFyLWdyYWRpZW50LTcpIi8+PHBhdGggZD0iTTIxOC41OSwxODkuNzZjLTcxLDM4LjQzLTEzMy4yMy0zMS40NS05NC4zNy04Ny44NWE0OS42MSw0OS42MSwwLDAsMCw1LjE2LDM1Ljg2cS43NiwxLjMyLDEuNTksMi41OGgwYzMxLjcxLDU0LjQ4LDk1LjU3LDU0LjI4LDEyNi4wNyw4LjY4QTg4LjgyLDg4LjgyLDAsMCwxLDIxOC41OSwxODkuNzZaIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGZpbGw9InVybCgjbGluZWFyLWdyYWRpZW50LTgpIi8+PHBhdGggZD0iTTIyNi40NywxMTcuMzNjMTAuOC00Ni4wNy00My4yMi03OS44Mi04OS4yNS03My40Ny0xNSwyLjA3LTI5LjE5LDguNDEtNDAsMjBhODguNDEsODguNDEsMCwwLDEsMzIuNDUtMzIuMDksOTIuNDYsOTIuNDYsMCwwLDEsMTQtNi41NkMxOTguNjgsMTMuNzYsMjQ0LDU3LjE4LDIyNi40NywxMTcuMzNaIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGZpbGw9InVybCgjbGluZWFyLWdyYWRpZW50LTkpIi8+PHBhdGggZD0iTTIwMC43NCwyMi42NGM3OC4zMywyMS4yMiw3MS4xNSwxMTMuMTIsMi4zMywxMjYuNDksMCwwLDE2Ljg5LTkuMTUsMjIuNjMtMjguODcuMjktMSwuNTQtMiwuNzctMi45MmgwQzI0NCw1Ny4xOCwxOTguNjgsMTMuNzYsMTQzLjY5LDI1LjJBOTQuMDUsOTQuMDUsMCwwLDEsMjAwLjc0LDIyLjY0WiIgZmlsbC1ydWxlPSJldmVub2RkIiBmaWxsPSJ1cmwoI2xpbmVhci1ncmFkaWVudC0xMCkiLz48L3N2Zz4=');

DROP TABLE IF EXISTS `Licenses`;
CREATE TABLE `Licenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product` varchar(255) NOT NULL,
  `vendor` varchar(255) NOT NULL,
  `renewalDate` date DEFAULT NULL,
  `seatsOwned` int NOT NULL DEFAULT '0',
  `seatsUsed` int NOT NULL DEFAULT '0',
  `status` varchar(255) DEFAULT NULL,
  `compliance` varchar(255) DEFAULT NULL,
  `notes` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `Licenses` (`id`, `product`, `vendor`, `renewalDate`, `seatsOwned`, `seatsUsed`, `status`, `compliance`, `notes`, `createdAt`, `updatedAt`) VALUES (1, 'Microsoft Office 365', 'Alligient', '2026-03-18', 160, 148, 'Good', 'Good', '', '2026-01-31 10:06:25', '2026-01-31 10:06:25');

DROP TABLE IF EXISTS `Locations`;
CREATE TABLE `Locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `country` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `headcount` int DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `Locations` (`id`, `name`, `city`, `country`, `address`, `headcount`, `createdAt`, `updatedAt`) VALUES (1, 'GBP', 'Gurugram', 'India', 'GBP', 0, '2026-01-19 11:52:27', '2026-01-19 11:52:27');
INSERT INTO `Locations` (`id`, `name`, `city`, `country`, `address`, `headcount`, `createdAt`, `updatedAt`) VALUES (2, 'Hyderabad', 'Hyderabad', 'India', '', 0, '2026-02-02 08:39:52', '2026-02-02 08:39:52');
INSERT INTO `Locations` (`id`, `name`, `city`, `country`, `address`, `headcount`, `createdAt`, `updatedAt`) VALUES (4, 'Test', 'Test', 'India', 'Hyderabad', 0, '2026-02-13 06:37:46', '2026-02-17 12:21:27');

DROP TABLE IF EXISTS `NotificationSettings`;
CREATE TABLE `NotificationSettings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `emailAlerts` tinyint(1) DEFAULT '1',
  `weeklyReport` tinyint(1) DEFAULT '0',
  `securityAlerts` tinyint(1) DEFAULT '1',
  `maintenanceReminders` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `assetAllocation` tinyint(1) DEFAULT '1',
  `assetReturn` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `NotificationSettings` (`id`, `emailAlerts`, `weeklyReport`, `securityAlerts`, `maintenanceReminders`, `createdAt`, `updatedAt`, `assetAllocation`, `assetReturn`) VALUES (1, 1, 1, 1, 1, '2026-01-27 12:27:13', '2026-02-21 08:21:20', 1, 1);

DROP TABLE IF EXISTS `Organizations`;
CREATE TABLE `Organizations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT 'My Company',
  `taxId` varchar(255) DEFAULT NULL,
  `address` text,
  `contactEmail` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `Organizations` (`id`, `name`, `taxId`, `address`, `contactEmail`, `createdAt`, `updatedAt`) VALUES (1, 'OFB Tech Limited', NULL, 'Gurugram', 'manish@ofbusiness.in', '2026-01-23 05:07:26', '2026-01-23 05:08:21');
INSERT INTO `Organizations` (`id`, `name`, `taxId`, `address`, `contactEmail`, `createdAt`, `updatedAt`) VALUES (2, 'My Organization', NULL, NULL, NULL, '2026-01-23 05:07:26', '2026-01-23 05:07:26');

DROP TABLE IF EXISTS `ReportSchedules`;
CREATE TABLE `ReportSchedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `reportType` varchar(255) NOT NULL,
  `entityCode` varchar(255) DEFAULT NULL,
  `frequency` varchar(255) NOT NULL,
  `time` varchar(5) NOT NULL DEFAULT '08:00',
  `dayOfWeek` int DEFAULT NULL,
  `dayOfMonth` int DEFAULT NULL,
  `recipients` text NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `lastRun` datetime DEFAULT NULL,
  `nextRun` datetime DEFAULT NULL,
  `lastStatus` varchar(255) DEFAULT NULL,
  `lastError` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `ReportSchedules` (`id`, `name`, `reportType`, `entityCode`, `frequency`, `time`, `dayOfWeek`, `dayOfMonth`, `recipients`, `enabled`, `lastRun`, `nextRun`, `lastStatus`, `lastError`, `createdAt`, `updatedAt`) VALUES (1, 'Asset inventory', 'assets', 'OXYZO', 'weekly', '07:30', 0, NULL, '["manish@ofbusiness.in","it-team@ofbusiness.in"]', 1, '2026-02-22 04:54:43', '2026-03-01 02:00:00', 'success', NULL, '2026-02-21 12:01:33', '2026-02-22 04:54:43');

DROP TABLE IF EXISTS `Roles`;
CREATE TABLE `Roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `permissions` json DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `entityPermissions` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `name_4` (`name`),
  UNIQUE KEY `name_5` (`name`),
  UNIQUE KEY `name_6` (`name`),
  UNIQUE KEY `name_7` (`name`),
  UNIQUE KEY `name_8` (`name`),
  UNIQUE KEY `name_9` (`name`),
  UNIQUE KEY `name_10` (`name`),
  UNIQUE KEY `name_11` (`name`),
  UNIQUE KEY `name_12` (`name`),
  UNIQUE KEY `name_13` (`name`),
  UNIQUE KEY `name_14` (`name`),
  UNIQUE KEY `name_15` (`name`),
  UNIQUE KEY `name_16` (`name`),
  UNIQUE KEY `name_17` (`name`),
  UNIQUE KEY `name_18` (`name`),
  UNIQUE KEY `name_19` (`name`),
  UNIQUE KEY `name_20` (`name`),
  UNIQUE KEY `name_21` (`name`),
  UNIQUE KEY `name_22` (`name`),
  UNIQUE KEY `name_23` (`name`),
  UNIQUE KEY `name_24` (`name`),
  UNIQUE KEY `name_25` (`name`),
  UNIQUE KEY `name_26` (`name`),
  UNIQUE KEY `name_27` (`name`),
  UNIQUE KEY `name_28` (`name`),
  UNIQUE KEY `name_29` (`name`),
  UNIQUE KEY `name_30` (`name`),
  UNIQUE KEY `name_31` (`name`),
  UNIQUE KEY `name_32` (`name`),
  UNIQUE KEY `name_33` (`name`),
  UNIQUE KEY `name_34` (`name`),
  UNIQUE KEY `name_35` (`name`),
  UNIQUE KEY `name_36` (`name`),
  UNIQUE KEY `name_37` (`name`),
  UNIQUE KEY `name_38` (`name`),
  UNIQUE KEY `name_39` (`name`),
  UNIQUE KEY `name_40` (`name`),
  UNIQUE KEY `name_41` (`name`),
  UNIQUE KEY `name_42` (`name`),
  UNIQUE KEY `name_43` (`name`),
  UNIQUE KEY `name_44` (`name`),
  UNIQUE KEY `name_45` (`name`),
  UNIQUE KEY `name_46` (`name`),
  UNIQUE KEY `name_47` (`name`),
  UNIQUE KEY `name_48` (`name`),
  UNIQUE KEY `name_49` (`name`),
  UNIQUE KEY `name_50` (`name`),
  UNIQUE KEY `name_51` (`name`),
  UNIQUE KEY `name_52` (`name`),
  UNIQUE KEY `name_53` (`name`),
  UNIQUE KEY `name_54` (`name`),
  UNIQUE KEY `name_55` (`name`),
  UNIQUE KEY `name_56` (`name`),
  UNIQUE KEY `name_57` (`name`),
  UNIQUE KEY `name_58` (`name`),
  UNIQUE KEY `name_59` (`name`),
  UNIQUE KEY `name_60` (`name`),
  UNIQUE KEY `name_61` (`name`),
  UNIQUE KEY `name_62` (`name`),
  UNIQUE KEY `name_63` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `Roles` (`id`, `name`, `description`, `permissions`, `createdAt`, `updatedAt`, `entityPermissions`) VALUES (1, 'Test IT  Team', '', 'assets,employees', '2026-02-10 13:30:51', '2026-02-10 13:30:51', NULL);

DROP TABLE IF EXISTS `SoftwareAssignments`;
CREATE TABLE `SoftwareAssignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employeeId` varchar(255) NOT NULL,
  `employeeName` varchar(255) DEFAULT NULL,
  `employeeEmail` varchar(255) DEFAULT NULL,
  `softwareLicenseId` int NOT NULL,
  `assignedAt` datetime NOT NULL,
  `notes` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `SoftwareLicenses`;
CREATE TABLE `SoftwareLicenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product` varchar(255) NOT NULL,
  `vendor` varchar(255) NOT NULL,
  `version` varchar(255) DEFAULT NULL,
  `licenseKey` varchar(255) DEFAULT NULL,
  `seatsOwned` int NOT NULL DEFAULT '0',
  `seatsUsed` int NOT NULL DEFAULT '0',
  `renewalDate` date DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `SystemPreferences`;
CREATE TABLE `SystemPreferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `maxAssetsPerEmployee` int NOT NULL DEFAULT '2',
  `allocationWarningMessage` text NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `overuseProtectionEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `autoRenewalReviewEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `auditTrailEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `autoBackupEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `backupFrequency` varchar(255) NOT NULL DEFAULT 'daily',
  `backupTime` varchar(255) NOT NULL DEFAULT '02:00',
  `backupRetentionDays` int NOT NULL DEFAULT '30',
  `backupType` varchar(255) NOT NULL DEFAULT 'both',
  `backupLocation` varchar(255) NOT NULL DEFAULT './backups',
  `fiscalYearStart` varchar(255) NOT NULL DEFAULT 'April',
  `depreciationMethod` varchar(255) NOT NULL DEFAULT 'Straight Line',
  `defaultUsefulLife` int NOT NULL DEFAULT '36',
  `salvageValuePercent` int NOT NULL DEFAULT '5',
  `capexThreshold` int NOT NULL DEFAULT '50000',
  `passwordMinLength` int NOT NULL DEFAULT '10',
  `passwordRequireUpper` tinyint(1) NOT NULL DEFAULT '1',
  `passwordRequireLower` tinyint(1) NOT NULL DEFAULT '1',
  `passwordRequireNumber` tinyint(1) NOT NULL DEFAULT '1',
  `passwordRequireSpecial` tinyint(1) NOT NULL DEFAULT '1',
  `passwordExpiryDays` int NOT NULL DEFAULT '90',
  `passwordReuseLimit` int NOT NULL DEFAULT '5',
  `passwordLockoutAttempts` int NOT NULL DEFAULT '5',
  `allowedLoginDomains` text,
  `passwordMaxLength` int NOT NULL DEFAULT '128',
  `passwordLockoutDurationMins` int NOT NULL DEFAULT '15',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `SystemPreferences` (`id`, `maxAssetsPerEmployee`, `allocationWarningMessage`, `createdAt`, `updatedAt`, `overuseProtectionEnabled`, `autoRenewalReviewEnabled`, `auditTrailEnabled`, `autoBackupEnabled`, `backupFrequency`, `backupTime`, `backupRetentionDays`, `backupType`, `backupLocation`, `fiscalYearStart`, `depreciationMethod`, `defaultUsefulLife`, `salvageValuePercent`, `capexThreshold`, `passwordMinLength`, `passwordRequireUpper`, `passwordRequireLower`, `passwordRequireNumber`, `passwordRequireSpecial`, `passwordExpiryDays`, `passwordReuseLimit`, `passwordLockoutAttempts`, `allowedLoginDomains`, `passwordMaxLength`, `passwordLockoutDurationMins`) VALUES (1, 2, 'This employee already has 1 asset allocated. Do you want to allow a second asset?', '2026-02-02 10:23:50', '2026-02-25 12:12:06', 1, 1, 1, 0, 'daily', '02:00', 30, 'both', './backups', 'April', 'Straight Line', 60, 5, 50000, 10, 1, 1, 1, 1, 90, 5, 5, 'ofbusiness.in', 128, 15);

DROP TABLE IF EXISTS `Users`;
CREATE TABLE `Users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) DEFAULT 'employee',
  `status` varchar(255) DEFAULT 'Active',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `allowedEntities` text,
  `entityPermissions` text,
  `phone` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `failedLoginAttempts` int NOT NULL DEFAULT '0',
  `lockedUntil` datetime DEFAULT NULL,
  `lastPasswordChange` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `email_25` (`email`),
  UNIQUE KEY `email_26` (`email`),
  UNIQUE KEY `email_27` (`email`),
  UNIQUE KEY `email_28` (`email`),
  UNIQUE KEY `email_29` (`email`),
  UNIQUE KEY `email_30` (`email`),
  UNIQUE KEY `email_31` (`email`),
  UNIQUE KEY `email_32` (`email`),
  UNIQUE KEY `email_33` (`email`),
  UNIQUE KEY `email_34` (`email`),
  UNIQUE KEY `email_35` (`email`),
  UNIQUE KEY `email_36` (`email`),
  UNIQUE KEY `email_37` (`email`),
  UNIQUE KEY `email_38` (`email`),
  UNIQUE KEY `email_39` (`email`),
  UNIQUE KEY `email_40` (`email`),
  UNIQUE KEY `email_41` (`email`),
  UNIQUE KEY `email_42` (`email`),
  UNIQUE KEY `email_43` (`email`),
  UNIQUE KEY `email_44` (`email`),
  UNIQUE KEY `email_45` (`email`),
  UNIQUE KEY `email_46` (`email`),
  UNIQUE KEY `email_47` (`email`),
  UNIQUE KEY `email_48` (`email`),
  UNIQUE KEY `email_49` (`email`),
  UNIQUE KEY `email_50` (`email`),
  UNIQUE KEY `email_51` (`email`),
  UNIQUE KEY `email_52` (`email`),
  UNIQUE KEY `email_53` (`email`),
  UNIQUE KEY `email_54` (`email`),
  UNIQUE KEY `email_55` (`email`),
  UNIQUE KEY `email_56` (`email`),
  UNIQUE KEY `email_57` (`email`),
  UNIQUE KEY `email_58` (`email`),
  UNIQUE KEY `email_59` (`email`),
  UNIQUE KEY `email_60` (`email`),
  UNIQUE KEY `email_61` (`email`),
  UNIQUE KEY `email_62` (`email`),
  UNIQUE KEY `email_63` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `Users` (`id`, `name`, `email`, `password`, `role`, `status`, `createdAt`, `updatedAt`, `allowedEntities`, `entityPermissions`, `phone`, `title`, `failedLoginAttempts`, `lockedUntil`, `lastPasswordChange`) VALUES (1, 'Manish Kumar Bhaskar', 'manish@ofbusiness.in', '$2a$10$NKZz/MRYfJy13WofrKtXSuFBVgGQUnKRAtpwxBwRr2MRnFcaDklRK', 'admin', 'Active', '2026-01-16 14:03:48', '2026-02-26 12:38:02', '["OFB","OXYZO"]', '{"OFB":{"assets":true,"employees":true,"reports":true,"settings":true,"notifications":true},"OXYZO":{"assets":true,"employees":true,"reports":true,"settings":true,"notifications":true}}', NULL, NULL, 0, NULL, NULL);
INSERT INTO `Users` (`id`, `name`, `email`, `password`, `role`, `status`, `createdAt`, `updatedAt`, `allowedEntities`, `entityPermissions`, `phone`, `title`, `failedLoginAttempts`, `lockedUntil`, `lastPasswordChange`) VALUES (2, 'Support', 'itsupport@ofbusiness.in', '$2a$10$mEgO5n6OR4/RbX7QsYsGa.bMYZQwF32.2DOo.41B7sb3eUnZctPJ2', 'admin', 'Active', '2026-01-29 07:08:02', '2026-02-27 06:44:39', '["OFB","OXYZO"]', '{"OFB":{"assets":true,"employees":true,"reports":true,"settings":true,"notifications":true},"OXYZO":{"assets":true,"employees":true,"reports":true,"settings":true,"notifications":true}}', NULL, NULL, 0, NULL, NULL);
INSERT INTO `Users` (`id`, `name`, `email`, `password`, `role`, `status`, `createdAt`, `updatedAt`, `allowedEntities`, `entityPermissions`, `phone`, `title`, `failedLoginAttempts`, `lockedUntil`, `lastPasswordChange`) VALUES (3, 'Shashi', 'shashi@oxyzo.in', '$2a$12$Ze.68TNLx5EzEFOq/B7wyu/cFv8E4u7g6HF60Hkn5nt.2y1XI9iMa', 'custom_1', 'Active', '2026-02-10 13:31:33', '2026-02-25 12:12:45', '["OFB"]', '{"OFB":{"assets":true,"employees":true,"reports":false,"settings":false,"notifications":false}}', NULL, NULL, 0, NULL, '2026-02-25 12:12:45');

SET FOREIGN_KEY_CHECKS = 1;
