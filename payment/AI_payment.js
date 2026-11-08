const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { randomInt } = require("node:crypto");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = 3003;

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

async function insertWithRandomId(connection, query, values) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const id = randomInt(1, 2147483647);
      await connection.execute(query, [id, ...values]);
      return id;
    } catch (error) {
      if (error.code !== "ER_DUP_ENTRY" || attempt === 4) {
        throw error;
      }
    }
  }
}

app.get("/receipt/:user_id", async (req, res) => {
  const userId = parseId(req.params.user_id);
  if (!userId) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT r.id, r.user_id, r.date, r.amount,
              ri.id AS receipt_item_id, ri.product_id, ri.amount AS item_amount
       FROM receipt AS r
       LEFT JOIN receipt_item AS ri ON ri.receipt_id = r.id
       WHERE r.user_id = ?
       ORDER BY r.date DESC, r.id DESC`,
      [userId]
    );

    const receiptsById = new Map();
    for (const row of rows) {
      if (!receiptsById.has(row.id)) {
        receiptsById.set(row.id, {
          id: row.id,
          user_id: row.user_id,
          date: row.date,
          amount: row.amount,
          items: [],
        });
      }
      if (row.receipt_item_id !== null) {
        receiptsById.get(row.id).items.push({
          id: row.receipt_item_id,
          product_id: row.product_id,
          amount: row.item_amount,
        });
      }
    }

    return res.json([...receiptsById.values()]);
  } catch (error) {
    console.error("Error getting receipt history:", error);
    return res.status(500).json({ error: "Unable to get receipt history" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/*
async function getShipments(req, res) {
  const userId = parseId(req.params.user_id || req.query.user_id);
  if (!userId) {
    return res.status(400).json({ error: "Invalid or missing user ID" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT id, user_id, receipt_id, status, start_date, location, target_location
       FROM shipment
       WHERE user_id = ? AND (status IS NULL OR status <> 'CANCELLED')
       ORDER BY start_date DESC`,
      [userId]
    );
    return res.json(rows);
  } catch (error) {
    console.error("Error getting shipments:", error);
    return res.status(500).json({ error: "Unable to get shipments" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
  */

//app.get("/shipment", getShipments);
//app.get("/shipment/:user_id", getShipments);

/*
app.post("/receipt", async (req, res) => {
  const userId = parseId(req.body.user_id);
  const totalAmount = Number(req.body.amount);
  if (!userId || !Number.isFinite(totalAmount) || totalAmount < 0) {
    return res.status(400).json({
      error: "A valid user_id and non-negative receipt amount are required",
    });
  }

  let cart;
  try {
    const cartResponse = await fetch(
      `${userServiceUrl}/cart/${encodeURIComponent(userId)}`
    );
    if (!cartResponse.ok) {
      return res.status(502).json({ error: "Unable to retrieve user's cart" });
    }
    cart = await cartResponse.json();
    if (!Array.isArray(cart)) {
      return res.status(502).json({ error: "User service returned an invalid cart" });
    }
    if (cart.length === 0) {
      return res.status(400).json({ error: "Cannot create a receipt for an empty cart" });
    }
  } catch (error) {
    console.error("Error retrieving cart for receipt:", error);
    return res.status(502).json({ error: "User service unavailable" });
  }

  let connection;
  let transactionStarted = false;
  let receiptId;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();
    transactionStarted = true;

    receiptId = await insertWithRandomId(
      connection,
      "INSERT INTO receipt (id, user_id, `date`, amount) VALUES (?, ?, CURRENT_DATE(), ?)",
      [userId, totalAmount]
    );

    for (const item of cart) {
      const productId = parseId(item.product_id);
      const itemAmount = Number(item.amount);
      if (!productId || !Number.isSafeInteger(itemAmount) || itemAmount <= 0) {
        throw new Error("Cart contains an invalid product or amount");
      }

      await insertWithRandomId(
        connection,
        "INSERT INTO receipt_item (id, product_id, receipt_id, amount) VALUES (?, ?, ?, ?)",
        [productId, receiptId, itemAmount]
      );
    }

    await connection.commit();
    transactionStarted = false;
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }
    console.error("Error creating receipt:", error);
    return res.status(500).json({ error: "Unable to create receipt" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }

  try {
    const clearResponse = await fetch(
      `${userServiceUrl}/cart/all/${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    );
    if (!clearResponse.ok) {
      return res.status(502).json({
        error: "Receipt created, but the cart could not be cleared",
        receipt_id: receiptId,
      });
    }
  } catch (error) {
    console.error("Error clearing cart after receipt creation:", error);
    return res.status(502).json({
      error: "Receipt created, but the cart could not be cleared",
      receipt_id: receiptId,
    });
  }

  return res.status(201).json({ receipt_id: receiptId, message: "Receipt created" });
});

*/


/*
app.post("/shipment", async (req, res) => {
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

    const shipmentId = await insertWithRandomId(
      connection,
      `INSERT INTO shipment
         (id, user_id, receipt_id, status, start_date, location, target_location)
       VALUES (?, ?, ?, 'BEING DELIVERED', NOW(), ?, ?)`,
      [userId, receiptId, randomLocation(), targetLocations[randomInt(targetLocations.length)]]
    );

    const [shipments] = await connection.execute(
      `SELECT id, user_id, receipt_id, status, start_date, location, target_location
       FROM shipment WHERE id = ?`,
      [shipmentId]
    );
    return res.status(201).json(shipments[0]);
  } catch (error) {
    console.error("Error creating shipment:", error);
    return res.status(500).json({ error: "Unable to create shipment" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});*/

app.put("/shipment/target_location/:receipt_id", async (req, res) => {
  const receiptId = parseId(req.params.receipt_id);
  if (!receiptId) {
    return res.status(400).json({ error: "Invalid receipt ID" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const targetLocation = targetLocations[randomInt(targetLocations.length)];
    const [result] = await connection.execute(
      "UPDATE shipment SET target_location = ? WHERE receipt_id = ?",
      [targetLocation, receiptId]
    );
    if (result.affectedRows === 0 && !(await shipmentExists(connection, receiptId))) {
      return res.status(404).json({ error: "Shipment not found" });
    }
    return res.json({ receipt_id: receiptId, target_location: targetLocation });
  } catch (error) {
    console.error("Error updating shipment target location:", error);
    return res.status(500).json({ error: "Unable to update shipment target location" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.put("/shipment/status/:receipt_id", async (req, res) => {
  const receiptId = parseId(req.params.receipt_id);
  const status = typeof req.body.status === "string" ? req.body.status.trim() : "";
  if (!receiptId || !status) {
    return res.status(400).json({ error: "A valid receipt ID and status are required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "UPDATE shipment SET status = ? WHERE receipt_id = ?",
      [status, receiptId]
    );
    if (result.affectedRows === 0 && !(await shipmentExists(connection, receiptId))) {
      return res.status(404).json({ error: "Shipment not found" });
    }
    return res.json({ receipt_id: receiptId, status });
  } catch (error) {
    console.error("Error updating shipment status:", error);
    return res.status(500).json({ error: "Unable to update shipment status" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.put("/shipment/location/:receipt_id", async (req, res) => {
  const receiptId = parseId(req.params.receipt_id);
  if (!receiptId) {
    return res.status(400).json({ error: "Invalid receipt ID" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const location = randomLocation();
    const [result] = await connection.execute(
      "UPDATE shipment SET location = ? WHERE receipt_id = ?",
      [location, receiptId]
    );
    if (result.affectedRows === 0 && !(await shipmentExists(connection, receiptId))) {
      return res.status(404).json({ error: "Shipment not found" });
    }
    return res.json({ receipt_id: receiptId, location });
  } catch (error) {
    console.error("Error updating shipment location:", error);
    return res.status(500).json({ error: "Unable to update shipment location" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/*
app.delete("/shipment/cancel/:receipt_id", async (req, res) => {
  const receiptId = parseId(req.params.receipt_id);
  if (!receiptId) {
    return res.status(400).json({ error: "Invalid receipt ID" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "UPDATE shipment SET status = 'CANCELLED' WHERE receipt_id = ?",
      [receiptId]
    );
    if (result.affectedRows === 0 && !(await shipmentExists(connection, receiptId))) {
      return res.status(404).json({ error: "Shipment not found" });
    }
    return res.json({ receipt_id: receiptId, status: "CANCELLED" });
  } catch (error) {
    console.error("Error cancelling shipment:", error);
    return res.status(500).json({ error: "Unable to cancel shipment" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});
*/
app.delete("/shipment/:receipt_id", async (req, res) => {
  const receiptId = parseId(req.params.receipt_id);
  if (!receiptId) {
    return res.status(400).json({ error: "Invalid receipt ID" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "DELETE FROM shipment WHERE receipt_id = ?",
      [receiptId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Shipment not found" });
    }
    return res.json({ deleted: result.affectedRows });
  } catch (error) {
    console.error("Error deleting shipment:", error);
    return res.status(500).json({ error: "Unable to delete shipment" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});