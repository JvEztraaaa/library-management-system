document.querySelector("button").addEventListener("click", function () {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
  
    const form = document.querySelector(".form");
  
    // Remove previous messages
    const existingMessage = document.querySelector(".form-message");
    if (existingMessage) existingMessage.remove();
  
    // Create a message element
    const messageDiv = document.createElement("div");
    messageDiv.className = "form-message";
  
    function showMessage(text, isError = true) {
      messageDiv.textContent = text;
      messageDiv.style.color = isError ? "red" : "green";
      form.prepend(messageDiv);
    }
  
    // Fetch stored credentials
    const storedEmail = localStorage.getItem("userEmail");
    const storedPassword = localStorage.getItem("userPassword");
  
    if (!email || !password) {
      showMessage("Please fill in both fields.");
      return;
    }
  
    if (email === storedEmail && password === storedPassword) {
      showMessage("Login successful! Redirecting...", false);
      setTimeout(() => {
        window.location.href = "../homepage/homepage.html"; // Success
      }, 1500);
    } else {
      showMessage("Invalid email or password.");
    }
  });
  
