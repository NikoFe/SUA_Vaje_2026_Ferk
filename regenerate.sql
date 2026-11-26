


SET SQL_SAFE_UPDATES = 0;
CREATE DATABASE  IF NOT EXISTS `notification_schema`;
USE `notification_schema`;

DROP TABLE IF EXISTS `notification`;

CREATE TABLE `notification` (

  `id` int  NOT NULL,
  `user_id` int   NOT NULL,
  `text` varchar(45) NOT NULL,
  `type` varchar(45) NOT NULL,

  PRIMARY KEY (`id`)

) ;


LOCK TABLES `notification` WRITE;
INSERT INTO `notification` VALUES (401,201,'USER SUCCESSFULY CREATED!', 'USER CREATED');
UNLOCK TABLES;

DROP TABLE IF EXISTS `notification_preference` ;

CREATE TABLE `notification_preference` (

  `id` int  NOT NULL,
  `user_id` int   NOT NULL,
  `ignored_types` varchar(900) NOT NULL,
 
  PRIMARY KEY (`id`)
) ;


LOCK TABLES `notification_preference` WRITE;
INSERT INTO `notification_preference` VALUES (441,201,'RECEIPT CREATION:false,USER 
CREATED:false,COMMENT CREATED:false,COMMENT UPDATE:false,COMMENT DELETE:false,NEW CART 
ITEM:false,CART EMPTIED:false,CART ITEM DELETED:false,CART UPDATE:false,USER UPDATE:false,
SHIPMENT START:false,SHIPMENT CANCEL:false,SHIPMENT UPDATE:false,SHIPMENT RESTART:false,SHIPMENT RECIEVED:false');
UNLOCK TABLES;

