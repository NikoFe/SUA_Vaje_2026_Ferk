async function register(event){
  event.preventDefault();

  console.log("RRRRRRRRRRR CALLING FUNCTION!!!");



   let username_input=  document.getElementById ("usename_input").value;
   let email_input=  document.getElementById ("email_input").value;
   let password_input=  document.getElementById ("password_input").value;


     const response = await fetch('http://localhost:3010/user/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username_input,email: email_input, password:password_input  }),
        });

        console.log("RETRIEVED: ",response.statusText )

  //  const resultLength = await response.json();
  //  console.log("RESULT LENGTH: ", resultLength);

   if(response.statusText =="OK"){

     //console.log("WORKING!!!!");
    window.location.href = `http://localhost:3010/store`;


   }
    //console.log ("LLLLLLLLLLLLLLLLLLLLLLLLLLLLLL response: ",response );
   // console.log ("LLLLLL  response.length: ",response );

}
