const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { randomInt } = require("node:crypto");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = 3003;

const STORE_SERVICE_URL =
  process.env.STORE_SERVICE_URL || "http://localhost:3001";
const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:3002";
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3004";



const swaggerDocs = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Payment Service API",
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

const userServiceUrl = process.env.USER_SERVICE_URL || "http://localhost:3002";
const targetLocations = [
  "Ljubljana",
  "Maribor",
  "Celje",
  "Koper",
  "Kranj",
];

function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function shipmentExists(connection, receiptId) {
  const [rows] = await connection.execute(
    "SELECT id FROM shipment WHERE receipt_id = ? LIMIT 1",
    [receiptId]
  );
  return rows.length > 0;
}

function randomLocation() {
  return `${(Math.random() * 180 - 90).toFixed(6)}, ${(Math.random() * 360 - 180).toFixed(6)}`;
}


//COMMUNICATION//
//THIS IS WHERE CHECKOUT HAPPENS
/**
 * @swagger
 * /receipt/{user_id}:
 *   post:
 *     tags: [Checkout]
 *     summary: Create a receipt from the user's cart
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '201':
 *         description: Receipt created, with the purchased cart items
 *       '400':
 *         description: Invalid user ID, empty cart, or invalid totals
 *       '409':
 *         description: A cart product is missing or stock is insufficient
 *       '500':
 *         description: Unable to save the receipt
 *       '502':
 *         description: User or store service unavailable or returned invalid data
 */
app.post("/receipt/:user_id", async (req, res) => {
  const userId = parseId(req.params.user_id);
  if (!userId) {
    return res.status(400).json({ error: "A valid user_id is required" });
  }

  try {
  const response = await fetch(
    `${USER_SERVICE_URL}/cart/${encodeURIComponent(userId)}`,
  );
  //const result = await response.json();
  //return res.status(response.status).json(result);

  if (!response.ok) {
    console.error("Failed to get cart items:", response.status);
    return res.status(502).json({ error: "Unable to load cart items" });
  }

  const cartItems = await response.json();
  if (!Array.isArray(cartItems)) {
    return res.status(502).json({ error: "Cart service returned invalid data" });
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: "Your cart is empty" });
   // throw new Error("Your cart is empty.");
  }

  //FROM THE CART, CHECK FOR EACH PRODUCT IN STORE EXISTS AND HAS A HIGH ENOUGH STOCK COUNT

  let totalMoneyAmount = 0;
  let totalAmount = 0;
  for (const item of cartItems) {
    const productId = parseId(item.product_id);
    const amount = parseId(item.amount);
    if (!productId || !amount) {
      return res.status(502).json({ error: "Cart service returned invalid items" });
    }

    const individualResponse = await fetch(
      `${STORE_SERVICE_URL}/${encodeURIComponent(productId)}`,
    );
    if (individualResponse.status === 404) {
      return res.status(409).json({ error: "A product in your cart no longer exists" });
    }
    if (!individualResponse.ok) {
      return res.status(502).json({ error: "Store service unavailable" });
    }

    const products = await individualResponse.json();
    const product = Array.isArray(products) ? products[0] : null;
    if (
      !product ||
      !Number.isFinite(Number(product.stock)) ||
      !Number.isFinite(Number(product.cost))
    ) {
      return res.status(502).json({ error: "Store service returned invalid data" });
    }
    if (amount > Number(product.stock)) {
      return res.status(409).json({ error: "Not enough items in stock" });
    }

    totalAmount += amount;
    totalMoneyAmount += Number(product.cost) * amount;
  }

  if (
    !Number.isSafeInteger(totalAmount) ||
    totalAmount <= 0 ||
    !Number.isFinite(totalMoneyAmount) ||
    totalMoneyAmount <= 0
  ) {
    return res.status(400).json({ error: "Cart totals are invalid" });
  }


  for (const item of cartItems) {
    const productId = parseId(item.product_id);
    const amount = parseId(item.amount);
    const individualResponse = await fetch(
      `${STORE_SERVICE_URL}/${encodeURIComponent(productId)}`,
    );
    if (!individualResponse.ok) {
      return res.status(502).json({ error: "Store service unavailable" });
    }

    const products = await individualResponse.json();
    const product = Array.isArray(products) ? products[0] : null;
    if (!product || !Number.isFinite(Number(product.stock))) {
      return res.status(502).json({ error: "Store service returned invalid data" });
    }

    const updatedStock = await fetch(
      `${STORE_SERVICE_URL}/stock/${encodeURIComponent(productId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_amount: Number(product.stock) - amount,
        }),
      },
    );
    if (!updatedStock.ok) {
      console.error("Error updating stock:", updatedStock.status);
      return res.status(502).json({ error: "Unable to update stock" });
    }
  }

  const deleteResponse = await fetch(
    `${USER_SERVICE_URL}/cart/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
  if (!deleteResponse.ok) {
    console.error("Error clearing cart:", deleteResponse.status);
    return res.status(502).json({ error: "Unable to clear cart" });
  }

  const id = randomInt(1, 2147483647);
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      "INSERT INTO receipt (id, user_id, `date`, amount) VALUES (?, ?, CURRENT_DATE(), ?)",
      [id, userId, totalMoneyAmount]
    );

////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
      try {
        const notificationResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/notification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            text: "RECEIPT SUCCESSFULY CREATED!",
            type: "RECEIPT CREATION",
            marked_needed_to_delete: 0,
          }),
        });
        if (!notificationResponse.ok) {
          console.error(
            "Notification service rejected receipt notification:",
            notificationResponse.status,
          );
        }
      } catch (notificationError) {
        console.error("Unable to notify about receipt creation:", notificationError);
      }
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/


  
    //return res.status(201).json({ id });
    console.log("SUCCESSFUL CREATION!");
    return res.status(201).json({ cartItems: cartItems, id:id});



  } catch (error) {
    console.error("Error creating receipt:", error);
    return res.status(500).json({ error: "Unable to create receipt" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
  } catch (error) {
    console.error("Error contacting checkout services:", error);
    return res.status(502).json({ error: "Checkout service unavailable" });
  }
});

/**
 * @swagger
 * /receipt_item:
 *   post:
 *     tags: [Receipts]
 *     summary: Add a product item to a receipt
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, receipt_id, amount]
 *             properties:
 *               product_id:
 *                 type: integer
 *               receipt_id:
 *                 type: integer
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       '201':
 *         description: Receipt item created
 *       '400':
 *         description: Invalid request body or item details
 *       '500':
 *         description: Unable to create receipt item
 */
app.post("/receipt_item/", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "A JSON request body is required" });
  }

  const productId = parseId(req.body.product_id);
  const receiptId = parseId(req.body.receipt_id);
  const amount = parseId(req.body.amount);
  if (!productId || !receiptId || !amount) {
    return res.status(400).json({
      error: "Valid product_id, receipt_id, and positive integer amount are required",
    });
  }

  const id = randomInt(1, 2147483647);
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      "INSERT INTO receipt_item (id, product_id, receipt_id, amount) VALUES (?, ?, ?, ?)",
      [id, productId, receiptId, amount]
    );

    return res.status(201).json({ id, product_id: productId, receipt_id: receiptId, amount });
  } catch (error) {
    console.error("Error creating receipt item:", error);
    return res.status(500).json({ error: "Unable to create receipt item" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * @swagger
 * /shipment:
 *   post:
 *     tags: [Shipments]
 *     summary: Create a shipment for a user's receipt
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, receipt_id]
 *             properties:
 *               user_id:
 *                 type: integer
 *               receipt_id:
 *                 type: integer
 *     responses:
 *       '201':
 *         description: Shipment created
 *       '400':
 *         description: Invalid request body or IDs
 *       '404':
 *         description: Receipt not found for this user
 *       '500':
 *         description: Unable to create shipment
 */
app.post("/shipment", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "A JSON request body is required" });
  }

  const userId = parseId(req.body.user_id);
  const receiptId = parseId(req.body.receipt_id);

  if (!userId || !receiptId) {
    return res.status(400).json({ error: "Valid user_id and receipt_id are required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [receipts] = await connection.execute(
      "SELECT id FROM receipt WHERE id = ? AND user_id = ?",
      [receiptId, userId]
    );
    if (receipts.length === 0) {
      return res.status(404).json({ error: "Receipt not found for this user" });
    }

    const id = randomInt(1, 2147483647);
    await connection.execute(
      `INSERT INTO shipment
         (id, user_id, receipt_id, status, start_date, location, target_location)
       VALUES (?, ?, ?, 'BEING DELIVERED', NOW(), ?, ?)`,
      [id, userId, receiptId, randomLocation(), randomLocation()],
    );

    try {
      const notificationResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          text: "SHIPMENT STARTED!",
          type: "SHIPMENT START",
          marked_needed_to_delete: 0,
        }),
      });
      if (!notificationResponse.ok) {
        console.error(
          "Notification service rejected shipment notification:",
          notificationResponse.status,
        );
      }
    } catch (notificationError) {
      console.error("Unable to notify about shipment creation:", notificationError);
    }

    return res.status(201).json({ id, user_id: userId, receipt_id: receiptId });

  } catch (error) {
    console.error("Error creating shipment:", error);
    return res.status(500).json({ error: "Unable to create shipment" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * @swagger
 * /shipment/cancel/{shipment_id}:
 *   delete:
 *     tags: [Shipments]
 *     summary: Cancel a shipment
 *     parameters:
 *       - in: path
 *         name: shipment_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: Optional user ID used to send a notification
 *     responses:
 *       '200':
 *         description: Shipment cancelled
 *       '400':
 *         description: Invalid shipment ID
 *       '404':
 *         description: Shipment not found
 *       '500':
 *         description: Unable to cancel shipment
 */
app.delete("/shipment/cancel/:shipment_id", async (req, res) => {
  const shipmentId = parseId(req.params.shipment_id);
  if (!shipmentId) {
    return res.status(400).json({ error: "Invalid shipment ID" });
  }
  const userId = parseId(req.body && req.body.user_id);

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "UPDATE shipment SET status = 'CANCELLED' WHERE id = ?",
      [shipmentId]
    );
    if (result.affectedRows === 0) {
      const [shipments] = await connection.execute(
        "SELECT id FROM shipment WHERE id = ? LIMIT 1",
        [shipmentId]
      );
      if (shipments.length === 0) {
        return res.status(404).json({ error: "Shipment not found" });
      }
    }

    if (userId) {
      try {
        const notificationResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/notification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            text: "SHIPMENT SUCCESSFULY CANCELLED!",
            type: "SHIPMENT CANCEL",
            marked_needed_to_delete: 0,
          }),
        });
        if (!notificationResponse.ok) {
          console.error(
            "Notification service rejected cancellation notification:",
            notificationResponse.status,
          );
        }
      } catch (notificationError) {
        console.error("Unable to notify about shipment cancellation:", notificationError);
      }
    }

    return res.status(200).json({ shipment_id: shipmentId, status: "CANCELLED" });

  } catch (error) {
    console.error("Error cancelling shipment:", error);
    return res.status(500).json({ error: "Unable to cancel shipment" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * @swagger
 * /shipment/{id}:
 *   put:
 *     tags: [Shipments]
 *     summary: Update shipment locations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Shipment ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [location, target_location]
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: Optional user ID used to send a notification
 *               location:
 *                 type: string
 *               target_location:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Shipment locations updated
 *       '400':
 *         description: Invalid ID, body, or location values
 *       '404':
 *         description: Shipment not found
 *       '500':
 *         description: Unable to update shipment
 */
app.put("/shipment/:shipment_id", async (req, res) => {
  const shipmentId = parseId(req.params.shipment_id);
  if (!shipmentId) {
    return res.status(400).json({ error: "A valid shipment ID is required" });
  }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "A JSON request body is required" });
  }

  const location =
    typeof req.body.location === "string" ? req.body.location.trim() : "";
  const targetLocation =
    typeof req.body.target_location === "string" ? req.body.target_location.trim() : "";
  const userId = parseId(req.body.user_id);
  if (!location || !targetLocation) {
    return res.status(400).json({
      error: "A location and target_location are required",
    });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "UPDATE shipment SET location = ?, target_location = ? WHERE id = ?",
      [location, targetLocation, shipmentId],
    );
    if (result.affectedRows === 0) {
      const [shipments] = await connection.execute(
        "SELECT id FROM shipment WHERE id = ? LIMIT 1",
        [shipmentId],
      );
      if (shipments.length === 0) {
        return res.status(404).json({ error: "Shipment not found" });
      }
    }

    if (userId) {
      try {
        const notificationResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/notification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            text: "SHIPMENT SUCCESSFULY UPDATED!",
            type: "SHIPMENT UPDATE",
            marked_needed_to_delete: 0,
          }),
        });
        if (!notificationResponse.ok) {
          console.error(
            "Notification service rejected update notification:",
            notificationResponse.status,
          );
        }
      } catch (notificationError) {
        console.error("Unable to notify about shipment update:", notificationError);
      }
    }

    return res.status(200).json({
      shipment_id: shipmentId,
      location,
      target_location: targetLocation,
    });
  } catch (error) {
    console.error("Error updating shipment:", error);
    return res.status(500).json({ error: "Unable to update shipment" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * @swagger
 * /shipment/{id}:
 *   get:
 *     tags: [Shipments]
 *     summary: List shipments belonging to a user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Shipment records for the user
 *       '400':
 *         description: Invalid user ID
 *       '500':
 *         description: Unable to get shipments
 */
app.get("/shipment/:user_id", async (req, res) => {
  const userId = parseId(req.params.user_id);
  if (!userId) {
    return res.status(400).json({ error: "A valid user_id is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM shipment WHERE user_id = ?",
      [userId],
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error getting shipments:", error);
    return res.status(500).json({ error: "Unable to get shipments" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * @swagger
 * /receipts/{user_id}:
 *   get:
 *     tags: [Receipts]
 *     summary: List receipts belonging to a user
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Receipt records for the user
 *       '400':
 *         description: Invalid user ID
 *       '500':
 *         description: Unable to get receipts
 */
app.get("/receipts/:user_id", async (req, res) => {
  const userId = parseId(req.params.user_id);
  if (!userId) {
    return res.status(400).json({ error: "A valid user_id is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM receipt WHERE user_id = ?",
      [userId],
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error getting receipts:", error);
    return res.status(500).json({ error: "Unable to get receipts" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * @swagger
 * /shipment/restart/{shipment_id}:
 *   put:
 *     tags: [Shipments]
 *     summary: Restart a shipment's delivery timer
 *     parameters:
 *       - in: path
 *         name: shipment_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: Optional user ID used to send a notification
 *     responses:
 *       '200':
 *         description: Shipment restarted
 *       '400':
 *         description: Invalid shipment ID
 *       '404':
 *         description: Shipment not found
 *       '500':
 *         description: Unable to restart shipment
 */
app.put("/shipment/restart/:shipment_id", async (req, res) => {
  const shipmentId = parseId(req.params.shipment_id);
  if (!shipmentId) {
    return res.status(400).json({ error: "A valid shipment_id is required" });
  }
  const userId = parseId(req.body && req.body.user_id);

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "UPDATE shipment SET status = ?, start_date = NOW() WHERE id = ?",
      ["BEING_DELIVERED", shipmentId],
    );
    if (result.affectedRows === 0) {
      const [shipments] = await connection.execute(
        "SELECT id FROM shipment WHERE id = ? LIMIT 1",
        [shipmentId],
      );
      if (shipments.length === 0) {
        return res.status(404).json({ error: "Shipment not found" });
      }
    }

    if (userId) {
      try {
        const notificationResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/notification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            text: "SHIPMENT SUCCESSFULY RESTARTED!",
            type: "SHIPMENT RESTART",
            marked_needed_to_delete: 0,
          }),
        });
        if (!notificationResponse.ok) {
          console.error(
            "Notification service rejected restart notification:",
            notificationResponse.status,
          );
        }
      } catch (notificationError) {
        console.error("Unable to notify about shipment restart:", notificationError);
      }
    }

    return res.status(200).json({
      shipment_id: shipmentId,
      status: "BEING_DELIVERED",
    });
  } catch (error) {
    console.error("Error restarting shipment:", error);
    return res.status(500).json({ error: "Unable to restart shipment" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * @swagger
 * /shipment:
 *   delete:
 *     tags: [Shipments]
 *     summary: Delete shipments older than five minutes
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: Optional user ID used to send a notification
 *     responses:
 *       '200':
 *         description: Expired shipments deleted
 *       '500':
 *         description: Unable to delete expired shipments
 */
app.delete("/shipment", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.execute("SET SQL_SAFE_UPDATES = 0");
    const [result] = await connection.execute(
      "DELETE FROM shipment WHERE start_date <= DATE_SUB(NOW(), INTERVAL 5 MINUTE)",
    );

    const userId = parseId(req.body && req.body.user_id);
    if (userId && result.affectedRows > 0) {
      try {
        const notificationResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/notification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            text: "SHIPMENT SUCCESSFULY RECIEVED!",
            type: "SHIPMENT RECIEVED",
            marked_needed_to_delete: 0,
          }),
        });
        if (!notificationResponse.ok) {
          console.error(
            "Notification service rejected completion notification:",
            notificationResponse.status,
          );
        }
      } catch (notificationError) {
        console.error("Unable to notify about completed shipments:", notificationError);
      }
    }

    return res.status(200).json({ deleted: result.affectedRows });
  } catch (error) {
    console.error("Error deleting expired shipments:", error);
    return res.status(500).json({ error: "Unable to delete expired shipments" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});