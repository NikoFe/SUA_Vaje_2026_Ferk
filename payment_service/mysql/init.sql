

SET SQL_SAFE_UPDATES = 0;
CREATE DATABASE  IF NOT EXISTS `payment`;
USE `payment`;



DROP TABLE IF EXISTS `receipt`;


CREATE TABLE `receipt` (

  `id` int  NOT NULL,
  `user_id` int   NOT NULL,
  `date` date NOT NULL,
  `amount` int NOT NULL,

  PRIMARY KEY (`id`)

) ;


LOCK TABLES `receipt` WRITE;
INSERT INTO `receipt` VALUES (301,201,'2026-11-23	3', 3);
UNLOCK TABLES;


DROP TABLE IF EXISTS `receipt_item`;

CREATE TABLE `receipt_item` (

  `id` int  NOT NULL,
  `product_id` int   NOT NULL,
  `receipt_id` int NOT NULL,
  `amount` int NOT NULL,

  PRIMARY KEY (`id`)

) ;

LOCK TABLES `receipt_item` WRITE;
INSERT INTO `receipt_item` VALUES (331, 301,201, 3);
UNLOCK TABLES;

/*
Table: shipment
Columns:
id int PK 
user_id int 
receipt_id int 
status varchar(45) 
start_date datetime 
location varchar(45) 
target_location varchar(45)
*/


DROP TABLE IF EXISTS `shipment`;

CREATE TABLE `shipment` (

  `id` int  NOT NULL,
  `user_id` int   NOT NULL,
  `receipt_id` int NOT NULL,
  `status` varchar(45)  NOT NULL,
  `start_date` datetime NOT NULL,
  `location`varchar(100) ,
  `target_location` varchar(100),

  PRIMARY KEY (`id`)

) ;

LOCK TABLES `shipment` WRITE;
INSERT INTO `shipment` VALUES (361, 201,301, 'BEING DELIVERED', '2026-11-24 20:35:25', '-29.575998, -37.950226','8.099300, -42.173658');
UNLOCK TABLES;