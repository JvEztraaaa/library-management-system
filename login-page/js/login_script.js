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

  // Send login request to the backend
  fetch("../backend/login.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      email: email,
      password: password,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showMessage(data.message, false);
        setTimeout(() => {
          window.location.href = "../" + data.redirect_url; // Use the redirect_url from response
        }, 1500);
      } else {
        showMessage(data.message);
      }
    })
    .catch((error) => {
      showMessage("An error occurred. Please try again later.");
      console.error("Error:", error);
    });
});
