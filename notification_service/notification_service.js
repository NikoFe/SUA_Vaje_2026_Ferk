const { Hono } = require("hono");
const { cors } = require("hono/cors");
const { serve } = require("@hono/node-server");
const mysql = require("mysql2/promise");
const { randomInt } = require("node:crypto");

const app = new Hono();
const PORT = 3004;
const DEFAULT_IGNORED_TYPES =
  "RECEIPT CREATION:false,USER CREATED:false,COMMENT CREATED:false,COMMENT UPDATE:false,COMMENT DELETE:false,NEW CART ITEM:false,CART EMPTIED:false,CART ITEM DELETED:false,CART UPDATE:false,USER UPDATE:false,SHIPMENT START:false,SHIPMENT CANCEL:false,SHIPMENT UPDATE:false,SHIPMENT RESTART:false,SHIPMENT RECIEVED:false";

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

app.use("*", cors());
app.notFound((context) => context.json({ error: "Route not found" }, 404));
app.onError((error, context) => {
  console.error("Unhandled notification service error:", error);
  return context.json({ error: "Internal Server Error" }, 500);
});

/*
function parseInt(value) {
  const id = parseInt(value, 10);
  return Number.isNaN(id) || id <= 0 ? null : id;
}


function isRequestBody(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function readJsonBody(context) {
  try {
    const body = await context.req.json();
    return isRequestBody(body) ? body : null;
  } catch {
    return null;
  }
}*/

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
      ignoredTypes.set(
        type,
        entry.slice(separator + 1).trim().toLowerCase() === "true",
      );
    }
  }
  return ignoredTypes;
}

async function createNotification(context) {


 //const body = await context.req.json();
const body = await context.req.json();
  //const body = await readJsonBody(context);
//const body =  context.body;

  if (!body) {
    return context.json({ error: "A JSON request body is required" }, 400);
  }

  const pathUserId = context.req.param("user_id");
  const userId =
    pathUserId === undefined
      ? parseInt(body.user_id,10)
      : parseInt(pathUserId,10);

    /*
      ? parseInt(body.user_id)
      : parseInt(pathUserId);
*/

      const text =body.text.trim();
      const type =body.type.trim();
      /*
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
*/
  if (userId === null || !text || !type) {
    return context.json({ error: "Invalid notification details" }, 400);
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const id = randomInt(1, 2147483647);
    await connection.execute(
      "INSERT INTO notification (id, user_id, text, type) VALUES (?, ?, ?, ?)",
      [id, userId, text, type],
    );

    return context.json(
      {
        id,
        user_id: userId,
        text,
        type,
      },
      201,
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    return context.json({ error: "Unable to create notification" }, 500);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

app.post("/notification", createNotification);
app.post("/notification/:user_id", createNotification);

app.get("/notification/:user_id", async (context) => {
  const userId = parseInt(context.req.param("user_id"));
  if (userId === null) {
    return context.json({ error: "A valid user_id is required" }, 400);
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

    //Filter out ignored notifications
    const notifications = rows.filter(
      (notification) =>
        ignoredTypes.get(String(notification.type).trim().toLowerCase()) !==
        true,
    );
    return context.json(notifications, 200);
  } catch (error) {
    console.error("Error getting notifications:", error);
    return context.json({ error: "Unable to get notifications" }, 500);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.delete("/notification/:notification_id", async (context) => {
  const notificationId = parseInt(context.req.param("notification_id"));
  if (notificationId === null) {
    return context.json(
      { error: "A valid notification_id is required" },
      400,
    );
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "DELETE FROM notification WHERE id = ?",
      [notificationId],
    );
    if (result.affectedRows === 0) {
      return context.json({ error: "Notification not found" }, 404);
    }

    return context.json({ deleted: result.affectedRows, id: notificationId }, 200);
  } catch (error) {
    console.error("Error deleting notification:", error);
    return context.json({ error: "Unable to delete notification" }, 500);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.put("/notification_preference/toggle/:user_id", async (context) => {
  const userId = parseInt(context.req.param("user_id"));
  if (userId === null) {
    return context.json({ error: "A valid user_id is required" }, 400);
  }


  //await context.req.json();
  const body =context.req.json();
  
  //await readJsonBody(context);



  const type = typeof body?.type === "string" ? body.type.trim() : "";
  if (!type) {
    return context.json({ error: "A notification type is required" }, 400);
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT ignored_types FROM notification_preference WHERE user_id = ? LIMIT 1",
      [userId],
    );
    if (rows.length === 0) {
      return context.json(
        { error: "Notification preferences not found" },
        404,
      );
    }

    const ignoredTypes = rows[0].ignored_types;
    if (typeof ignoredTypes !== "string") {
      return context.json(
        { error: "Stored notification preferences are invalid" },
        500,
      );
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
      return context.json({ error: "Unknown notification type" }, 400);
    }

    const separator = entries[entryIndex].lastIndexOf(":");
    const currentValue = entries[entryIndex]
      .slice(separator + 1)
      .trim()
      .toLowerCase();
    if (currentValue !== "true" && currentValue !== "false") {
      return context.json(
        { error: "Stored notification preference is invalid" },
        500,
      );
    }

    entries[entryIndex] =
      `${entries[entryIndex].slice(0, separator)}:${currentValue === "true" ? "false" : "true"}`;
    const updatedIgnoredTypes = entries.join(",");
    await connection.execute(
      "UPDATE notification_preference SET ignored_types = ? WHERE user_id = ?",
      [updatedIgnoredTypes, userId],
    );

    return context.json(
      {
        user_id: userId,
        type,
        ignored: currentValue !== "true",
        ignored_types: updatedIgnoredTypes,
      },
      200,
    );
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return context.json(
      { error: "Unable to update notification preferences" },
      500,
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.post("/notification_preferences/:user_id", async (context) => {
  const userId = parseInt(context.req.param("user_id"));
  if (userId === null) {
    return context.json({ error: "A valid user_id is required" }, 400);
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const id = randomInt(1, 2147483647);
    await connection.execute(
      "INSERT INTO notification_preference (id, user_id, ignored_types) VALUES (?, ?, ?)",
      [id, userId, DEFAULT_IGNORED_TYPES],
    );

    return context.json(
      {
        id,
        user_id: userId,
        ignored_types: DEFAULT_IGNORED_TYPES,
      },
      201,
    );
  } catch (error) {
    console.error("Error creating notification preferences:", error);
    return context.json(
      { error: "Unable to create notification preferences" },
      500,
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.get("/notification_preferences/:user_id", async (context) => {
  const userId = parseInt(context.req.param("user_id"));
  if (userId === null) {
    return context.json({ error: "A valid user_id is required" }, 400);
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM notification_preference WHERE user_id = ? LIMIT 1",
      [userId],
    );
    if (rows.length === 0) {
      return context.json({ error: "Notification preferences not found" }, 404);
    }

    return context.json(rows[0], 200);
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    return context.json(
      { error: "Unable to get notification preferences" },
      500,
    );
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
    if (typeof rows[0].ignored_types !== "string") {
      throw new Error("Stored notification preferences are invalid");
    }

    const updatedIgnoredTypes = rows[0].ignored_types
      .split(",")
      .map((entry) => {
        const separator = entry.lastIndexOf(":");
        const currentValue =
          separator === -1
            ? ""
            : entry.slice(separator + 1).trim().toLowerCase();
        if (currentValue !== "true" && currentValue !== "false") {
          throw new Error("Stored notification preferences are invalid");
        }
        //here it adds the ignored value to each entry
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

app.delete("/notification_preferences/:user_id", async (context) => {
  const userId = parseInt(context.req.param("user_id"));
  if (userId === null) {
    return context.json({ error: "A valid user_id is required" }, 400);
  }

  try {
    const ignoredTypes = await setAllIgnoredTypes(userId, false);
    if (ignoredTypes === null) {
      return context.json(
        { error: "Notification preferences not found" },
        404,
      );
    }
    return context.json({ user_id: userId, ignored_types: ignoredTypes }, 200);
  } catch (error) {
    console.error("Error resetting notification preferences:", error);
    return context.json(
      { error: "Unable to reset notification preferences" },
      500,
    );
  }
});

app.put("/notification_preferences/enable_all/:user_id", async (context) => {
  const userId = parseInt(context.req.param("user_id"));
  if (userId === null) {
    return context.json({ error: "A valid user_id is required" }, 400);
  }

  try {
    const ignoredTypes = await setAllIgnoredTypes(userId, true);
    if (ignoredTypes === null) {
      return context.json(
        { error: "Notification preferences not found" },
        404,
      );
    }
    return context.json({ user_id: userId, ignored_types: ignoredTypes }, 200);
  } catch (error) {
    console.error("Error enabling all notification preferences:", error);
    return context.json(
      { error: "Unable to enable all notification preferences" },
      500,
    );
  }
});

serve({ fetch: app.fetch, port: PORT, hostname: "0.0.0.0" });
console.log(`Notification service is running on http://localhost:${PORT}`);
