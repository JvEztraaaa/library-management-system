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

// Signup form submission
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("signup-form")
    .addEventListener("submit", function (e) {
      e.preventDefault(); // Prevent default form submission

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
        messageDiv.style.color = isError ? "red" : "deepskyblue";
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

      // Validate password: at least 8 characters
      if (password.length < 8) {
        showMessage("Password must be at least 8 characters long.");
        return;
      }

      // Send signup request to the backend
      fetch("../backend/signup.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: email,
          student_number: studentNumber,
          password: password,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            showMessage(data.message, false);
            setTimeout(() => {
              window.location.href = "login.html"; // Redirect on success
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
});
