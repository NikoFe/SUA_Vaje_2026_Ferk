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
  card_name.id = "card_name";
  card_name.textContent = name;


  const description_label = document.createElement("b");
  description_label.textContent = "Description: ";

  const card_description = document.createElement("p");
  card_description.id = "card_description";
  card_description.textContent = description;

  const cost_label = document.createElement("b");
  cost_label.textContent = "Cost: ";

  // Create the price
  const card_cost = document.createElement("p");
  card_cost.id = "card_cost";
  card_cost.textContent = cost;

  const allergens_label = document.createElement("b");
  allergens_label.textContent = "Allergens: ";

  const card_allergens = document.createElement("p");
  card_allergens.textContent = allergens;

  const kilojoules_label = document.createElement("b");
  kilojoules_label.textContent = "Kilojoules: ";


  const card_kilojoules = document.createElement("p");
  card_kilojoules.textContent = kilojoules;

  const vitamins_label = document.createElement("b");
  vitamins_label.textContent = "Vitamins: ";


  const card_vitamis = document.createElement("p");
  card_vitamis.textContent = vitamins;

  const stock_label = document.createElement("b");
  stock_label.textContent = "Stock: ";

  const card_stock = document.createElement("p");
  card_cost.id = "card_stock";
  card_stock.textContent = stock;

  const discount_label = document.createElement("b");
  discount_label.textContent = "Discount: ";

  const card_discount = document.createElement("p");
  card_discount.textContent = discount;

  const card_card_id = document.createElement("h3");
  card_card_id.id = "card_id";
  card_card_id.textContent = id;


  /*
  const card_image =  document.createElement('img');
   card_image.textContent = image_path;
   card_image.alt = 'Placeholder';
*/
  const kilograms_label = document.createElement("b");
  kilograms_label.textContent = "Kilograms: ";


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
    description_label,
    card_description,
    cost_label,
    card_cost,
    kilograms_label,
    card_kilograms,
    allergens_label,
    card_allergens,
    kilojoules_label,
    card_kilojoules,
    vitamins_label,
    card_vitamis,
    stock_label,
    card_stock,
    discount_label,
    card_discount,
    card_card_id,
    product_delete_button,
    product_update_button,
  );

  product.append(image, product_side_div);

  // Insert the product card into the list
  productsList.appendChild(product);
}


async function deleteComment(commentId) {
  try {


 // console.log("DDDDDDDELLL: ",  commentId);

    const response = await fetch(
      `http://localhost:3010/comments/${commentId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to delete comment (${response.status})`);
    }

  } catch (error) {
    console.error("Error deleting comment:", error);
    alert("Failed to delete comment: " + error.message);
    return;
  }

  await getComments();
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

let commentsLoadId = 0;

async function getComments() {
  const loadId = ++commentsLoadId;
  const productId = document.getElementById("id_header").textContent.trim();

  try {
    const response = await fetch(
      `http://localhost:3010/comments/${encodeURIComponent(productId)}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to load comments (${response.status})`);
    }

    const retrievedComments = await response.json();
    if (!Array.isArray(retrievedComments)) {
      throw new Error("The comments response was not a list");
    }

    if (loadId !== commentsLoadId) {
      return;
    }

    const commentsContainer = document.getElementById("comments");
    commentsContainer
      .querySelectorAll(".comment_instance")
      .forEach((commentInstance) => commentInstance.remove());

    const commentElements = document.createDocumentFragment();
    for (const comment of retrievedComments) {
      const commentInstance = document.createElement("div");
      commentInstance.className = "comment_instance";

      const commentUsername = document.createElement("p");
      commentUsername.textContent = comment.username;

      const commentContent = document.createElement("p");
      commentContent.textContent = comment.comment;

      const commentCreatedAt = document.createElement("p");
      commentCreatedAt.textContent = comment.created_at;

      commentInstance.append(commentUsername, commentContent, commentCreatedAt);

      const commentUpdateButton = document.createElement("button");
      commentUpdateButton.textContent = "UPDATE";
      commentUpdateButton.style.width = "fit-content";
      commentUpdateButton.addEventListener("click", () =>
        updateComment(comment.id, commentContent),
      );

      const commentDeleteButton = document.createElement("button");
      commentDeleteButton.textContent = "DELETE";
      commentDeleteButton.style.width = "fit-content";
      commentDeleteButton.addEventListener("click", () =>
        deleteComment(comment.id),
      );
      commentInstance.append(commentUpdateButton, commentDeleteButton);
      commentElements.append(commentInstance);
    }

    commentsContainer.append(commentElements);
  } catch (error) {
    console.error("Error loading comments:", error);
    alert("Failed to load comments: " + error.message);
  }
}

async function createComment() {
  console.log("CREATING COMMENT!");
  const commentInput = prompt("Write your comment here:");

  if (commentInput !== null) {
    const commentData = {
      comment: commentInput,
      product_id: document.getElementById("id_header").textContent.trim(),
      created_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    try {
      const response = await fetch("http://localhost:3010/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create comment (${response.status})`);
      }

      await getComments();
    } catch (error) {
      console.error("Error creating comment:", error);
      alert("Failed to create comment: " + error.message);
    }
  }

}


async function add(){

  const amountt= document.getElementById("amount").innerHTML;

  //WIP
  if(amountt<100){
  
   document.getElementById("amount").innerHTML = parseInt(document.getElementById("amount").innerHTML) + 1;
}


}

async function decrease(){

  const amountt= document.getElementById("amount").innerHTML;

  if(amountt>1){
  
     document.getElementById("amount").innerHTML = parseInt(document.getElementById("amount").innerHTML) - 1;
  }
}

async function addToCart() {
  try {
    const product_id = document.getElementById("card_id").innerHTML;
    const product_name = document.getElementById("card_name").innerHTML;
    const amount = parseInt(document.getElementById("amount").innerHTML, 10);

    const updateResponse = await fetch("http://localhost:3010/user/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id, amount }),
    });

    const updateResult = await updateResponse.json();
    if (!updateResponse.ok) {
      throw new Error(updateResult.error || "Unable to check cart item");
    }
    if (!Number.isInteger(updateResult.count) || updateResult.count < 0) {
      throw new Error("Invalid cart lookup response");
    }
    console.log("updateResponse: ", updateResponse);
    console.log("updateResult.count: ", updateResult.count);

    if (updateResult.count === 0) {
      console.log("Item not in cart, adding new item");
      const createResponse = await fetch("http://localhost:3010/user/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id, product_name, amount }),
      });

      //alert("ADDED TO CART!");


      if (!createResponse.ok) {
        const message = await createResponse.text();
        throw new Error(message || "Unable to add cart item");
      }
    }


  } catch (error) {
    console.error("Error adding item to cart:", error);
    alert(error.message);
  }
}
 // console.log("FROM SERVER RESPONSE: ", response);



 document.getElementById("cartAddBtn").addEventListener("click", ()=>add());
 document.getElementById("cartRemoveBtn").addEventListener("click", ()=>decrease());
  document.getElementById("cartBtn").addEventListener("click", ()=>addToCart())


getComments();


let comment_button = document.getElementById("comment_button");
comment_button.addEventListener("click", createComment);
call();
