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


//COMMUNICATION//
//THIS IS WHERE CHECKOUT HAPPENS
app.post("/receipt/:user_id", async (req, res) => {


  console.log("CREATING RECEIPTS!");
  //GET USER CART AND CHECK IF IT IS NOT EMPTY

 //const userId2=parseInt(req.params.user_id);

  const userId  =parseInt(req.params.user_id);


  //const cartResponse = await fetch("/user/cart");
  const response = await fetch(`http://localhost:3002/cart/${encodeURIComponent(userId)}`);
  //const result = await response.json();
  //return res.status(response.status).json(result);

  if (!response.ok) {
   // throw new Error(cartItems.error || "Unable to load cart items for checkout.");
   console.error("FAILED TO GET CART ITEMS!");
     return res.status(400).json({message: "Unable to load cart items for checkout."});
  }

 const cartItems = await response.json();


  if (!Array.isArray(cartItems) || cartItems.length === 0) {
  return res.status(400).json({message: "Your cart is empty."});
   // throw new Error("Your cart is empty.");
  }

  //FROM THE CART, CHECK FOR EACH PRODUCT IN STORE EXISTS AND HAS A HIGH ENOUGH STOCK COUNT

 let totalMoneyAmount=0;
  for (const item of cartItems) {
  
    console.log("CARTITEM: ",item );
    console.log("CARTITEM PRODUCT ID: ",item.product_id );
    console.log("CARTITEM AMOUNT: ",item.amount );
    
  const individualResponse = await fetch(`http://localhost:3001/${encodeURIComponent(item.product_id)}`);

  const product = await individualResponse.json();

  console.log("PRODUCT: ",product );
  console.log("PRODUCT FIRST: ",product[0] );
  console.log("PRODUCT STOCK: ",product[0].stock );
  if(item.amount > product[0].stock ){

    console.error("NOT ENOUGH IN STOCK!");
    return res.status(400).json({message: "not enough items in stock!"});
  }

totalMoneyAmount+=product[0].cost*item.amount;

  }


  /*
  for (const item of cartItems) {
    const itemResponse = await fetch("/receipt_item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: item.product_id,
        receipt_id: receiptId,
        amount: item.amount,
      }),
    });
    const itemResult = await itemResponse.json();
    if (!itemResponse.ok) {
      throw new Error(itemResult.error || `Unable to save ${item.product_name} to the receipt.`);
    }
  }*/

    let totalAmount= 0;

  //REDUCE STOCK COUNT
  for (const item of cartItems) {
  
    console.log("CARTITEM: ",item );
    console.log("CARTITEM PRODUCT ID: ",item.product_id );
    console.log("CARTITEM AMOUNT: ",item.amount );
    totalAmount += item.amount ;
    //totalMoneyAmount  += item.amount*item.cost;


  const individualResponse = await fetch(`http://localhost:3001/${encodeURIComponent(item.product_id)}`);

  const product = await individualResponse.json();

   //UPDATE THE STOCK COUNT
  const newAmount =product[0].stock- item.amount;

  const updatedStock = await fetch(`http://localhost:3001/stock/${encodeURIComponent(item.product_id)}`,{

          method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              new_amount: newAmount
            })
  });

 if(!updatedStock.ok){
     console.error( "ERROR UPDATING STOCK.");
     return res.status(400).json({message: "ERROR UPDATING STOCK."});
 }

  //CLEAR THE USERS CART
 
  const deleteResponse = await fetch(
        //  `http://localhost:3002/cart/${id}?user_id=${encodeURIComponent(userId)}`,
         // `http://localhost:3002/cart/user_id=${encodeURIComponent(userId)}`,
         `http://localhost:3002/cart/${encodeURIComponent(userId)}`,
          {
          method: "DELETE"
          }
      );
  console.log("DELETE RESPONSE: ",deleteResponse );
  if(!deleteResponse.ok){
    console.error("ERROR IN DELETING!: ",deleteResponse);
    return res.status(400).json({message: "error deleting product"});
  }
  /*
  console.log("PRODUCT: ",product );
  console.log("PRODUCT FIRST: ",product[0] );
  console.log("PRODUCT STOCK: ",product[0].stock );
  */
  /*
  if(item.amount > product[0].stock ){

    console.error("NOT ENOUGH IN STOCK!");
    return res.status(400).json({message: "not enough items in stock!"});
  }
  */
  }


  console.log("TOTAL AMOUNT: ", totalAmount);
  console.log("TOTAL MONEY AMOUNT: ", totalMoneyAmount);

 // const totalAmount = Number(req.body.amount);
  if (!userId || !Number.isFinite(totalAmount) || totalAmount <= 0) {
    return res.status(400).json({ error: "Valid user_id and amount are required" });
  }
  console.log("-------------------APPLES AND ORANGES----------------------");

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
      await fetch('http://localhost:3004/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:  userId,
                text: "RECEIPT SUCCESSFULY CREATED!",
                type: "RECEIPT CREATION",
                marked_needed_to_delete: 0
         
            })
        });
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
});

app.post("/receipt_item/", async (req, res) => {
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

app.post("/shipment", async (req, res) => {
  console.log("SHIPMENT CREATION");
  const userId = parseId(req.body.user_id);
  const receiptId = parseId(req.body.receipt_id);

    console.log("SHIPMENT CREATION UserID: "+userId  );
    console.log("SHIPMENT CREATION receiptId: "+receiptId  );


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


     //const [rows] = await mysql.createConnection(dbConfig);
   const [rows]= await connection.execute(
      `INSERT INTO shipment
         (id, user_id, receipt_id, status, start_date, location, target_location)
       VALUES (?, ?, ?, 'BEING DELIVERED', NOW(), ?, ?)`,


   //   [userId, receiptId, randomLocation(), targetLocations[randomInt(targetLocations.length)]]
   [id, userId, receiptId, randomLocation(), randomLocation()]
    );
  console.log("SHIPMENT CREATION DONE");

////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
      await fetch('http://localhost:3004/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:  userId,
                text: "SHIPMENT STARTED!",
                type: "SHIPMENT START",
                marked_needed_to_delete: 0
         
            })
        });
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/

   return res.status(201).json(rows);

  } catch (error) {
    console.error("Error creating shipment:", error);
    return res.status(500).json({ error: "Unable to create shipment" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.delete("/shipment/cancel/:shipment_id", async (req, res) => {

  console.log("CALLING DELETE");
  const shipmentId = parseId(req.params.shipment_id);
  if (!shipmentId) {
    return res.status(400).json({ error: "Invalid shipment ID" });
  }

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

   console.log("CANCEL USER ID: ", req.body.user_id);
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
         await fetch('http://localhost:3004/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:  req.body.user_id,
                text: "SHIPMENT SUCCESSFULY CANCELLED!",
                type: "SHIPMENT CANCEL",
                marked_needed_to_delete: 0
         
            })
        });
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/

    return res.json({ shipment_id: shipmentId, status: "CANCELLED" });


  } catch (error) {
    console.error("Error cancelling shipment:", error);
    return res.status(500).json({ error: "Unable to cancel shipment" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.put("/shipment/:shipment_id", async (req, res) => {
  const shipmentId = parseId(req.params.shipment_id);
  //const status = typeof req.body.status === "string" ? req.body.status.trim() : "";
  const location = typeof req.body.location === "string" ? req.body.location.trim() : "";
  const targetLocation =
    typeof req.body.target_location === "string" ? req.body.target_location.trim() : "";

  if (!shipmentId /*|| !status*/ || !location || !targetLocation) {
    return res.status(400).json({
      error: "A valid shipment ID, status, location, and target location are required",
    });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
    //  "UPDATE shipment SET status = ?, location = ?, target_location = ? WHERE id = ?",
    "UPDATE shipment SET location = ?, target_location = ? WHERE id = ?",
      [/*status,*/ location, targetLocation, shipmentId]
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

////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
       await fetch('http://localhost:3004/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:  req.body.user_id,
                text: "SHIPMENT SUCCESSFULY UPDATED!",
                type: "SHIPMENT UPDATE",
                marked_needed_to_delete: 0
         
            })
        });
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/

    return res.json({
      shipment_id: shipmentId,
      //status,
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

app.get("/shipment/:user_id", async (req, res)=>{
  
  const id = Number.parseInt(req.params.user_id, 10);

  console.log("IIIIIIIIIID: ", id);
      connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM shipment WHERE user_id= ?",
      [id]
    );

  res.json(rows);
});

  app.get("/receipts/:user_id" , async (req, res)=>{

  const user_id = Number.parseInt(req.params.user_id, 10);

  console.log("USER ID RECEIPTS: ", user_id);
      connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM receipt WHERE user_id= ?",
      [user_id]
    );

  res.json(rows);
});


app.put("/shipment/restart/:shipment_id", async (req, res)=>{
  
  const shipment_id = Number.parseInt(req.params.shipment_id, 10);

  console.log("RESTART STATUS: ", shipment_id);
      connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "UPDATE shipment SET status=?, start_date = NOW() WHERE id= ?",
      ["BEING_DELIVERED", shipment_id]
    );


////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
       await fetch('http://localhost:3004/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:  req.body.user_id,
                text: "SHIPMENT SUCCESSFULY RESTARTED!",
                type: "SHIPMENT RESTART",
                marked_needed_to_delete: 0
         
            })
        });
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/



  res.json(rows);
});

app.delete("/shipment", async (req, res)=>{

  //const current_time = req.body.current_time;

      connection = await mysql.createConnection(dbConfig);
 await connection.execute(
      "SET SQL_SAFE_UPDATES = 0;"
    );

    const [rows] = await connection.execute(
  "DELETE FROM shipment WHERE start_date <= DATE_SUB(NOW(), INTERVAL 5 MINUTE);"
    );

////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
       await fetch('http://localhost:3004/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:  req.body.user_id,
                text: "SHIPMENT SUCCESSFULY RECIEVED!",
                type: "SHIPMENT RECIEVED",
                marked_needed_to_delete: 0
         
            })
        });
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/

  res.json(rows);

});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});