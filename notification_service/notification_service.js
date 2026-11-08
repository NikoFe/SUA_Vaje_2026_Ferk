const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { randomInt } = require("node:crypto");

const app = express();
const PORT = 3004;

if (process.env.NODE_ENV === "test") {
  require("dotenv").config({ path: "./.env.test" });
} else {
  require("dotenv").config({ path: "./.env" });
}

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  decimalNumbers: true,
};

app.use(express.json());
app.use(cors());
/*
function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}*/

function parseFlag(value) {
  if (value === true || value === 1 || value === "1") {
    return 1;
  }
  if (value === false || value === 0 || value === "0") {
    return 0;
  }
  return null;
}
/*
function getUserId(req) {
  return parseId(req.params.user_id || req.query.user_id || req.body?.user_id);
}*/

function parseIgnoredTypes(value) {
  if (typeof value !== "string" || value.length > 75) {
    return null;
  }
  return value
    .split(",")
    .map((type) => type.trim())
    .filter(Boolean);
}

function isIgnored(type, ignoredTypes) {
  const normalizedType = type.toLocaleLowerCase();
  return ignoredTypes.some((ignoredType) => ignoredType.toLocaleLowerCase() === normalizedType);
}

async function loadPreference(connection, userId) {
  const [rows] = await connection.execute(
    "SELECT id, user_id, marked_needed_to_delete, ignored_types FROM notification_preference WHERE user_id = ? LIMIT 1",
    [userId]
  );
  return rows[0] || null;
}

app.post(["/notification", "/notification/:user_id"], async (req, res) => {

  const userId =req.body.user_id;
  

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const type = typeof req.body?.type === "string" ? req.body.type.trim() : "";
  const markedNeededToDelete = req.body.marked_needed_to_delete;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const id = randomInt(1, 2147483647);
    await connection.execute(
      "INSERT INTO notification (id, user_id, text, type, marked_needed_to_delete) VALUES (?, ?, ?, ?, ?)",
      [id, userId, text, type, markedNeededToDelete]
    );
    console.log("|||||| NOTIFICATION message: ",text );

    return res.status(201).json({
      id,
      user_id: userId,
      text,
      type,
      marked_needed_to_delete: markedNeededToDelete,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({ error: "Unable to create notification" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.get(["/notification", "/notification/:user_id"], async (req, res) => {
    const userId =req.body.user_id;
  if (!userId) {
    return res.status(400).json({ error: "A valid user_id is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const preference = await loadPreference(connection, userId);
    const ignoredTypes = parseIgnoredTypes(preference?.ignored_types || "");
    const [rows] = await connection.execute(
      "SELECT id, user_id, text, type, marked_needed_to_delete FROM notification WHERE user_id = ?",
      [userId]
    );
    
    return res.json(rows.filter((notification) => !isIgnored(notification.type, ignoredTypes)));
  } catch (error) {
    console.error("Error getting notifications:", error);
    return res.status(500).json({ error: "Unable to get notifications" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.delete("/notification/:notification_id", async (req, res) => {
  const notificationId = req.params.user_id ;
  //
  
 // parseId(req.params.notification_id);
   const userId =req.body.user_id;
  //const userId = getUserId(req);
  if (!notificationId || !userId) {
    return res.status(400).json({ error: "Valid notification_id and user_id are required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "DELETE FROM notification WHERE id = ? AND user_id = ?",
      [notificationId, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }
    return res.json({ deleted: result.affectedRows, id: notificationId });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({ error: "Unable to delete notification" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.delete("/notification", async (req, res) => {
    const userId =req.body.user_id;
  //const userId = getUserId(req);
  if (!userId) {
    return res.status(400).json({ error: "A valid user_id is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "DELETE FROM notification WHERE user_id = ?",
      [userId]
    );
    return res.json({ deleted: result.affectedRows });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return res.status(500).json({ error: "Unable to delete notifications" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.get(
  ["/notification_preferences", "/notification_preferences/:user_id"],
  async (req, res) => {
    const userId =req.body.user_id;
    //const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({ error: "A valid user_id is required" });
    }

    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);

  const [rows] = await connection.execute(
    "SELECT id, user_id, marked_needed_to_delete, ignored_types FROM notification_preference WHERE user_id = ? LIMIT 1",
    [userId]
  );

  return rows[0] || null;
    } catch (error) {
      console.error("Error getting notification preferences:", error);
      return res.status(500).json({ error: "Unable to get notification preferences" });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }
);


app.listen(PORT, () => {
  console.log(`Notification service is running on http://localhost:${PORT}`);
});
