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
app.post(["/notification", "/notification/:user_id"], async (req, res) => {
  const userId = req.body.user_id;

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const type = typeof req.body?.type === "string" ? req.body.type.trim() : "";
  const markedNeededToDelete = req.body.marked_needed_to_delete;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const id = randomInt(1, 2147483647);
    await connection.execute(
      "INSERT INTO notification (id, user_id, text, type) VALUES (?, ?, ?, ?)",
      [id, userId, text, type],
    );
    console.log("|||||| NOTIFICATION message: ", text);

    return res.status(201).json({
      id,
      user_id: userId,
      text,
      type,
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

function parseIgnoredTypes(value) {
  if (typeof value !== "string") {
    return new Map();
  }

  const ignoredTypes = new Map();
  for (const entry of value.split(",")) {
    const separator = entry.lastIndexOf(":");
    if (separator === -1) {
      continue;
    }

    const type = entry.slice(0, separator).trim().toLowerCase();
    if (type) {
      ///ADD TO MAP
      ignoredTypes.set(
        type,
        entry.slice(separator + 1).trim().toLowerCase() === "true",
      );
    }
  }
  return ignoredTypes;
}


app.get("/notification/:user_id", async (req, res) => {
  console.log("GETTING NOTIFICATIONS! ");
  const userId = parseInt(req.params.user_id);
  //const userId =req.params.user_id;
  //const userId =req.body.user_id;
  if (!userId) {
    return res.status(400).json({ error: "A valid user_id is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT id, user_id, text, type FROM notification WHERE user_id = ?",
      [userId],
    );

    const [preferenceRows] = await connection.execute(
      "SELECT ignored_types FROM notification_preference WHERE user_id = ? LIMIT 1",
      [userId],
    );
    const ignoredTypes = parseIgnoredTypes(preferenceRows[0]?.ignored_types);
    return res.json(
      rows.filter(
        (notification) =>
          ignoredTypes.get(String(notification.type).trim().toLowerCase()) !==
          true,
      ),
    );
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
  console.log("CALLING DELETE DDDDDDDDDDD");

  const notificationId = req.params.notification_id;
  //

  // parseId(req.params.notification_id);
  //const userId =req.body.user_id;
  //const userId = getUserId(req);
  if (!notificationId) {
    return res
      .status(400)
      .json({ error: "Valid notification_id  is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "DELETE FROM notification WHERE id = ?",
      [notificationId],
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


app.put("/notification_preference/toggle/:user_id", async (req, res) => {
  console.log("////////////////// TOGGLING NOTIFICATION TYPE! ///////////////7");
  const userId = Number(req.params.user_id);
  //const type = typeof req.body?.type;

  const type =  req.body?.type;



  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("1");
    const [rows] = await connection.execute(
      "SELECT ignored_types FROM notification_preference WHERE user_id = ? LIMIT 1",
      [userId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Notification preferences not found" });
    }

    console.log("11");
    console.log("NOTIFICATION TYPE: ", type);
    const ignoredTypes = rows[0].ignored_types;
    if (typeof ignoredTypes !== "string") {
      return res.status(500).json({ error: "Stored notification preferences are invalid" });
    }

    const entries = ignoredTypes.split(",");
    const entryIndex = entries.findIndex((entry) => {
      const separator = entry.lastIndexOf(":");
      return (
        separator !== -1 &&
        entry.slice(0, separator).trim().toLowerCase() === type.toLowerCase()
      );
    });
    if (entryIndex === -1) {
      return res.status(400).json({ error: "Unknown notification type" });
    }
   console.log("2");
    const separator = entries[entryIndex].lastIndexOf(":");
    const currentValue = entries[entryIndex].slice(separator + 1).trim().toLowerCase();
    if (currentValue !== "true" && currentValue !== "false") {
      return res.status(500).json({ error: "Stored notification preference is invalid" });
    }
    entries[entryIndex] =
      `${entries[entryIndex].slice(0, separator)}:${currentValue === "true" ? "false" : "true"}`;

    const updatedIgnoredTypes = entries.join(",");
    console.log("3");
    await connection.execute(
      "UPDATE notification_preference SET ignored_types = ? WHERE user_id = ?",
      [updatedIgnoredTypes, userId],
    );

    return res.json({
      user_id: userId,
      type,
      ignored: currentValue !== "true",
      ignored_types: updatedIgnoredTypes,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return res.status(500).json({ error: "Unable to update notification preferences" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});




app.post("/notification_preferences/:user_id", async (req, res) => {
  console.log("CREATING NOTIFICATION PREFERENCES ~~~~~~~~~~~~");
  const userId = parseInt(req.params.user_id);
  console.log("USERID: ", userId);

  if (!userId) {
    return res.status(400).json({ error: "A valid user_id is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const id = randomInt(1, 2147483647);

    const [rows] = await connection.execute(
      // "SELECT id, user_id, marked_needed_to_delete, ignored_types FROM notification_preference WHERE user_id = ? LIMIT 1",
      "INSERT INTO notification_preference (id, user_id, ignored_types) VALUES (?, ?, 'RECEIPT CREATION:false,USER CREATED:false,COMMENT CREATED:false,COMMENT UPDATE:false,COMMENT DELETE:false,NEW CART ITEM:false,CART EMPTIED:false,CART ITEM DELETED:false,CART UPDATE:false,USER UPDATE:false,SHIPMENT START:false,SHIPMENT CANCEL:false,SHIPMENT UPDATE:false,SHIPMENT RESTART:false,SHIPMENT RECIEVED:false')",
      [id, userId],
    );

    console.log("RRRRRRRR ROWS LENGTH" + rows.length);

    return rows[0] || null;
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    return res
      .status(500)
      .json({ error: "Unable to get notification preferences" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.get(["/notification_preferences/:user_id"], async (req, res) => {
  //  const userId =req.body.user_id;
   console.log("GETTING NOTIFICATION PREFERENCES!");
  const userId = parseInt(req.params.user_id);

  //const userId = getUserId(req);
  if (!userId) {
    return res.status(400).json({ error: "A valid user_id is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      // "SELECT id, user_id, marked_needed_to_delete, ignored_types FROM notification_preference WHERE user_id = ? LIMIT 1",
      "SELECT * FROM notification_preference WHERE user_id = ? LIMIT 1",

      [userId],
    );
  console.log ("PREFERENCES ROWS: ", rows[0]);
    return res.json(rows[0] || null);
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    return res
      .status(500)
      .json({ error: "Unable to get notification preferences" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});


async function setAllIgnoredTypes(userId, ignored) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT ignored_types FROM notification_preference WHERE user_id = ? LIMIT 1",
      [userId],
    );
    if (rows.length === 0) {
      return null;
    }

    const updatedIgnoredTypes = rows[0].ignored_types
      .split(",")
      .map((entry) => {
        const separator = entry.lastIndexOf(":");
        const currentValue = entry.slice(separator + 1).trim().toLowerCase();
        if (
          separator === -1 ||
          (currentValue !== "true" && currentValue !== "false")
        ) {
          throw new Error("Stored notification preferences are invalid");
        }
        return `${entry.slice(0, separator)}:${ignored}`;
      })
      .join(",");

    await connection.execute(
      "UPDATE notification_preference SET ignored_types = ? WHERE user_id = ?",
      [updatedIgnoredTypes, userId],
    );
    return updatedIgnoredTypes;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

app.delete("/notification_preferences/:user_id", async (req, res) => {
  console.log("RESETTING NOTIFICATION PREFERENCES TO FALSE");
  const userId = Number(req.params.user_id);

  try {
    const ignoredTypes = await setAllIgnoredTypes(userId, false);
    if (ignoredTypes === null) {
      return res.status(404).json({ error: "Notification preferences not found" });
    }
    return res.json({ user_id: userId, ignored_types: ignoredTypes });
  } catch (error) {
    console.error("Error resetting notification preferences:", error);
    return res.status(500).json({ error: "Unable to reset notification preferences" });
  }
});

app.put("/notification_preferences/enable_all/:user_id", async (req, res) => {
  console.log("RESETTING NOTIFICATION PREFERENCES TO TRUE");
  const userId = Number(req.params.user_id);


  try {
    const ignoredTypes = await setAllIgnoredTypes(userId, true);
    if (ignoredTypes === null) {
      return res.status(404).json({ error: "Notification preferences not found" });
    }
    return res.json({ user_id: userId, ignored_types: ignoredTypes });
  } catch (error) {
    console.error("Error resetting notification preferences:", error);
    return res.status(500).json({ error: "Unable to reset notification preferences" });
  }
});



app.listen(PORT, () => {
  console.log(`Notification service is running on http://localhost:${PORT}`);
});
