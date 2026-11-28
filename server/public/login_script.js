
async function login(event){
  event.preventDefault();

  console.log("LLLLLLL CALLING FUNCTION!!!");

   let username_input=  document.getElementById ("usename_input").value;
   let password_input=  document.getElementById ("password_input").value;

  if(!username_input || !password_input){
    alert("Please fill in all fields.");
    return;
  }

  console.log("LLLLLLL username: ", username_input);
  console.log("LLLLLLL password: ", password_input);

     const response = await fetch('http://localhost:3010/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username_input, password:password_input  }),
        });

        console.log("RETRIEVED: ",response.statusText )

  //  const resultLength = await response.json();
  //  console.log("RESULT LENGTH: ", resultLength);

   if(response.statusText =="OK"){

     //console.log("WORKING!!!!");
    window.location.href = `http://localhost:3010/store`;


   }
   else {
      console.log("ALREADY!!!");
      alert("INVALID CREDENTIALS");
   }


    //console.log ("LLLLLLLLLLLLLLLLLLLLLLLLLLLLLL response: ",response );
   // console.log ("LLLLLL  response.length: ",response );

}


//document.getElementById("registerUser").addEventListener("click", ()=>{


  async function registerUser(){

  console.log("RRRRRRRRR CALLING FUNCTION!!!");

///////////

   let username_input=  document.getElementById ("usename_input").value;
   let password_input=  document.getElementById ("password_input").value;
   let email_input=  document.getElementById ("email_input").value;


  if(!username_input || !password_input || !email_input){
    alert("Please fill in all fields.");
    return;
  }


  console.log("RRRR username: ", username_input);
  console.log("RRRR password: ", password_input);
  console.log("RRRR password: ", email_input);

  const id = Math.floor(Math.random() * 100000);


     const response = await fetch('http://localhost:3010/user/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username_input, password:password_input , email:email_input , id:id}),
        });

        console.log("RETRIEVED: ",response.statusText )

   if(response.statusText =="OK"){

     //console.log("WORKING!!!!");

   //now validate

   const response2 = await fetch('http://localhost:3010/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username_input, password:password_input}),
        });
   console.log("RESPONSE2: "+ response2);

    if(response2.ok){
      window.location.href = `http://localhost:3010/store`;
    }
   }
   else {
      console.log("ALREADY!!!");
      alert("INVALID CREDENTIALS");
   }

}

document.getElementById("loginToRegisterButton").addEventListener("click",()=>registerUser());