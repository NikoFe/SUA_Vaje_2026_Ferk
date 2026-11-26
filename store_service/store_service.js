const Fastify = require("fastify");
const cors = require("@fastify/cors");
const mysql = require("mysql2/promise");
const swaggerJsdoc = require("swagger-jsdoc");
const fastifySwagger = require("@fastify/swagger");
const fastifySwaggerUi = require("@fastify/swagger-ui");

const app = Fastify({ logger: true });
const PORT = 3001;
const swaggerDocs = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Store Service API",
      version: "1.0.0",
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: [__filename],
});

app.register(fastifySwagger, {
  openapi: {
    info: swaggerDocs.info,
    servers: swaggerDocs.servers,
  },
  transformObject: () => swaggerDocs,
});
app.register(fastifySwaggerUi, { routePrefix: "/api-docs" });

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

/**
 * @swagger
 * /stock/{product_id}:
 *   put:
 *     tags: [Products]
 *     summary: Set a product's stock amount
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [new_amount]
 *             properties:
 *               new_amount:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       '200':
 *         description: Stock updated
 *       '400':
 *         description: Invalid product ID or stock amount
 *       '404':
 *         description: Product not found
 *       '500':
 *         description: Unable to update stock
 */
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

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Products]
 *     summary: List all products
 *     responses:
 *       '200':
 *         description: Product records
 *       '500':
 *         description: Unable to get products
 */
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

/**
 * @swagger
 * /{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Product record
 *       '400':
 *         description: Invalid product ID
 *       '404':
 *         description: Product not found
 *       '500':
 *         description: Unable to get product
 */
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

/**
 * @swagger
 * /comments:
 *   get:
 *     tags: [Comments]
 *     summary: List all product comments
 *     responses:
 *       '200':
 *         description: Comment records
 *       '500':
 *         description: Unable to get comments
 */
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

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     tags: [Comments]
 *     summary: List comments for a product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product ID
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Comments for the product
 *       '400':
 *         description: Invalid product ID
 *       '500':
 *         description: Unable to get comments
 */
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

/**
 * @swagger
 * /{id}:
 *   post:
 *     tags: [Products]
 *     summary: Create a product (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user whose admin status is checked
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, cost, kilograms, allergens, kilojoules, vitamins, stock, discount, image_path]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               cost:
 *                 type: number
 *               kilograms:
 *                 type: number
 *               allergens:
 *                 type: string
 *               kilojoules:
 *                 type: number
 *               vitamins:
 *                 type: string
 *               stock:
 *                 type: number
 *               discount:
 *                 type: number
 *               image_path:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Product created
 *       '400':
 *         description: Invalid user ID or request body
 *       '401':
 *         description: Authentication is required
 *       '403':
 *         description: Admin privileges are required
 *       '502':
 *         description: User service unavailable
 *       '500':
 *         description: Unable to create product
 */
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

/**
 * @swagger
 * /{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product (admin only)
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
 *             required: [user_id, name, description, cost, kilograms, allergens, kilojoules, vitamins, stock, discount, image_path]
 *             properties:
 *               user_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               cost:
 *                 type: number
 *               kilograms:
 *                 type: number
 *               allergens:
 *                 type: string
 *               kilojoules:
 *                 type: number
 *               vitamins:
 *                 type: string
 *               stock:
 *                 type: number
 *               discount:
 *                 type: number
 *               image_path:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Product updated
 *       '400':
 *         description: Invalid product ID or body
 *       '401':
 *         description: Authentication is required
 *       '403':
 *         description: Admin privileges are required
 *       '404':
 *         description: Product not found
 *       '502':
 *         description: User service unavailable
 *       '500':
 *         description: Unable to update product
 */
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

/**
 * @swagger
 * /{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (admin only)
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
 *             required: [user_id]
 *             properties:
 *               user_id:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: Product deleted
 *       '400':
 *         description: Invalid product ID or request body
 *       '401':
 *         description: Authentication is required
 *       '403':
 *         description: Admin privileges are required
 *       '404':
 *         description: Product not found
 *       '502':
 *         description: User service unavailable
 *       '500':
 *         description: Unable to delete product
 */
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

/**
 * @swagger
 * /comments:
 *   post:
 *     tags: [Comments]
 *     summary: Create a product comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, userId, username, comment, created_at]
 *             properties:
 *               product_id:
 *                 type: integer
 *               userId:
 *                 type: integer
 *               username:
 *                 type: string
 *               comment:
 *                 type: string
 *               created_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       '201':
 *         description: Comment created
 *       '400':
 *         description: Invalid comment data
 *       '500':
 *         description: Unable to create comment
 */
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

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     tags: [Comments]
 *     summary: Update a comment
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
 *             required: [user_id, comment]
 *             properties:
 *               user_id:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Comment updated
 *       '400':
 *         description: Invalid comment ID or body
 *       '404':
 *         description: Comment not found
 *       '500':
 *         description: Unable to update comment
 */
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

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     tags: [Comments]
 *     summary: Delete a comment
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
 *             required: [user_id]
 *             properties:
 *               user_id:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: Comment deleted
 *       '400':
 *         description: Invalid comment ID or user ID
 *       '404':
 *         description: Comment not found
 *       '500':
 *         description: Unable to delete comment
 */
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
