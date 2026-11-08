const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const swaggerJsdoc = require ("swagger-jsdoc")
const swaggerUi =require ("swagger-ui-express")

const router = express.Router();


//const app = express();
const STORE_PORT = 3001;

/*
app.get("/", (req, res) => {
  res.send("Hello, Express!");
});*/

const dbConfig = {
  host:  `${process.env.DB_HOST}`,
  user:  `${process.env.DB_USER}`,
  password:  `${process.env.DB_PASSWORD}` ,
  database:  `${process.env.DB_NAME}` ,
  decimalNumbers: true // <<< ADD THIS
};





///////////////////////////////////////

/*
router.get('/',async (req, res) => {
 console.log("FETCHING MEALS!:")
try {
    const connection = (await mysql.createConnection(dbConfig));
    //const [rows] = await connection.execute("SHOW TABLES");
    const [rows] = await connection.execute("SELECT * FROM product");
    //await connection.end();
    console.log("ROWS: ",rows)
    res.json(rows);
  } catch (error) {
    console.error("Error getting products!", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
  })*/

router.get('/:id', async (req, res) => {
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

  router.post('/', async(req, res) => {
   console.log("POSTING USERS!")
   console.log("req.body: "+req.body )
   const {name,description, cost,kilograms,allergens,kilojoules, vitamins ,stock,discount,image_path} = req.body
    try {
      const connection =(await mysql.createConnection(dbConfig));
      const newId = Math.floor(Math.random() * 100000);
      const [rows] = await connection.execute(
      //  "INSERT INTO uporabnik (id, ime, lokacija, geslo, odobreno) VALUES (?, ?, ?, ?, ?)",
        "INSERT INTO product (id,name,description, cost,kilograms,allergens,kilojoules, vitamins ,stock,discount,image_path) VALUES (?, ?, ?, ?, ?, ?, ?,?,?,?,?)",
        [newId,name,description, cost,kilograms,allergens,kilojoules, vitamins ,stock,discount,image_path ]
      );
      console.log("POST PRODUCT result: ",rows)
      res.json(rows);
    } catch (error) {
      console.error("Error posting product :", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  })

/*
PUT
    {
        "name": "blueberries",
        "description": "a bag of blueberries",
        "cost": 5.5,
        "kilograms": 0.35,
        "alergens": "none",
        "kilojoules": 9000,
        "vitamins": "K",
        "stock": 250,
        "discount": 5,
        "image_path": "./blueberries.png"
    }
    */




router.put('/:id', async (req, res) => {
    console.log("OOOO change_amount");
    id= parseInt(req.params.id)

    try {
      //  const user_id = req.headers['user_id'];
        const { name,description, cost,kilograms,alergens,kilojoules, vitamins ,stock,discount,image_path } = req.body;

        const connection = await mysql.createConnection(dbConfig);

        await connection.execute(
            `UPDATE product
             SET name = ?, description = ?, cost = ?, kilograms = ?, allergens = ?, kilojoules = ?, vitamins = ?, stock = ?, discount = ?,image_path = ?
             WHERE id = ?`,
            [
                name,description, cost,kilograms,alergens,kilojoules, vitamins ,stock,discount, image_path, id
            ]
        );

        await connection.end();

     //   console.log("OOOO user_has_meal_value SUCCESS");

        res.json({ message: "update success" });

    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/*
PUT
    {
        "name": "A chickpeas",
        "description": "B a bag of chickpeas",
        "cost": 100.5,
        "kilograms": 0.10,
        "alergens": "C none",
        "kilojoules": 6000,
        "vitamins": "D",
        "stock": 1000,
        "discount": 10,
        "image_path": "./chickpeas.png"
    }
    */
router.delete('/:id', async(req, res) => {
  //console.log("OOOO deleteMeal")
  //console.log("delete gateway")
  const db = await mysql.createConnection(dbConfig);
  try {

  console.log(req.params)
   const {id } = req.params;
   /*
  const userId = parseInt(user_id.trim() , 10);
  const mealId = parseInt(meal_id.trim() , 10)
   */

  await db.execute(
    "DELETE FROM product WHERE id = ?",
    [id]
  );


  console.log("Successfully deleted")
  res.json({ message: "delete meal success" }); // 
  } catch (error) {
    console.error("Error in delete:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }finally {
    await db.end();
  }
})






/*
app.put('/store',async (req, res) => {

  try {
 const {name,description, cost,kilograms,allergens,kilojoules, vitamins ,stock,discount } = req.body;
    //  console.log("UpdateZaloga user_id: ", user_id);
    //  console.log("UpdateZaloga meal_id: ", meal_id);
    //  console.log("UpdateZaloga amount: ", amount);

      const connection = await mysql.createConnection(dbConfig);

      await connection.execute("UPDATE product SET name = ?, description = ?, cost = ?, kilograms = ?, name = ?, name = ?, name = ?, name = ?, name = ?,              WHERE id = ?", [
        amount,
        meal_id,
      ]);

      await connection.execute(
        "UPDATE uporabnik_has_jed SET odobreno = 1 WHERE uporabnik_id=? AND jed_id = ?;",
        [user_id, meal_id]
      );
      await connection.end();
      console.log("OOOO updateZaloga SUCCESS")
      res.json({ message: "update zaloga success" }); // 
  } catch (error) {
    console.error("Error updating zaloga:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
  })
*/



process.on('SIGINT', () => {
   console.log('Closing MySQL connection');
   connection.end(err => {
     if (err) console.error('Error during disconnection:', err);
     process.exit();
   });
 });



///////////////////////////////////////
/*
router.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
})*/
//////////////////////////////

module.exports = router