function handleSignup() {
    const email = document.getElementById("school-email").value.trim();
    const studentNumber = document.getElementById("student-number").value.trim();
    const password = document.getElementById("create-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const form = document.querySelector(".form");
  
    // Remove existing messages
    const existingMessage = document.querySelector(".form-message");
    if (existingMessage) existingMessage.remove();
  
    // Create a new message element
    const messageDiv = document.createElement("div");
    messageDiv.className = "form-message";
  
    // Helper function to display a message
    function showMessage(text, isError = true) {
      messageDiv.textContent = text;
      messageDiv.style.color = isError ? "red" : "green";
      form.prepend(messageDiv);
    }
  
    // Validation
    if (!email || !studentNumber || !password || !confirmPassword) {
      showMessage("Please fill in all fields.");
      return;
    }

    // Student number pattern: 4 digits, hyphen, then 4 or more digits
    const studentNumberPattern = /^\d{4}-\d+$/;

    if (!studentNumberPattern.test(studentNumber)) {
    showMessage("Please enter a valid student number (e.g., 2023-123456).");
    return;
    }

  
    // Regular expression to validate only .edu email addresses
    // - Allows letters, numbers, dots, underscores, and other valid characters before @
    // - Requires domain to end specifically in ".edu"
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu.ph$/;// <-- Made it only accept email addresses ending in .edu.ph in context of our University's Emails

    if (!emailPattern.test(email)) {
    showMessage("Please enter a valid school email address.");
    return;
    }


    if (password !== confirmPassword) {
      showMessage("Passwords do not match.");
      return;
    }
  
    // Regular expression to ensure:
    // - At least one letter [a-zA-Z]
    // - At least one digit [0-9]
    // - Minimum of 6 characters total
    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

    // If the password doesn't meet these criteria, show an error
    if (!passwordPattern.test(password)) {
    showMessage("Password must be at least 6 characters long and contain both letters and numbers.");
    return;
    }

    // Success
    showMessage("Signup successful! Redirecting...", false);

    // Store user credentials in localStorage
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPassword", password);

    // Delay redirect so user sees the message
    setTimeout(() => {
    window.location.href = "../homepage/homepage.html"; // Go to homepage after signup
    }, 1500);
  

}

// SHOW PASSWORD BUTTON CODE:
// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // Select all toggle buttons with class 'toggle-password'
    const toggleButtons = document.querySelectorAll(".toggle-password");
  
    toggleButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-target");
        const input = document.getElementById(targetId);
        if (!input) return;
  
        // Toggle the input type between 'password' and 'text'
        if (input.type === "password") {
          input.type = "text";
          btn.textContent = "Hide";
        } else {
          input.type = "password";
          btn.textContent = "Show";
        }
      });
    });
  });
  
