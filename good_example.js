app.get("/status/:user_id", async (req, res) => {//*** */
  const id = Number(req.params.user_id);
  
  /*
     if (id === null) {
    return res.status(401).json({ error: "A valid user_id is required" });
  }*/

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: "A valid user_id is required" });
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
    return res.json({ status: rows[0].status });
  } catch (error) {
    console.error("Error getting user status:", error);
    return res.status(500).json({ error: "Unable to get user status" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
})