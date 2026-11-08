const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = 3002;

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

//app.get(/)

/*
app.get("/", async (req, res) => { 
  connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute(`SELECT * FROM  users`);

  res.json(rows);
});*/

//app.get(/:id)




////////////////////////////////////////
///////////////////////////////////////
/////////CARTS:////////////////////////


app.post("/cart", async (req, res) => { //**** */
  console.log("cart creation in process");
  const { user_id,  product_id, product_name, amount } = req.body;

  let connection;


   const id = Math.floor(Math.random() * 100000);


  connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute(
    `
    INSERT INTO cart_item VALUES (?,? ,?, ?, ?);
    `,
    [id, user_id, product_id,product_name,amount ],
  );
  //const result = await response.json();

  if (rows.length == 0) {
    // return  res.send("ERRROR")
    return "ERROR";
  }


////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
        const response = await fetch('http://localhost:3004/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:  user_id,
                text: "ADDING NEW ELEMENT TO CART!",
                type: "NEW CART ITEM",
                marked_needed_to_delete: 0
         
            })
        });
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/

  console.log("element: ", rows[0]);
  res.json(rows[0]);

  //res.status(201).json({ output: result });
});

app.get("/cart/:id", async (req, res) => {//*** */
  
  console.log("GETTIGN CART ITEMS!");
  const id = parseInt(req.params.id);
  let connection;
  connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute(
    `
    SELECT * FROM cart_item WHERE user_id= ?;
    `,
    [id]
  );
  console.log("CCCCART: ", rows)

    res.json(rows);

})


app.delete("/cart/all/:user_id", async (req, res) => {//*** */
  const user_id = Number.parseInt(req.params.user_id, 10);
  if (Number.isNaN(user_id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const connection = await mysql.createConnection(dbConfig);
  const [result] = await connection.execute(
    "DELETE FROM cart_item WHERE user_id = ?",
    [user_id]
  );

////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
        const response = await fetch('http://localhost:3004/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:  user_id,
                text: "CART SUCCESSFULY CLEARED!",
                type: "CART EMPTIED",
                marked_needed_to_delete: 0
         
            })
        });
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/

  return res.json({ deleted: result.affectedRows });
});



app.delete("/cart/:id", async (req, res) => {//*** */
  const id = Number.parseInt(req.params.id, 10);
  const user_id = Number.parseInt(req.query.user_id, 10);
  if (Number.isNaN(id) || Number.isNaN(user_id)) {
    return res.status(400).json({ error: "Invalid cart item or user ID" });
  }

  const connection = await mysql.createConnection(dbConfig);
  const [result] = await connection.execute(
    "DELETE FROM cart_item WHERE id = ? AND user_id = ?",
    [id, user_id]
  );


////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
        const response = await fetch('http://localhost:3004/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:  user_id,
                text: "CART ITEM SUCCESSFULY DELETE!",
                type: "CART ITEM DELETED",
                marked_needed_to_delete: 0
         
            })
        });
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/



  return res.json({ deleted: result.affectedRows });
});


app.put("/cart", async (req, res) => {//*** */

  const {user_id, product_id, amount } = req.body;

  console.log("UUUUPDATING CART ITEM!!! user_id: ", user_id);

  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute(
      "SELECT * FROM cart_item WHERE product_id = ? AND user_id = ?",
      [product_id, user_id]
    );

  console.log("UUUUP rows length: ", rows.length );

    if (rows.length > 0) {
      
      const currentAmount = rows[0].amount;
      const newAmount = currentAmount + amount;
      await connection.execute(
        "UPDATE cart_item SET amount = ? WHERE product_id = ? AND user_id = ?",
        [newAmount, product_id, user_id]
      );


////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
        const response = await fetch('http://localhost:3004/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id:  user_id,
                text: "CART SUCCESSFULY UPDATED!",
                type: "CART UPDATE",
                marked_needed_to_delete: 0
         
            })
        });
        const result = await response.json();
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/





    }





    return res.json({ count: rows.length });
  } finally {
    await connection.end();
  }
});

//////////////////////////////
//////////////////////////////
//////////////////////////////


app.get("/:id", async (req, res) => {  //**** 
  console.log("||||||||||| GETTING SINGLE USER!");
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute(`SELECT * FROM  users WHERE id= ?`, [
    id,
  ]);

  console.log("WWWWWWW: ", rows);
  if (rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(rows[0]);
});

app.post("/validate", async (req, res) => { //*** */
  console.log("validation in process");
  const { username, password } = req.body;

  let connection;

  connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute(
    `SELECT * FROM  users WHERE username=? AND password=?`,
    [username, password],
  );
  console.log("ROWS: ", rows);
  //const result = await response.json();

  if (rows.length == 0) {
    // return  res.send("ERRROR")
    res.json(rows);
    return "ERROR";
  }

  console.log("element: ", rows[0]);
  res.json(rows[0]);

  //res.status(201).json({ output: result });
});

app.post("/create", async (req, res) => { /*** */
  console.log("creation process");
  const {id, username, email, password,user_id } = req.body;

  let connection;

  connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute(
    `SELECT * FROM  users WHERE username=? OR email=?`,
    [username, email],
  );
  //const result = await response.json();

  if (rows.length > 0) {
    // return  res.send("ERRROR")
    res.status(405).json({ output: "USER ALREADY EXISTS!!!" });
  } else {
    console.log("CREATING USER!");

    //console.log("ID: ", id);
    console.log("USERNAME: ", username);
    console.log("EMAIL: ", email);

    const [rows] = await connection.execute(
      `INSERT INTO users VALUES (?, ?, ?, ?, "user", 0)`,

      [id, username, password, email],
    );
    res.status(201).json({ output: rows });
  }

});

/* 
app.delete("/:id", async (req, res) => { //NOT USED
  id = parseInt(req.params.id);

  let connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute(
    `
      UPDATE users
SET deleted = "true"
WHERE id = ?;
      `,
    [id],
  );
  res.json({ message: "success" });
});*/


app.put("/:id", async (req, res) => { /**** */

  const id = parseInt(req.params.id);
  console.log("updating user in process");
  console.log("ID: ", id);
  const { username, password, email } = req.body;

     console.log("")


     let connection = await mysql.createConnection(dbConfig);
    const [rows]= await connection.execute(
      `
      UPDATE users
SET username =?, password = ?, email = ? WHERE id = ?
      `,
      [username,password, email, id]
    );
    
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
        const response = await fetch('http://localhost:3004/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:  id,
                text: "USER SUCCESSFULY UPDATED!",
                type: "USER UPDATE",
                marked_needed_to_delete: 0
         
            })
        });
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/

  res.json(rows);

});

/*
app.put("/admin/:id", async (req, res) => { //NOT USED
  id = parseInt(req.params.id);

     let connection = await mysql.createConnection(dbConfig);
    const [rows]= await connection.execute(
      `
      UPDATE users
SET status = "admin" WHERE id = ?
      `,
      [id]
    );
  res.json({ message: "success" });

});
*/

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});