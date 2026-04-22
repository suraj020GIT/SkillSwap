document.getElementById("registerForm").addEventListener("submit", function(e){
    e.preventDefault();

    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;

    if(name === "" || email === ""){
        alert("All fields required!");
        return;
    }

    if(!email.includes("@")){
        alert("Invalid Email!");
        return;
    }

    alert("Form Submitted ✅");
});