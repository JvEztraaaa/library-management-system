const form = document.querySelector("form"); // Assuming your form element exists

// Password toggle (same as before)
document.querySelectorAll(".toggle-password").forEach((eye) => {
  eye.addEventListener("click", () => {
    const targetId = eye.getAttribute("data-target");
    const input = document.getElementById(targetId);

    if (input.type === "password") {
      input.type = "text";
      eye.textContent = "🙉";
    } else {
      input.type = "password";
      eye.textContent = "🙈";
    }
  });
});

form.addEventListener("submit", function (event) {
  const existingMessage = document.querySelector(".form-message");
  if (existingMessage) existingMessage.remove();

  if (!form.checkValidity()) {
    return;
  }

  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const messageDiv = document.createElement("div");
  messageDiv.className = "form-message";

  function showMessage(text, isError = true) {
    messageDiv.textContent = text;
    messageDiv.style.color = isError ? "red" : "deepskyblue";
    form.prepend(messageDiv);
  }

  if (password.length < 8) {
    showMessage("Password must be at least 8 characters long.");
    return;
  }

  // Fetch stored credentials
  const storedEmail = localStorage.getItem("userEmail");
  const storedPassword = localStorage.getItem("userPassword");

  if (email === storedEmail && password === storedPassword) {
    showMessage("Login successful! Redirecting...", false);
    setTimeout(() => {
      window.location.href = "../homepage/homepage.html";
    }, 1500);
  } else {
    showMessage("Invalid email or password.");
  }
});
