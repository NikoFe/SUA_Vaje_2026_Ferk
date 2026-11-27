const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = 3002;

const swaggerDocs = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User Service API",
      version: "1.0.0",
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: [__filename],
});


if (process.env.NODE_ENV === "test") {
  require("dotenv").config({ path: "./.env.test" });
} else {
  require("dotenv").config({ path: "./.env" });
}

/*
const STORE_SERVICE_URL =
  process.env.STORE_SERVICE_URL || "http://localhost:3001";
const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://localhost:3003";*/
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3004";




const dbConfig = {
  host: `${process.env.DB_HOST}`,
  user: `${process.env.DB_USER}`,
  password: `${process.env.DB_PASSWORD}`,
  database: `${process.env.DB_NAME}`,
  decimalNumbers: true, // <<< ADD THIS
};
app.use(express.json());
app.use(cors());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

////////////////////////////////////////
///////////////////////////////////////
/////////CARTS:////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @swagger
 * /cart:
 *   post:
 *     tags: [Cart]
 *     summary: Create a bunch of new cart items 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, product_id, product_name, amount]
 *             properties:
 *               user_id:
 *                 type: number
 *               product_id:
 *                 type: number
 *               product_name:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       '200':
 *         description: Success, cart item created
 *       '400':
 *         description: Error in creating cart
 *       '500':
 *         description: Failed to create cart
 */






app.post("/cart", async (req, res) => {

  console.log("cart creation in process");
  const { user_id, product_id, product_name, amount } = req.body;

  let connection;

  try {
    const id = Math.floor(Math.random() * 100000);
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `
    INSERT INTO cart_item VALUES (?,? ,?, ?, ?);
    `,
      [id, user_id, product_id, product_name, amount],
    );

    if (rows.length == 0) {
    return res.status(400).json({ error: "Error in creating cart" });
      //return "ERROR";
    }
    ////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
    ////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
    ////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
    await fetch(`${NOTIFICATION_SERVICE_URL}/notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user_id,
        text: "ADDING NEW ELEMENT TO CART!",
        type: "NEW CART ITEM",
        marked_needed_to_delete: 0,
      }),
    });
    ////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
    ////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
    ////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
    console.log("element: ", rows[0]);
   return  res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error creating cart:", error);
    return res.status(500).json({ error: "Failed to create cart" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @swagger
 * /cart/{user_id}:
 *   get:
 *     tags: [Cart]
 *     summary: Get a cart by user ID
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int32
 *     responses:
 *       '200':
 *         description: Cart items with the valid user id 
 *       '401':
 *         description: A valid user_id is required
 *       '500':
 *         description: Unable to get cart
 */


app.get("/cart/:user_id", async (req, res) => {


  console.log("GETTIGN CART ITEMS!");
  const user_id = parseInt(req.params.user_id);

    if (user_id === null) {
    return res.status(401).json({ error: "A valid user_id is required" });
  }

  let connection;
  try {
  connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute(
    `
    SELECT * FROM cart_item WHERE user_id= ?;
    `,
    [user_id],
  );
  console.log("CCCCART: ", rows);

  return res.status(200).json(rows);
  } catch (error) {
    console.error("Error getting cart:", error);
    return res.status(500).json({ error: "Unable to get cart" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * @swagger
 * /status/{user_id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user's account status
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: User status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *       '401':
 *         description: Invalid user ID
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Unable to get user status
 */
app.get("/status/:user_id", async (req, res) => {
  const id = Number(req.params.user_id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(401).json({ error: "A valid user_id is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT status FROM users WHERE id = ? LIMIT 1",
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ status: rows[0].status });
  } catch (error) {
    console.error("Error getting user status:", error);
    return res.status(500).json({ error: "Unable to get user status" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * @swagger
 * /cart/all/{user_id}:
 *   delete:
 *     tags: [Cart]
 *     summary: Delete all cart items for a user
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Cart items deleted (deleted is zero when the cart is empty)
 *       '401':
 *         description: Invalid user ID
 *       '500':
 *         description: Unable to clear cart
 */
app.delete("/cart/all/:user_id", async (req, res) => {

  console.log("DELETEING EVERYTHING FROM CART!");
  const user_id = Number.parseInt(req.params.user_id, 10);
  if (Number.isNaN(user_id)) {
    return res.status(401).json({ error: "Invalid user ID" });
  }

  let connection;
  try {
  connection = await mysql.createConnection(dbConfig);
  const [result] = await connection.execute(
    "DELETE FROM cart_item WHERE user_id = ?",
    [user_id],
  );

    if (result.length === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }
  ////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
  ////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
  ////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
  await fetch(`${NOTIFICATION_SERVICE_URL}/notification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: user_id,
      text: "CART SUCCESSFULY CLEARED!",
      type: "CART EMPTIED",
      marked_needed_to_delete: 0,
    }),
  });
  ////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
  ////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
  ////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/

  return res.status(200).json({ deleted: result.affectedRows });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return res.status(500).json({ error: "Error clearing cart!" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }

});

/**
 * @swagger
 * /cart/single/{cart_item_id}:
 *   delete:
 *     tags: [Cart]
 *     summary: Delete one cart item by ID
 *     parameters:
 *       - in: path
 *         name: cart_item_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Cart item deleted
 *       '400':
 *         description: Invalid cart item ID
 *       '404':
 *         description: Cart item not found
 *       '500':
 *         description: Unable to delete cart item
 */
app.delete("/cart/single/:cart_item_id", async (req, res) => {
  const cartItemId = Number.parseInt(req.params.cart_item_id, 10);
  if (!Number.isSafeInteger(cartItemId) || cartItemId <= 0) {
    return res.status(400).json({ error: "A valid cart_item_id is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "DELETE FROM cart_item WHERE id = ?",
      [cartItemId],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    return res.status(200).json({ deleted: result.affectedRows });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    return res.status(500).json({ error: "Unable to delete cart item" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * @swagger
 * /cart/{user_id}:
 *   delete:
 *     tags: [Cart]
 *     summary: Delete all cart items for a user
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Number of deleted cart items
 *       '400':
 *         description: Invalid user ID
 *       '500':
 *         description: Unable to delete cart items
 */
app.delete("/cart/:user_id", async (req, res) => {
  const userId = Number.parseInt(req.params.user_id, 10);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "A valid user_id is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "DELETE FROM cart_item WHERE user_id = ?",
      [userId],
    );

    if (result.affectedRows > 0) {
      await fetch(`${NOTIFICATION_SERVICE_URL}/notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          text: "CART ITEM SUCCESSFULY DELETED!",
          type: "CART ITEM DELETED",
          marked_needed_to_delete: 0,
        }),
      });
    }

    return res.status(200).json({ deleted: result.affectedRows });
  } catch (error) {
    console.error("Error deleting cart:", error);
    return res.status(500).json({ error: "Unable to delete cart items" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

////COMMUNICATION//// UPDATE CART ITEM
/**
 * @swagger
 * /cart:
 *   put:
 *     tags: [Cart]
 *     summary: Add the requested amount to an existing cart item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, product_id, amount]
 *             properties:
 *               user_id:
 *                 type: integer
 *               product_id:
 *                 type: integer
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       '200':
 *         description: Cart update result
 *       '400':
 *         description: Invalid request data
 *       '500':
 *         description: Unable to update cart
 */
app.put("/cart", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "A JSON request body is required" });
  }

  const userId = Number(req.body.user_id);
  const productId = Number(req.body.product_id);
  const amount = Number(req.body.amount);

  console.log("PUT USER ID:",userId );
  console.log("PUT PRODUCT ID:",productId );
  console.log("PUT AMOUNT:",amount );


  if (
    
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    !Number.isSafeInteger(productId) ||
    productId <= 0 ||
    !Number.isSafeInteger(amount) ||
    amount <= 0
  ) {
    return res.status(400).json({ error: "Valid user_id, product_id, and amount are required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM cart_item WHERE product_id = ? AND user_id = ?",
      [productId, userId],
    );

    /*
    if (rows.length === 0) {
    return res.status(200).json(rows);
    //  return res.status(404).json({ error: "Cart item not found" });
    }*/

    if(rows.length>0){
    const newAmount = Number(rows[0].amount) + amount;
    await connection.execute(
      "UPDATE cart_item SET amount = ? WHERE product_id = ? AND user_id = ?",
      [newAmount, productId, userId],
    );

    await fetch(`${NOTIFICATION_SERVICE_URL}/notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        text: "CART SUCCESSFULY UPDATED!",
        type: "CART UPDATE",
        marked_needed_to_delete: 0,
      }),
    });
    }


    return res.status(200).json({ count: rows.length });
  } catch (error) {
    console.error("Error updating cart:", error);
    return res.status(500).json({ error: "Unable to update cart" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

//////////////////////////////
//////////////////////////////
//////////////////////////////

/**
 * @swagger
 * /{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get public details for a user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: User details
 *       '400':
 *         description: Invalid user ID
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Unable to get user
 */
app.get("/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: "A valid user ID is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT id, username, email,password, status FROM users WHERE id = ?",
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error getting user:", error);
    return res.status(500).json({ error: "Unable to get user" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * @swagger
 * /validate:
 *   post:
 *     tags: [Users]
 *     summary: Validate a username and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       '200':
 *         description: Matching user details, or an empty array for invalid credentials
 *       '400':
 *         description: Username or password is missing
 *       '500':
 *         description: Unable to validate user
 */
app.post("/validate", async (req, res) => {
  if (
    !req.body ||
    typeof req.body.username !== "string" ||
    !req.body.username.trim() ||
    typeof req.body.password !== "string" ||
    !req.body.password
  ) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  const { username, password } = req.body;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT id, username, email FROM users WHERE username = ? AND password = ?",
      [username.trim(), password],
    );

    if (rows.length === 0) {
      return res.status(200).json([]);
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error validating user:", error);
    return res.status(500).json({ error: "Unable to validate user" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * @swagger
 * /create:
 *   post:
 *     tags: [Users]
 *     summary: Create a user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, username, email, password]
 *             properties:
 *               id:
 *                 type: integer
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       '201':
 *         description: User created
 *       '400':
 *         description: Invalid user details
 *       '409':
 *         description: Username or email already exists
 *       '500':
 *         description: Unable to create user
 */
app.post("/create", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "A JSON request body is required" });
  }

  const { id, username, email, password } = req.body;
  const userId = Number(id);
  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    typeof username !== "string" ||
    !username.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return res.status(400).json({ error: "Valid user details are required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [existingUsers] = await connection.execute(
      "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
      [username.trim(), email.trim()],
    );
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    const [result] = await connection.execute(
      'INSERT INTO users VALUES (?, ?, ?, ?, "user", 0)',
      [userId, username.trim(), password, email.trim()],
    );

    await fetch(`${NOTIFICATION_SERVICE_URL}/notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        text: "USER SUCCESSFULY CREATED!",
        type: "USER CREATED",
        marked_needed_to_delete: 0,
      }),
    });
    await fetch(`${NOTIFICATION_SERVICE_URL}/notification_preferences/${userId}`, {
      method: "POST",
    });

    return res.status(201).json({ output: result });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Unable to create user" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * @swagger
 * /{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update a user's account details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, email]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       '200':
 *         description: User updated
 *       '400':
 *         description: Invalid user details or ID
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Unable to update user
 */
app.put("/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: "A valid user ID is required" });
  }
  if (
    !req.body ||
    typeof req.body !== "object" ||
    Array.isArray(req.body) ||
    typeof req.body.username !== "string" ||
    !req.body.username.trim() ||
    typeof req.body.password !== "string" ||
    !req.body.password ||
    typeof req.body.email !== "string" ||
    !req.body.email.trim()
  ) {
    return res.status(400).json({ error: "Valid user details are required" });
  }

  const { username, password, email } = req.body;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute(
      "SELECT id FROM users WHERE id = ? LIMIT 1",
      [id],
    );
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const [result] = await connection.execute(
      "UPDATE users SET username = ?, password = ?, email = ? WHERE id = ?",
      [username.trim(), password, email.trim(), id],
    );

    await fetch(`${NOTIFICATION_SERVICE_URL}/notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: id,
        text: "USER SUCCESSFULY UPDATED!",
        type: "USER UPDATE",
        marked_needed_to_delete: 0,
      }),
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Unable to update user" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
