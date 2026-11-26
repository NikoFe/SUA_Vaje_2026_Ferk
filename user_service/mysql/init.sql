
/*OK*/

SET SQL_SAFE_UPDATES = 0;
CREATE DATABASE  IF NOT EXISTS `user`;
USE `user`;

/*
Columns:
id int PK 
username varchar(35) 
password varchar(45) 
email varchar(45) 
status varchar(35) 
deleted varchar(10)
*/


DROP TABLE IF EXISTS `users`;


CREATE TABLE `users` (

  `id` int  NOT NULL,
  `username` varchar(45)    NOT NULL,
  `password` varchar(45)  NOT NULL,
  `email` varchar(45)  NOT NULL,
  `status` varchar(45)  NOT NULL,
  `deleted` varchar(45)  NOT NULL,

  PRIMARY KEY (`id`)

) ;


LOCK TABLES `users` WRITE;

INSERT INTO `users` VALUES (201, 'user1','user1pass','user1email','user','no');
UNLOCK TABLES;



DROP TABLE IF EXISTS `cart_item`;
/*
Columns:
id int PK 
user_id int 
product_id int 
product_name varchar(45) 
amount int
*/


CREATE TABLE `cart_item` (

  `id` int  NOT NULL,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(45) NOT NULL,
  `amount` int NOT NULL,

  PRIMARY KEY (`id`)

) ;


LOCK TABLES `cart_item` WRITE;
INSERT INTO `cart_item` VALUES (231, 201,101,'product1',3);
UNLOCK TABLES;