// Password toggle
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

// Signup validation
function handleSignup() {
  const email = document.getElementById("school-email").value.trim();
  const studentNumber = document.getElementById("student-number").value.trim();
  const password = document.getElementById("create-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const form = document.querySelector(".form");

  const existingMessage = document.querySelector(".form-message");
  if (existingMessage) existingMessage.remove();

  const messageDiv = document.createElement("div");
  messageDiv.className = "form-message";

  function showMessage(text, isError = true) {
    messageDiv.textContent = text;
    messageDiv.style.color = isError ? "red" : "green";
    form.prepend(messageDiv);
  }

  // Validate student number (must be 4-digit number)
  const studentNumberPattern = /^\d{4}$/;
  if (!studentNumberPattern.test(studentNumber)) {
    showMessage("Please enter a valid student number.");
    return;
  }

  // Confirm password match
  if (password !== confirmPassword) {
    showMessage("Passwords do not match.");
    return;
  }

  // Validate password: at least 8 characters (no other requirements)
  if (password.length < 8) {
    showMessage("Password must be at least 8 characters long.");
    return;
  }

  // Success
  showMessage("Signup successful! Redirecting...", false);

  localStorage.setItem("userEmail", email);
  localStorage.setItem("userPassword", password);

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1500);
}

// Attach signup form handler
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("signup-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      handleSignup();
    });
});
