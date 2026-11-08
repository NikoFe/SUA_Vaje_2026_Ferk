const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const app = express();
const path = require("path");
const session = require ("express-session");

const STORE_PORT = 3001;
const PROFILE_PORT = 3002;
const PAYMENT_PORT = 3003;
const NOTIFICATION_PORT = 3004;

app.use(express.json());
app.use(cors())

app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "public"));

if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: './.env.test' });
} else {
  require('dotenv').config();
}

app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    name: "app.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
   cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 // 1 hour
    }
  })
);



///////////////
///////////////
////ROUTES



app.get("/", (req, res) => {
 // res.render("index");
  res.render("login");
});

app.get("/store", (req, res) => {

       res.render("store");

});
app.get('/create', async(req, res) => {
     res.render("create");

})

app.get('/login', async(req, res) => {
     res.render("login");

})


app.get('/register', async(req, res) => {
     res.render("register");

})

app.get("/single_product/:id", (req, res) => {

       id= parseInt(req.params.id)
       res.render("product", {id_param: id});
});

app.get("/payment", (req, res) => {

       id= parseInt(req.session.userId);
       res.render("payment", {id_param: id});
});

app.get("/profile", (req, res) => {


    console.log("PROFILE USER ID: ", req.session.userId);
    console.log("PROFILE USERNAME: ", req.session.username);
    console.log("PROFILE USER EMAIL: ", req.session.email);



    if(!req.session.userId || !req.session.username ||  !req.session.email){
      
       console.log("ERROR! YOU NEED TO BE LOGGED IN" );
       res.json ({message:"ERROR YOPU NEED TO BE LOGGED IN!"});
      //  res.render("profile", {user_id: req.session.userId   });
    }
    else {
       console.log("CALLING PROFILE!");
   //    id= parseInt(req.params.id)
    //   res.render("profile", {user_id: req.session.userId, username:req.session.username ,   user_email:req.session.email  });
       res.render("profile", {user_id: req.session.userId   });
       }
});





app.get('/update/:id', async (req, res) => {
    const productId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(productId)) {
        return res.status(400).send("Invalid product ID");
    }

    try {
        const response = await fetch(`http://localhost:3001/${productId}`);
        if (!response.ok) {
            return res.status(response.status).send("Failed to load product");
        }

        const products = await response.json();
        if (!products.length) {
            return res.status(404).send("Product not found");
        }

        res.render("update", { product: products[0] });
    } catch (error) {
        console.error("Error loading product for update:", error);
        res.status(502).send("Store service unavailable");
    }
});



//////////////////////////////////////
//////////////////////////////////////
///////////STORE ROUTE

app.get('/store/products', async (req, res) => {
    try {
        // Send a request to the Store REST Service
        const response = await fetch('http://localhost:3001/');

        // Check whether the request succeeded
        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Store service request failed'
            });
        }

        // Convert the response body into JavaScript objects
        const products = await response.json();

    //    console.log('123 PRODUCTS:', products);

        // Return the JSON data to the browser
        res.json(products);

    } catch (error) {
        console.error('Error contacting Store Service:', error);

        res.status(502).json({
            error: 'Store service unavailable'
        });
    }
});


app.get("/single_product/:id/information", async (req, res) => {

         id= parseInt(req.params.id)
        const response = await fetch(`http://localhost:3001/${id}`);

        // Convert the response body into JavaScript objects
        const products = await response.json();

      //  console.log('123 PRODUCTS:', products);

        // Return the JSON data to the browser
        res.json(products);

});


app.delete("/single_product/:id", async (req, res) => {

         id= parseInt(req.params.id)
        const response = await fetch(`http://localhost:3001/${id}`, {
         
          method: "DELETE"
        });

        // Convert the response body into JavaScript objects

        //const products = await response.json();

       // console.log('SERVER DELETE response:', response);

        // Return the JSON data to the browser
       // res.json(products);

        res.send("SUCCESS!")

});

app.get('/store/products/:id', async (req, res) => {
    id= parseInt(req.params.id)
  //  console.log("URL id: ||", id,"||")

    }  )


app.post('/store/products', async(req, res) => {
    try {
        const response = await fetch('http://localhost:3001/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const result = await response.json();
        res.status(response.status).json(result);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(502).json({ error: 'Store service unavailable' });
    }
});

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


app.put('/store/products/:id', async (req, res) => {

    console.log("UPDATE!!!!!!!!")
    id= parseInt(req.params.id)

   // console.log("ID ID ID:"+id);
    //console.log("req.body:"+JSON.stringify(req.body));


    try {
        const response = await fetch(`http://localhost:3001/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        console.log("BBBBBBBBB")
        //console.log("RESPONSE: ", response)



        const result = await response.json();
        res.status(response.status).json(result);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(502).json({ error: 'Store service unavailable' });
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

/////////// COMMENTS: 


app.get("/comments/", async (req, res) => {
    try {
        const response = await fetch('http://localhost:3001/comments');
        const result = await response.json();
        res.status(response.status).json(result);
    } catch (error) {
        console.error('Error loading comments:', error);
        res.status(502).json({ error: 'service unavailable' });
    }
});





app.get("/comments/:id", async (req, res) => {
    try {
        const response = await fetch(
            `http://localhost:3001/comments/${encodeURIComponent(req.params.id)}`
        );
        const result = await response.json();
        res.status(response.status).json(result);
    } catch (error) {
        console.error('Error loading comments:', error);
        res.status(502).json({ error: 'service unavailable' });
    }
});



app.post('/comments', async(req, res) => {
    const { userId, username } = req.session;
    if (!userId || !username) {
        return res.status(401).json({ error: 'Please log in to create a comment' });
    }

    try {
        const response = await fetch('http://localhost:3001/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_id: req.body.product_id,
                comment: req.body.comment,
                created_at: req.body.created_at,
                userId,
                username
            })
        });
        const result = await response.json();
        res.status(response.status).json(result);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(502).json({ error: 'service unavailable' });
    }
});

app.put('/comments/:id', async (req, res) => {

    console.log ("COMMENTS IDIDIDIDID: ",req.params.id );

    
     // console.log ("REQ BODY : ",req.body );
    try {
      //  const response = await fetch(`http://localhost:3001/comments/${encodeURIComponent(req.params.id)}`, {
            const response = await fetch(`http://localhost:3001/comments/${req.params.id}`, {
      method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...req.body, user_id: req.session.userId })
        });
        const result = await response.json();
        res.status(response.status).json(result);
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(502).json({ error: 'service unavailable' });
    }
});


app.delete("/comments/:id", async (req, res) => {

         id= parseInt(req.params.id);
  //     console.log("REQ_BODY:  ", req.body );

        console.log("DELETE USER ID: ", req.session.userId );

   try {
        const response = await fetch(`http://localhost:3001/comments/${id}`, {
          method: "DELETE",
          headers: { 'Content-Type': 'application/json' },

      //   body: JSON.stringify ({user_id: req.session.userId })
            body: JSON.stringify ({user_id: req.session.userId})
        });

        res.send("SUCCESS!")

    } catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(502).json({ error: "User service unavailable" });
    }

    //    console.log('SERVER DELETE response:', response);


});
//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
             //USER SERVICE//
//////////////////////////////////////////////////////

app.get("/user/cart", async (req, res) => {
    const { userId } = req.session;
    if (!userId) {
        return res.status(401).json({ error: "Please log in to view your cart" });
    }

    try {
        const response = await fetch(`http://localhost:3002/cart/${encodeURIComponent(userId)}`);
        const result = await response.json();
        return res.status(response.status).json(result);
    } catch (error) {
        console.error("Error loading cart:", error);
        return res.status(502).json({ error: "User service unavailable" });
    }
});


app.post("/validate", async(req,res) => { //*** */

    console.log("VALIDATION IN PROCESS!");
        const response = await fetch('http://localhost:3002/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const result = await response.json();
   // console.log("RESULT: ", result);
            if (!response.ok) {
      return res.status(502).send("Authentication service unavailable");
    }
      
    if (!result.id) {
      return res.status(401).render("login", {
        error: "Invalid username or password"
      });
    }
    //console.log("VALIDATE::: ", result);
       req.session.userId = result.id;
       req.session.username = result.username;
       req.session.email = result.email
       res.send("OK");    
})


app.post("/user/create", async(req,res) => { //*** */

        const response = await fetch('http://localhost:3002/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
      //  const result = await response.json();


            if (!response.ok) {
      return res.status(502).send("user already exists");
    }

      //console.log("RRRRRRRRR: ", req.body);

       req.session.userId = req.body.id;
       req.session.username = req.body.username;
       req.session.email = req.body.email;
       res.send("OK");    

})


app.get("/user/:id", async(req,res) => {  //*** */
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
        const response = await fetch(`http://localhost:3002/${id}`);
        const user = await response.json();
        return res.status(response.status).json(user);
    } catch (error) {
        console.error("Error loading user:", error);
        return res.status(502).json({ error: "User service unavailable" });
    }
});


app.put("/user/cart", async (req, res) => {
    const { userId } = req.session;
    if (!userId) {
        return res.status(401).json({ error: "Please log in to update your cart" });
    }

    console.log("UUUUUUUUSER user_id: ", userId);
    console.log("UUUUUUUUSER product_id: ", req.body.product_id);
    console.log("UUUUUUUUSER amount: ", req.body.amount);

    try {
        const response = await fetch(
            `http://localhost:3002/cart`,
            {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...req.body, user_id: userId })
            }
        );
        console.log("CART UPDATE RESULT: ",response );
        const result = await response.json();
        return res.status(response.status).json(result);
    } catch (error) {
        console.error("Error updating cart:", error);
        return res.status(502).json({ error: "User service unavailable" });
    }
});

app.put("/user/:id", async(req,res) => {

    console.log("USER UPDATE!");
    const id = Number.parseInt(req.params.id, 10);
    console.log("IIID!: ",id);
    console.log("USERNAME: ", req.body.username);
    console.log("EMAIL: ", req.body.email);
    console.log("PASSWORD: ", req.body.password);

    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
        const response = await fetch(`http://localhost:3002/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });



        const updated_user = await response.json();
        return res.status(response.status).json(updated_user);
    } catch (error) {
        console.error("Error loading user:", error);
        return res.status(502).json({ error: "User service unavailable" });
    }
});


/////////////////////////////
/////////USER CART//////////


app.post("/user/cart", async (req, res) => {
    const { userId } = req.session;
    if (!userId) {
        return res.status(401).json({ error: "Please log in to add items to your cart" });
    }

    try {
        const response = await fetch("http://localhost:3002/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...req.body, user_id: userId })
        });

        const result = await response.text();
        if (!response.ok) {
            return res.status(response.status).send(result || "Unable to add cart item");
        }

        return res.status(response.status).send(result || "OK");
    } catch (error) {
        console.error("Error adding cart item:", error);
        return res.status(502).json({ error: "User service unavailable" });
    }
});


app.delete("/user/cart/:id", async (req, res) => {
    const { userId } = req.session;
    const id = Number.parseInt(req.params.id, 10);
    if (!userId) {
        return res.status(401).json({ error: "Please log in to delete cart items" });
    }
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid cart item ID" });
    }

    try {
        const response = await fetch(
            `http://localhost:3002/cart/${id}?user_id=${encodeURIComponent(userId)}`,
            {
            method: "DELETE"
            }
        );

        const result = await response.json();
        if (!response.ok) {
            return res.status(response.status).json(result);
        }

        return res.status(response.status).json(result);
    } catch (error) {
        console.error("Error deleting cart item:", error);
        return res.status(502).json({ error: "User service unavailable" });
    }
});



app.delete("/user/cart/", async (req, res) => {
    const { userId } = req.session;
    if (!userId) {
        return res.status(401).json({ error: "Please log in to delete your cart" });
    }

    try {
        const response = await fetch(
            `http://localhost:3002/cart/all/${encodeURIComponent(userId)}`,
            {
            method: "DELETE"
            }
        );


        if (!response.ok) {
            return res.status(response.status).json(result);
        }

        return res.status(response.status).json(result);
    } catch (error) {
        console.error("Error deleting cart:", error);
        return res.status(502).json({ error: "User service unavailable" });
    }
});


 /////////////payment:

 app.post("/receipt", async (req, res) => {
     console.log("PAYMENT RECEIPT: amount:", req.body.amount, "USER ID: ", req.session.userId);
     if (!req.session.userId) {
         return res.status(401).json({ error: "Please log in to check out" });
     }

     const amount = Number(req.body.amount);
     if (!Number.isFinite(amount) || amount <= 0) {
         return res.status(400).json({ error: "A valid checkout amount is required" });
     }

     try {
         const response = await fetch(
             `http://localhost:3003/receipt`,
             {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ amount, user_id: req.session.userId })
             }
         );

    console.log("RESPONSE: ", response)
    //const result = await response.json();
         const result = await response.json();

              console.log("RESULT: ", result)
         return res.status(response.status).json(result);
     } catch (error) {
         console.error("Error contacting payment service:", error);
         return res.status(502).json({ error: "Payment service unavailable" });
     }
 });


 app.post("/receipt_item", async (req, res) => {
    try {
        const response = await fetch("http://localhost:3003/receipt_item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                product_id: req.body.product_id,
                receipt_id: req.body.receipt_id,
                amount: req.body.amount
            })
        });
        const result = await response.json();
        return res.status(response.status).json(result);
    } catch (error) {
        console.error("Error contacting payment service for receipt item:", error);
        return res.status(502).json({ error: "Payment service unavailable" });
    }
 });

 app.post("/shipment", async (req, res) => {

    console.log("USER SESSION: ", req.session.userId );
    try {
        const response = await fetch("http://localhost:3003/shipment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: req.session.userId,
                receipt_id: req.body.receipt_id,
            })
        });
        const result = await response.json();
        console.log("SHIPMENT RESULT: ",result );
        return res.status(response.status).json(result);
    } catch (error) {
        console.error("Error contacting payment service for receipt item:", error);
        return res.status(502).json({ error: "Payment service unavailable" });
    }
 });




 app.get("/shipment/", async (req, res) => {

  const id = Number.parseInt(req.params.id, 10);

    

        const response = await fetch("http://localhost:3003/shipment/"+req.session.userId,{
     
        });
        const result = await response.json();
        console.log("SHIPMENT GET RESULT: ",result );
        return res.status(response.status).json(result);


        /*
    } catch (error) {
        console.error("Error contacting payment service for receipt item:", error);
        return res.status(502).json({ error: "Payment service unavailable" });
    }*/
 });

app.put("/shipment/:shipment_id", async (req, res) => {
    const shipment_id = Number(req.params.shipment_id);
    if (!Number.isSafeInteger(shipment_id) || shipment_id <= 0) {
        return res.status(400).json({ error: "Invalid shipment ID" });
    }

    try {
        const response = await fetch(
            `http://localhost:3003/shipment/${encodeURIComponent(shipment_id)}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...req.body, user_id: req.session.userId })
            }
        );
        const result = await response.json();
        return res.status(response.status).json(result);
    } catch (error) {
        console.error("Error contacting payment service to update shipment:", error);
        return res.status(502).json({ error: "Payment service unavailable" });
    }
});


  app.delete("/shipment/cancel/:shipment_id", async(req, res)=>{
    console.log("CALLING DELETE");
   
    const shipment_id = Number(req.params.shipment_id);
    if (!Number.isSafeInteger(shipment_id) || shipment_id <= 0) {
        return res.status(400).json({ error: "Invalid shipment ID" });
    }

    try {
        const response = await fetch(
            `http://localhost:3003/shipment/cancel/${encodeURIComponent(shipment_id)}`,
            { method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({user_id: req.session.userId})
             }
        );
        const result = await response.json();
        console.log("SHIPMENT DELETE RESULT: ",result );
        return res.status(response.status).json(result);
    } catch (error) {
        console.error("Error contacting payment service to cancel shipment:", error);
        return res.status(502).json({ error: "Payment service unavailable" });
    }
  })


  app.delete("/shipment", async(req, res)=>{
    console.log( "DELETING EXPIRED");
   
    const response = await fetch(
            `http://localhost:3003/shipment`,
            { method: "DELETE" }
        );
       const result = await response.json();
        console.log("SHIPMENT DELETE RESULT: ",result );
        return res.status(response.status).json(result);



  })



  app.put("/shipment/restart/:shipment_id" , async (req, res)=>{

    //const shipment_id = req.body.shipment_id;
    const shipment_id = Number(req.params.shipment_id);
    console.log("RESTART SHIPMENT ID: ", shipment_id);
        const response = await fetch(
           // `http://localhost:3003/shipment/restart/${encodeURIComponent(shipment_id)}`,
           `http://localhost:3003/shipment/restart/${shipment_id}`,
            { method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({user_id: req.session.userId})
             }
        );

        const result = await response.json();
        console.log("SHIPMENT RESTART RESULT: ",result );
        return res.status(response.status).json(response);


  })


// add user_id later
  app.get("/receipts/" , async (req, res)=>{
    if (!req.session.userId) {
        return res.status(401).json({ error: "Please log in to view receipts" });
    }

    console.log("GETTING RECEIPTS FOR USER WITH ID: ", req.session.userId);
    try {
        const response = await fetch(
            `http://localhost:3003/receipts/${encodeURIComponent(req.session.userId)}`
        );

        const result = await response.json();
        return res.status(response.status).json(result);
    } catch (error) {
        console.error("Error contacting payment service for receipts:", error);
        return res.status(502).json({ error: "Payment service unavailable" });
    }
 });

async function forwardNotificationRequest(res, path, options = {}) {
    try {
        const response = await fetch(`http://localhost:${NOTIFICATION_PORT}${path}`, options);
        const result = await response.json();
        return res.status(response.status).json(result);
    } catch (error) {
        console.error("Error contacting notification service:", error);
        return res.status(502).json({ error: "Notification service unavailable" });
    }
}

function requireNotificationUser(req, res) {
    if (!req.session.userId) {
        res.status(401).json({ error: "Please log in to manage notifications" });
        return null;
    }
    return req.session.userId;
}

app.get("/notification", (req, res) => {
    const userId = requireNotificationUser(req, res);
    if (!userId) return;
    return forwardNotificationRequest(
        res,
        `/notification/${encodeURIComponent(userId)}`
    );
});

app.post("/notification", (req, res) => {
    const userId = requireNotificationUser(req, res);
    if (!userId) return;
    return forwardNotificationRequest(
        res,
        `/notification/${encodeURIComponent(userId)}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
        }
    );
});

app.delete("/notification", (req, res) => {
    const userId = requireNotificationUser(req, res);
    if (!userId) return;
    return forwardNotificationRequest(
        res,
        `/notification?user_id=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
    );
});

app.delete("/notification/:notification_id", (req, res) => {
    const userId = requireNotificationUser(req, res);
    if (!userId) return;
    const notificationId = Number(req.params.notification_id);
    if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
        return res.status(400).json({ error: "Invalid notification ID" });
    }
    return forwardNotificationRequest(
        res,
        `/notification/${encodeURIComponent(notificationId)}?user_id=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
    );
});

app.get("/notification_preferences", (req, res) => {
    const userId = requireNotificationUser(req, res);
    if (!userId) return;
    return forwardNotificationRequest(
        res,
        `/notification_preferences/${encodeURIComponent(userId)}`
    );
});

app.post("/notification_preferences", (req, res) => {
    const userId = requireNotificationUser(req, res);
    if (!userId) return;
    return forwardNotificationRequest(
        res,
        `/notification_preferences/${encodeURIComponent(userId)}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
        }
    );
});

app.put("/notification_preferences", (req, res) => {
    const userId = requireNotificationUser(req, res);
    if (!userId) return;
    return forwardNotificationRequest(
        res,
        `/notification_preferences/${encodeURIComponent(userId)}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
        }
    );
});

app.delete("/notification_preferences", (req, res) => {
    const userId = requireNotificationUser(req, res);
    if (!userId) return;
    return forwardNotificationRequest(
        res,
        `/notification_preferences/${encodeURIComponent(userId)}`,
        { method: "DELETE" }
    );
});

app.get("/session_id" , async (req, res )=>{

 res.json ({userId:req.session.userId});
    
})







const PORT = process.env.PORT || 3010;

app.listen(PORT, () => {
  console.log(`OK Server is running on http://localhost:${PORT}`);
});