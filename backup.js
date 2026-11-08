//const { renderFile } = require("ejs");

async function call() {
  try {
    let productId = document.getElementById("id_header").innerHTML;

    console.log("ATTEMPT!!!!");
    console.log("CCCCCCCCCCCCCCCCCCCCCCCC:", productId);

    const response = await fetch(
      `http://localhost:3010/single_product/${productId}/information`,
    );

    // Convert the response body into JavaScript objects
    const product = await response.json();

    console.log("RRRR PRODUCT:", product);
    // console.log("RRRR PRODUCT ID:", product[0].id);
    // console.log("RRRR PRODUCT ID:", product[0].name);

    create(
      product[0].id,
      product[0].name,
      product[0].description,
      product[0].cost,
      product[0].kilograms,
      product[0].allergens,
      product[0].kilojoules,
      product[0].vitamins,
      product[0].stock,
      product[0].discount,
      product[0].image_path,
    );

    /*
    if (!response.ok) {
     // print ("RESPONSE" ,response)
     console.log("RESPONSE" ,response)
      throw new Error('Failed to load products')

      }*/
  } catch (error) {
    console.error("Error fetching products:", error);
    alert("Failed to load products: " + error.message);
  }
}


async function deleteProduct(id) {
  //console.log("DEL")
  const response = await fetch(`http://localhost:3010/single_product/${id}`, {
    method: "DELETE",
  });
  console.log("FROM SERVER DELETE RESPONSE: ", response);

  window.location.href = "http://localhost:3010/store";
}

async function updateProduct(id) {
  /*
   const response = await fetch(`http://localhost:3010/update/${id}`,
   {method: "GET"}
   )  
    console.log ("FROM SERVER UPDATE RESPONSE: ", response);*/

  window.location.href = `http://localhost:3010/update/${id}`;
}

function create(
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
) {
  console.log("||||||||||||||||||||||||||");
  productsList = document.getElementById("products-list");

  console.log("CREATING!");
  const product = document.createElement("div");
  product.className = "product-card";
  product.classList.add("product-card");

  //name
  const card_name = document.createElement("h3");
  card_name.textContent = name;

  const card_description = document.createElement("p");
  card_description.textContent = description;

  // Create the price
  const card_cost = document.createElement("p");
  card_cost.textContent = cost;

  const card_allergens = document.createElement("p");
  card_allergens.textContent = allergens;

  const card_kilojoules = document.createElement("p");
  card_kilojoules.textContent = kilojoules;

  const card_vitamis = document.createElement("p");
  card_vitamis.textContent = vitamins;

  const card_stock = document.createElement("p");
  card_stock.textContent = stock;

  const card_discount = document.createElement("p");
  card_discount.textContent = discount;

  /*
  const card_image =  document.createElement('img');
   card_image.textContent = image_path;
   card_image.alt = 'Placeholder';
*/

  const card_kilograms = document.createElement("p");
  card_kilograms.textContent = kilograms;

  // Create the image
  const image = document.createElement("img");

  image.className = "product-card-image";

  console.log("IIIIIIIIIMAGE PATH_ ", image_path);
  //image.src = image_path;

  image.src = getProductImageUrl(image_path);

  //image.src = './blueberries.png';

  const product_side_div = document.createElement("div");
  product_side_div.className = "product-side-div";

  console.log("CARD NAME: " + card_name.textContent);

  console.log("CARD DESCRIPTION: " + card_description.textContent);

  console.log("CARD COST: " + card_cost.textContent);

  //product_side_div.append( card_name, card_description, card_cost,card_kilograms,
  // card_allergens,card_kilojoules,card_vitamis,card_stock,card_discount );

  // Put the elements inside the product card

  const product_delete_button = document.createElement("button");
  product_delete_button.innerHTML = "DELETE";
  product_delete_button.onclick = () => deleteProduct(id);

  const product_update_button = document.createElement("button");
  product_update_button.innerHTML = "UPDATE";
  product_update_button.onclick = () => updateProduct(id);

  product_side_div.append(
    card_name,
    card_description,
    card_cost,
    card_kilograms,
    card_allergens,
    card_kilojoules,
    card_vitamis,
    card_stock,
    card_discount,
    product_delete_button,
    product_update_button,
  );

  product.append(image, product_side_div);

  // Insert the product card into the list
  productsList.appendChild(product);
}


async function deleteComment(commentId) {



  console.log("STARTING DELETE PROCESS!");
  try {
    //encodeURIComponent(commentId
    const response = await fetch(
      `http://localhost:3010/comments/${commentId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      
      },);

      console.log("DELETE RESPONSE: ", response)




     if(response.ok){
      console.log("GETTING COMMENTS!") ;

       let productId = document.getElementById("id_header").innerHTML;

       window.location.href = `http://localhost:3010/single_product/${productId}`;

      //getComments();
     }



  } catch (error) {
    console.error("Error deleting comment:", error);
    alert("Failed to delete comment: " + error.message);
  }
}





async function updateComment(commentId, commentContent) {
  const updateInput = prompt("Update your comment here:");

  if (updateInput === null) {
    return;
  }

  try {
    //encodeURIComponent(commentId
    const response = await fetch(
      `http://localhost:3010/comments/${commentId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: updateInput }),
      },
    );
    console.log("UPDATE RRRRRRESPONSE: ", response)
    if (!response.ok) {
      throw new Error(`Failed to update comment (${response.status})`);
    }

    commentContent.textContent = updateInput;
  } catch (error) {
    console.error("Error updating comment:", error);
    alert("Failed to update comment: " + error.message);
  }
}

//async function getComments() {
 function getComments() {

  //const response = await fetch(`http://localhost:3010/comments`);
  const response =  fetch(`http://localhost:3010/comments`);
  //const retrievedComments = await response.json();
  const retrievedComments =  response.json();

  console.log("~~~~~~~~~ COMMENTS: ", retrievedComments)


 for (const comment of retrievedComments) {

  /*
  console.log("comment username : "+ comment.username);
  console.log("comment content : "+ comment.comment);
  console.log("comment created_at : "+ comment.created_at);
   */


  const commentInstance =  document.createElement("div");
  commentInstance.className = "comment_instance";

  const commentUsername = document.createElement("p");
  commentUsername.textContent = comment.username;

  const commentContent = document.createElement("p");
  commentContent.textContent = comment.comment;

  const commentCreatedAt = document.createElement("p");
  commentCreatedAt.textContent = comment.created_at;


  commentInstance.append(commentUsername);
  commentInstance.append(commentContent);
  commentInstance.append(commentCreatedAt);

  const commentUpdateButton = document.createElement("button");
  commentUpdateButton.innerHTML = "UPDATE";
  commentUpdateButton.style.width= "fit-content";

  commentUpdateButton.addEventListener("click", () =>
    updateComment(comment.id, commentContent),
  );

  const commentDeleteButton = document.createElement("button");
  commentDeleteButton.innerHTML = "DELETE";
  commentDeleteButton.style.width= "fit-content";
  commentDeleteButton.addEventListener("click", ()=>
    deleteComment(comment.id),
  );
  commentInstance.append(commentUpdateButton);
  commentInstance.append(commentDeleteButton);

  document.getElementById("comments").append(commentInstance);
  

  /*
    const newComment = document.createElement("p");
    newComment.textContent = commentInput;
    document.getElementById("comments").append(newComment);
    console.log("comment_input:", commentInput);
   */




 }



  //console.log("FIRST COMMENT")

  // console.log("RRRR PRODUCT:", product);

  //  console.log ("FROM SERVER  RESPONSE: ", response);

  //window.location.href = "http://localhost:3010/store";
}

async function createComment(username) {
  console.log("CREATING COMMENT!");
  const commentInput = prompt("Write your comment here:");

  if (commentInput !== null) {
    //const newComment = document.createElement("p");
    //newComment.textContent = commentInput;
///////////////////
////////////////////
     console.log("COMMENT INSIDE!!!!");
    // document.getElementById("comments").append(newComment);

  const commentData = {
            comment: commentInput,
            product_id: document.getElementById("id_header").innerHTML,
            username : username, 
            created_at:  new Date().toISOString().slice(0, 19).replace("T", " ")

  };



    try {
        const response = await fetch('http://localhost:3010/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            //body: JSON.stringify(req.body)

             body : JSON.stringify(commentData)
    
        });
console.log("RESPONSE: ", response);

 if(response.ok){
  console.log("RESPONSE IS OK!: ");

  /*
  const commentInstance =  document.createElement("div");
  commentInstance.className = "comment_instance";

  const commentUsername = document.createElement("p");
  commentUsername.textContent = comment.username;

  const commentContent = document.createElement("p");
  commentContent.textContent = comment.comment;

  const commentCreatedAt = document.createElement("p");
  commentCreatedAt.textContent = comment.created_at;
*/
    let productId = document.getElementById("id_header").innerHTML;

       window.location.href = `http://localhost:3010/single_product/${productId}`;
 }
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(502).json({ error: 'Store service unavailable' });
    }
  }

}

getComments();


let comment_button = document.getElementById("comment_button");
comment_button.addEventListener("click", ()=>createComment("placeholder"));
call();
