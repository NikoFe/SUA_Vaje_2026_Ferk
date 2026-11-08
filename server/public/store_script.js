//const { renderFile } = require("ejs");

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

  /*
  const card_allergens =  document.createElement('p');
   card_allergens.textContent = allergens;

  const card_kilojoules =  document.createElement('p');
   card_kilojoules.textContent = kilojoules;

  const card_vitamis =  document.createElement('p');
   card_vitamis.textContent = vitamins;

  const card_stock =  document.createElement('p');
   card_stock.textContent = stock;

  const card_discount =  document.createElement('p');
   card_discount.textContent = discount;

  const card_image =  document.createElement('p');
   card_image.textContent = image_path;


  const card_kilograms =  document.createElement('p');
   card_kilograms.textContent = kilograms;
  */

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







   call();
   /*
   create();
   create();
  create();
     create();
   create();
    create();
  */
