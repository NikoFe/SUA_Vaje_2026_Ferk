
   async function call(){
   try {
    console.log("ATTEMPT!!!!");

   const response = await fetch('http://localhost:3010/store/products')  
   
    console.log("RRRR Response:", response);
    
    if (!response.ok) {
     // print ("RESPONSE" ,response)
     console.log("RESPONSE" ,response)
      throw new Error('Failed to load products')

    }
    const products = await response.json();
  for (let product  of products) {

    console.log("pppppp: ", product)
   create(product.id,product.name, product.description, product.cost,product.kilograms, product.allergens,product. kilojoules, product.vitamins ,product.stock,product.discount,product.image_path     );


  }

    //print("/////////////////////////////////////////////////")
    console.log("Response body:", response.body);
    console.log("Response JSON:", products);

    //alert("Products loaded: " + products.length);

  } catch (error) {
    console.error("Error fetching products:", error);
    alert("Failed to load products: " + error.message);
  }
   }

        function redirectToProduct(id) {
            window.location.href = 
               `http://localhost:3010/single_product/${id}`;
        }



  function create(id,name,description, cost,kilograms,allergens,kilojoules, vitamins ,stock,discount,image_path){
   productsList=document.getElementById("products-list")


   console.log("CREATING!")
   const product = document.createElement('div');
   product.className = 'product-card';
   product.classList.add('product-card');
   

//name
   const card_name = document.createElement('h3');
   card_name.textContent = name;
   

   const card_description = document.createElement('p');
   card_description.textContent = description;


   // Create the price
   const card_cost = document.createElement('p');
   card_cost.textContent = cost;

   // Create the image
   const image = document.createElement('img');

   image.className = 'product-card-image';
   image.src = getProductImageUrl(image_path);
   //image.src = './blueberries.png';
   image.alt = 'Blueberries';
   

   const product_side_div = document.createElement('div');
   product_side_div.className ='product-side-div';
    

   const product_details_button = document.createElement('button');
   product_details_button.innerHTML="DETAILS"
   product_details_button.onclick = ()=> redirectToProduct(id);

   product_details_button.className ='product-button-div';
    
   //product_side_div.append( card_name, card_description, card_cost,card_kilograms, card_allergens,card_kilojoules,card_vitamis,card_stock,card_discount );
   product_side_div.append( card_name, card_description, card_cost, product_details_button);

   // Put the elements inside the product card
   product.append(image,product_side_div);
   
   // Insert the product card into the list
   productsList.appendChild(product);
  }
   console.log("OOOOOOOOO")


////////////////////////////////////


/*
async function getNotifications(){



}*/


  async function getNotifications(){

     const notifiactionDiv = document.getElementById("notifications");
     notifiactionDiv.innerHTML ="" ;


      const response = await fetch("http://localhost:3010/notification");
      const result = await response.json();
      console.log("NOTIFICATION RESULT: ",result );


      if (!response.ok) {
        throw new Error(result.error || `Request failed: ${response.status}`);
      }
      if (!Array.isArray(result)) {
        throw new Error("The receipts service returned data in an unexpected format.");
      }

      const list = document.createElement("ul");
      result.slice(0, 3).forEach((notification) => {
      let listItem = document.createElement("li");

        listItem.textContent =
          ` Notification text: ${notification.text}, type:${notification.type} `;

      let markReadButton= document.createElement("button");
      markReadButton.textContent ="MARK AS READ";

       markReadButton.addEventListener("click", async ()=>{
        await fetch(`http://localhost:3010/notification/${notification.id}`, {
        method: "DELETE",
          /* headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({

        })*/
       });

      await getNotifications();

      });
    listItem.appendChild(markReadButton)
        list.appendChild(listItem);

      });

      notifiactionDiv.appendChild(list);

  }

   call();
   getNotifications()
   /*
   create();
   create();
  create();
     create();
   create();
    create();
  */
