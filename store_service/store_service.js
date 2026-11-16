const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const swaggerJsdoc = require ("swagger-jsdoc")
const swaggerUi =require ("swagger-ui-express")

const app = express();
const PORT = 3001;


if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: './.env.test' });
} else {
  require('dotenv').config({ path: './.env' });
}

const dbConfig = {
  host:  `${process.env.DB_HOST}`,
  user:  `${process.env.DB_USER}`,
  password:  `${process.env.DB_PASSWORD}` ,
  database:  `${process.env.DB_NAME}` ,
  decimalNumbers: true // <<< ADD THIS
};

app.use(express.json());
app.use(cors())


  app.get('/',async (req, res) => {
 console.log("AAAAA!:")
try {
    const connection = (await mysql.createConnection(dbConfig));
    //const [rows] = await connection.execute("SHOW TABLES");
     console.log("B!:")
    const [rows] = await connection.execute("SELECT * FROM product");
    //await connection.end();
    console.log("ROWS: ",rows)
    res.json(rows);
  } catch (error) {
    console.error("Error getting products!", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
  })

//app.get('/store/:id', async (req, res) => {
app.get('/:id', async (req, res) => {
    id= parseInt(req.params.id)
    console.log("URL id: ||", id,"||")
    try {
      const connection =(await mysql.createConnection(dbConfig));
      const [rows] =  await connection.execute(
        "SELECT * FROM product WHERE id = ?",
        [id]
      );
      console.log("ROWS: ",rows)
      res.json(rows);
    } catch (error) {
      console.error("Error getting specific product:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }

  })


app.get('/comments', async (req, res) => {

    try {
      const connection =(await mysql.createConnection(dbConfig));
      const [rows] =  await connection.execute(
        "SELECT * FROM comments;"
        
      );
    // console.log("ROWS: ",rows)
      res.json(rows);
    } catch (error) {
      console.error("Error getting  products:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }

  })

app.get('/comments/:id', async (req, res) => {
    id= parseInt(req.params.id)
    console.log("URL id: ||", id,"||")
    try {
      const connection =(await mysql.createConnection(dbConfig));
      const [rows] =  await connection.execute(
        "SELECT * FROM comments WHERE product_id = ?",
        [id]
      );
    // console.log("ROWS: ",rows)
      res.json(rows);
    } catch (error) {
      console.error("Error getting specific product:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }

  })

app.post('/', async (req, res) => {
  console.log("CREATING IN STORE")
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
    image_path
  } = req.body;

    const id = Math.floor(Math.random() * 100000);
console.log (JSON.stringify(req.body))

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `INSERT INTO product
       (id, name, description, cost, kilograms, allergens, kilojoules, vitamins, stock, discount, image_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, description, cost, kilograms, allergens, kilojoules, vitamins, stock, discount, image_path]
    );

///||||///

    res.status(201).json({ message: 'Product created', id });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.put('/:id', async (req, res) => {
    console.log("OOOO change_amount");
    current_id= parseInt(req.params.id)

    try {
      //  const user_id = req.headers['user_id'];
        const { name,description, cost,kilograms,allergens,kilojoules, vitamins ,stock,discount,image_path } = req.body;


        const connection = await mysql.createConnection(dbConfig);

        await connection.execute(
            `UPDATE product
             SET name = ?, description = ?, cost = ?, kilograms = ?, allergens = ?, kilojoules = ?, vitamins = ?, stock = ?, discount = ?,image_path = ?
             WHERE id = ?`,
            [
                name,description, cost,kilograms,allergens,kilojoules, vitamins ,stock,discount, image_path, current_id
            ]
        );

        await connection.end();



        res.json({ message: "update success" });

    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



app.delete('/:id', async(req, res) => {

  const db = await mysql.createConnection(dbConfig);
  try {

  console.log(req.params)
   const {id } = req.params;


  await db.execute(
    "DELETE FROM product WHERE id = ?",
    [id]
  );

  ///|||///

  console.log("Successfully deleted")
  res.json({ message: "delete meal success" }); // 
  } catch (error) {
    console.error("Error in delete:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }finally {
    await db.end();
  }
})


process.on('SIGINT', () => {
   console.log('Closing MySQL connection');
   connection.end(err => {
     if (err) console.error('Error during disconnection:', err);
     process.exit();
   });
 });

///////////////////////////////////////

app.post('/comments', async (req, res) => {
  console.log("CREATING COMMENT")
  const {
    product_id,
    userId,
    username,
    comment,
    created_at
  } = req.body;

  console.log("PRODUCT_ID: ", product_id);
  console.log("COMMENT: ", comment);
  console.log("USER_ID: ", userId);
  console.log("USERNAME: ", username);
  console.log("CREATED_AT: ", created_at);

const id = Math.floor(Math.random() * 100000);
console.log (JSON.stringify(req.body))

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `INSERT INTO comments
       (id, product_id, user_id, comment, username, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, product_id, userId, comment, username, created_at]
    );

 console.log ("SO FAR SO GOOD");


 ///|||///

////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
        await fetch('http://localhost:3004/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:  userId,
                text: "COMMENT SUCCESSFULY CREATED!",
                type: "COMMENT CREATION",
                marked_needed_to_delete: 0
         
            })
        });
        const result = await response.json();
       console.log("NOTIFICATION CREATION!!!!: ",result);
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/


        res.status(response.status).json(result);

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.put('/comments/:id', async(req, res) => {
  //console.log("OOOO deleteMeal")
  //console.log("delete gateway")

  const {
    comment,
    user_id
  } = req.body;


  const db = await mysql.createConnection(dbConfig);

  try {

   const {id } = req.params;
  

  await db.execute(
    `
UPDATE comments
SET comment = ?
WHERE id = ?;
    `,
    [comment, id]
  );

  //console.log("Successfully updated")


////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/


console.log("NNNNNNNNNNN USER ID: ",user_id )

        const response = await fetch('http://localhost:3004/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:  user_id,
                text: "COMMENT SUCCESSFULY UPDATED!",
                type: "COMMENT UPDATE",
                marked_needed_to_delete: 0
         
            })
        });
        const result = await response.json();

      // console.log("NOTIFICATION CREATION!!!!: ",result);

        res.status(response.status).json(result);
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/

  res.json({ message: "update  success" }); // 
  } catch (error) {
    console.error("Error in UPDATE:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }finally {
    await db.end();
  }
})


app.delete('/comments/:id', async(req, res) => {


  console.log("REQ BODY:   ", req.body);
  const {user_id}= req.body;
  const db = await mysql.createConnection(dbConfig);


   console.log("DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDELETEDELETEDELETE!!!!");
   const {id} = req.params;
   console.log("id!!!!: ", id);

  await db.execute(
    "DELETE FROM comments WHERE id = ?",
    [id]
  );


////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/


console.log("NNNNNNNNNNN USER ID: ",user_id )

        const response = await fetch('http://localhost:3004/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:  user_id,
                text: "COMMENT SUCCESSFULY DELETED!",
                type: "COMMENT DELETE",
                marked_needed_to_delete: 0
         
            })
        });
        const result = await response.json();

      // console.log("NOTIFICATION CREATION!!!!: ",result);

        res.status(response.status).json(result);
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO/

  res.json({ message: "delete comment success" }); // 

});



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
})
//////////////////////////////
