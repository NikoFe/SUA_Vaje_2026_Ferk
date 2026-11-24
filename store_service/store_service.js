const Fastify = require("fastify");
const cors = require("@fastify/cors");
const mysql = require("mysql2/promise");

const app = Fastify({ logger: true });
const PORT = 3001;

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

/*
function parseInt(value) {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}*/

function isRequestBody(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function requireAdmin(userId, reply) {
  if (userId === undefined || userId === null || userId === "") {
    reply.code(401).send({ error: "Authentication is required" });
    return false;
  }

  const parsedUserId = parseInt(userId);
  if (parsedUserId === null) {
    reply.code(400).send({ error: "A valid user_id is required" });
    return false;
  }

  try {
    const response = await fetch(
      `http://localhost:3002/status/${encodeURIComponent(parsedUserId)}`,
    );
    const result = await response.json();

    if (!response.ok) {
      reply.code(response.status).send(result);
      return false;
    }

    if (
      typeof result.status !== "string" ||
      result.status.trim().toLowerCase() !== "admin"
    ) {
      reply.code(403).send({ error: "Admin privileges are required" });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking admin privileges:", error);
    reply.code(502).send({ error: "User service unavailable" });
    return false;
  }
}

app.put("/stock/:product_id", async (request, reply) => {
  //const productId = parseInt(request.params.product_id);
 const productId =parseInt(request.params.product_id);


  const newAmount =  request.body.new_amount;

  if (productId === null) {
    return reply.code(400).send({ error: "A valid product_id is required" });
  }
  if (
    (typeof newAmount !== "number" && typeof newAmount !== "string") ||
    (typeof newAmount === "string" && newAmount.trim() === "") ||
    !Number.isFinite(Number(newAmount)) ||
    Number(newAmount) < 0
  ) {
    return reply.code(400).send({ error: "A valid new_amount is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [existingProducts] = await connection.execute(
      "SELECT id FROM product WHERE id = ? LIMIT 1",
      [productId],
    );
    if (existingProducts.length === 0) {
      return reply.code(404).send({ error: "Product not found" });
    }

    await connection.execute(
      `UPDATE product
       SET stock = ?
       WHERE id = ?`,
      [Number(newAmount), productId],
    );
    return reply.code(200).send({ message: "stock update success" });
  } catch (error) {
    console.error("Error updating stock:", error);
    return reply.code(500).send({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.get("/", async (_request, reply) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM product");
    return reply.code(200).send(rows);
  } catch (error) {
    console.error("Error getting products:", error);
    return reply.code(500).send({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.get("/:id", async (request, reply) => {
  //const productId = parseInt(request.params.id);

  const productId = parseInt(request.params.id);

  if (productId === null) {
    return reply.code(400).send({ error: "A valid product ID is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM product WHERE id = ? LIMIT 1",
      [productId],
    );
    return reply.code(rows.length === 0 ? 404 : 200).send(rows);
  } catch (error) {
    console.error("Error getting specific product:", error);
    return reply.code(500).send({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.get("/comments", async (_request, reply) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM comments");
    return reply.code(200).send(rows);
  } catch (error) {
    console.error("Error getting comments:", error);
    return reply.code(500).send({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.get("/comments/:id", async (request, reply) => {
 // const productId = parseInt(request.params.id);
 const productId = parseInt(request.params.id);
  if (productId === null) {
    return reply.code(400).send({ error: "A valid product ID is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM comments WHERE product_id = ?",
      [productId],
    );
    return reply.code(200).send(rows);
  } catch (error) {
    console.error("Error getting comments for product:", error);
    return reply.code(500).send({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.post("/:user_id", async (request, reply) => {
  const userId = parseInt(request.params.user_id);
  if (userId === null) {
    return reply.code(400).send({ error: "A valid user_id is required" });
  }
  if (!isRequestBody(request.body)) {
    return reply.code(400).send({ error: "A JSON request body is required" });
  }

  const isAdmin = await requireAdmin(userId, reply);
  if (!isAdmin) {
    return reply;
  }

  const {
    name,
    description,
    cost,
    kilograms,
    allergens,
    kilojoules,
    vitamins,
    stock,
    discount,
    image_path,
  } = request.body;

  let connection;
  try {
    const id = Math.floor(Math.random() * 100000);
    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `INSERT INTO product
       (id, name, description, cost, kilograms, allergens, kilojoules, vitamins, stock, discount, image_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        description,
        cost,
        kilograms,
        allergens,
        kilojoules,
        vitamins,
        stock,
        discount,
        image_path,
      ],
    );

    return reply.code(201).send({ message: "Product created", id });
  } catch (error) {
    console.error("Error creating product:", error);
    return reply.code(500).send({ error: "Failed to create product" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.put("/:id", async (request, reply) => {
  const productId = parseInt(request.params.id);
  if (productId === null) {
    return reply.code(400).send({ error: "A valid product ID is required" });
  }
  if (!isRequestBody(request.body)) {
    return reply.code(400).send({ error: "A JSON request body is required" });
  }

  const isAdmin = await requireAdmin(request.body.user_id, reply);
  if (!isAdmin) {
    return reply;
  }

  const {
    name,
    description,
    cost,
    kilograms,
    allergens,
    kilojoules,
    vitamins,
    stock,
    discount,
    image_path,
  } = request.body;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [existingProducts] = await connection.execute(
      "SELECT id FROM product WHERE id = ? LIMIT 1",
      [productId],
    );
    if (existingProducts.length === 0) {
      return reply.code(404).send({ error: "Product not found" });
    }

    await connection.execute(
      `UPDATE product
       SET name = ?, description = ?, cost = ?, kilograms = ?, allergens = ?, kilojoules = ?, vitamins = ?, stock = ?, discount = ?, image_path = ?
       WHERE id = ?`,
      [
        name,
        description,
        cost,
        kilograms,
        allergens,
        kilojoules,
        vitamins,
        stock,
        discount,
        image_path,
        productId,
      ],
    );

    return reply.code(200).send({ message: "update success" });
  } catch (error) {
    console.error("Error updating product:", error);
    return reply.code(500).send({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.delete("/:id", async (request, reply) => {
  const productId = parseInt(request.params.id);
  if (productId === null) {
    return reply.code(400).send({ error: "A valid product ID is required" });
  }
  if (!isRequestBody(request.body)) {
    return reply.code(400).send({ error: "A JSON request body is required" });
  }

  const isAdmin = await requireAdmin(request.body.user_id, reply);
  if (!isAdmin) {
    return reply;
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "DELETE FROM product WHERE id = ?",
      [productId],
    );
    if (result.affectedRows === 0) {
      return reply.code(404).send({ error: "Product not found" });
    }

    return reply.code(200).send({ message: "delete meal success" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return reply.code(500).send({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.post("/comments", async (request, reply) => {
  if (!isRequestBody(request.body)) {
    return reply.code(400).send({ error: "A JSON request body is required" });
  }

  const { product_id, userId, username, comment, created_at } = request.body;
  const productId = parseInt(product_id);
  const parsedUserId = parseInt(userId);
  if (
    productId === null ||
    parsedUserId === null ||
    typeof username !== "string" ||
    username.trim() === "" ||
    typeof comment !== "string" ||
    comment.trim() === "" ||
    created_at === undefined ||
    created_at === null
  ) {
    return reply.code(400).send({ error: "Invalid comment details" });
  }

  let connection;
  try {
    const id = Math.floor(Math.random() * 100000);
    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `INSERT INTO comments
       (id, product_id, user_id, comment, username, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, productId, parsedUserId, comment, username, created_at],
    );

    await fetch("http://localhost:3004/notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: parsedUserId,
        text: "COMMENT SUCCESSFULY CREATED!",
        type: "COMMENT CREATED",
        marked_needed_to_delete: 0,
      }),
    });

    return reply.code(201).send("comment successfuly created!");
  } catch (error) {
    console.error("Error creating comment:", error);
    return reply.code(500).send({ error: "Failed to create comment" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.put("/comments/:id", async (request, reply) => {
  const commentId = parseInt(request.params.id);
  if (commentId === null) {
    return reply.code(400).send({ error: "A valid comment ID is required" });
  }
  if (!isRequestBody(request.body)) {
    return reply.code(400).send({ error: "A JSON request body is required" });
  }

  const { comment, user_id } = request.body;
  const userId = parseInt(user_id);
  if (
    userId === null ||
    typeof comment !== "string" ||
    comment.trim() === ""
  ) {
    return reply.code(400).send({ error: "Invalid comment details" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [existingComments] = await connection.execute(
      "SELECT id FROM comments WHERE id = ? LIMIT 1",
      [commentId],
    );
    if (existingComments.length === 0) {
      return reply.code(404).send({ error: "Comment not found" });
    }

    await connection.execute(
      `UPDATE comments
       SET comment = ?
       WHERE id = ?`,
      [comment, commentId],
    );

    await fetch("http://localhost:3004/notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        text: "COMMENT SUCCESSFULY UPDATED!",
        type: "COMMENT UPDATE",
        marked_needed_to_delete: 0,
      }),
    });

    return reply.code(200).send({ message: "update success" });
  } catch (error) {
    console.error("Error updating comment:", error);
    return reply.code(500).send({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.delete("/comments/:id", async (request, reply) => {
  const commentId = parseInt(request.params.id);
  if (commentId === null) {
    return reply.code(400).send({ error: "A valid comment ID is required" });
  }
  if (!isRequestBody(request.body)) {
    return reply.code(400).send({ error: "A JSON request body is required" });
  }

  const userId = parseInt(request.body.user_id);
  if (userId === null) {
    return reply.code(400).send({ error: "A valid user_id is required" });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "DELETE FROM comments WHERE id = ?",
      [commentId],
    );
    if (result.affectedRows === 0) {
      return reply.code(404).send({ error: "Comment not found" });
    }

    await fetch("http://localhost:3004/notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        text: "COMMENT SUCCESSFULY DELETED!",
        type: "COMMENT DELETE",
        marked_needed_to_delete: 0,
      }),
    });

    return reply.code(200).send({ message: "delete comment success" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return reply.code(500).send({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

async function start() {
  await app.register(cors);
  await app.listen({ port: PORT, host: "0.0.0.0" });
}

start().catch((error) => {
  console.error("Failed to start store service:", error);
  process.exitCode = 1;
});
