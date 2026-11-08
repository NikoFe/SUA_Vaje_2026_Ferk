USE store;

/*ALTER TABLE product
RENAME COLUMN alergens to allergens;

ALTER TABLE product
ADD image_path  varchar(200);
*/

/*
CREATE TABLE `computer` (
  `id` int NOT NULL,
  `date_created` datetime DEFAULT NULL,
  `operating_system` varchar(30) DEFAULT NULL,
  `CPU` varchar(30) DEFAULT NULL,
  `GPU` varchar(30) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `RAM` varchar(30) DEFAULT NULL,
  `available_memory_in_GB` int DEFAULT NULL,
  `weight_in_kilograms` decimal(5,2) DEFAULT NULL,
  `laptop` tinyint(1) DEFAULT NULL,
  
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
*/

/*DROP TABLE IF EXISTS `computer`;*/

TRUNCATE TABLE product;


INSERT INTO `product` VALUES (101, "avocado", "a single avocado", 1, 0.1, "none", 350, 'A B C', 100,0,"./images/avocado.png");
INSERT INTO `product` VALUES (102, "carrot", "a single avocado", 0.5, 0.1, "none", 300, 'A B C', 200,0, "./images/carrot.webp");
INSERT INTO `product` VALUES (104, "F4", "F4 desc", 0.4, 4, "none", 400, 'A', 400,0, "./images/eggplant.webp");
INSERT INTO `product` VALUES (105, "F5", "F5 desc", 0.5, 5, "none", 500, 'B', 500,0, "./images/potato.jpg");
INSERT INTO `product` VALUES (106, "F6", "F6 desc", 0.6, 6, "none", 600, 'C', 600,0, "./images/shallot.webp");
INSERT INTO `product` VALUES (107, "F7", "F7 desc", 0.7, 7, "none", 700, 'D', 700,0, "./images/tomato.jpg");
INSERT INTO `product` VALUES (108, "F8", "F8 desc", 0.8, 8, "none", 800, 'E', 800,0, "./images/chickpeas.png");
INSERT INTO `product` VALUES (109, "F9", "F9 desc", 0.9, 9, "none", 900, 'F', 900,0, "./images/cabbage.jpg");




CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    username VARCHAR(40) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON DELETE CASCADE   
);

SELECT * FROM comments;


USE user;

DELETE  FROM users;


INSERT INTO `users` VALUES (1, "user1","user1pass", "user1@gmail.com", "user");
INSERT INTO `users` VALUES (2, "user2","user2pass", "user2@gmail.com", "user");
INSERT INTO `users` VALUES (3, "user3","user3pass", "user3@gmail.com", "admin");

USE user;
SELECT * FROM users;
SELECT * FROM cart_item;

USE store;

SELECT * FROM comments;
SELECT * FROM cart_item;


ALTER TABLE users ADD column deleted VARCHAR(10);

ALTER TABLE users
DROP COLUMN deleted;


USE notification_schema;
SELECT * FROM notification;




DELETE FROM notification;





