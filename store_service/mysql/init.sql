

SET SQL_SAFE_UPDATES = 0;
CREATE DATABASE  IF NOT EXISTS `store`;
USE `store`;


/*
Table: product
Columns:
id int PK 
name varchar(45) 
description varchar(200) 
cost decimal(5,2) 
kilograms decimal(4,2) 
allergens varchar(200) 
kilojoules int 
vitamins varchar(200) 
stock int 
discount int 
image_path varchar(200)
*/

DROP TABLE IF EXISTS `product`;

CREATE TABLE `product` (

  `id` int  NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(45) NOT NULL,
  `cost` decimal(5,2)  NOT NULL,
  `kilograms` decimal(4,2)  NOT NULL,
  `allergens` varchar(200) NOT NULL,
  `kilojoules` int NOT NULL,
  `vitamins` varchar(200) NOT NULL,
  `stock` int NOT NULL,
  `discount` int NOT NULL,
  `image_path` varchar(200) NOT NULL,

  PRIMARY KEY (`id`)

) ;


LOCK TABLES `product` WRITE;
INSERT INTO `product` VALUES (101,'potato', 'product1_desc', 1, 1, 'A,B,C', 2, 'C,D', 10, 0, '/images/potato.jpg');
INSERT INTO `product` VALUES (102,'chickpeas', 'product1_desc', 1, 1, 'A,B,C', 2, 'C,D', 10, 0, './images/chickpeas.png');
INSERT INTO `product` VALUES (103,'carrot', 'product1_desc', 1, 1, 'A,B,C', 2, 'C,D', 10, 0, './images/carrot.webp');
INSERT INTO `product` VALUES (104,'eggplant', 'product1_desc', 1, 1, 'A,B,C', 2, 'C,D', 10, 0, './images/eggplant.webp');
INSERT INTO `product` VALUES (105,'brocoli', 'product1_desc', 1, 1, 'A,B,C', 2, 'C,D', 10, 0, './brocolli.png');
UNLOCK TABLES;


DROP TABLE IF EXISTS `comments`;
/*
Columns:
id int AI PK 
product_id int 
username varchar(40) 
comment text 
created_at timestamp 
user_id int
*/

CREATE TABLE `comments` (

  `id` int  NOT NULL,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `username` varchar(45) NOT NULL,
  `comment` varchar(300) NOT NULL,
  `created_at` timestamp NOT NULL,


  PRIMARY KEY (`id`)

) ;

/* /images/potato.jpg  */
LOCK TABLES `comments` WRITE;
INSERT INTO `comments` VALUES (131,101, 201, 'user1', 'comment here', '2026-11-21 13:45:19');

UNLOCK TABLES;
