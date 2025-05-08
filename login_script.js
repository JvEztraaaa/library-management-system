
function handleLogin() {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    const storedPassword = localStorage.getItem(`user_password_${email}`);

    if (email && password) {
        if (storedPassword && password === storedPassword) {
            window.location.href = "homepage.html";
        } else {
            alert("Incorrect email or password.");
        }
    } else {
        alert("Please enter both email and password.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const emailFromSignup = params.get("email");
    if (emailFromSignup) {
        const emailInput = document.getElementById("email");
        if (emailInput) emailInput.value = emailFromSignup;
    }

    const signupLink = document.querySelector(".tab[href='signup.html']");
    if (signupLink) {
        signupLink.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "signup.html";
        });
    }

    const container = document.querySelector('.login-container');
    function adjustPadding() {
        if (!container) return;
        container.style.padding = window.innerWidth < 500 ? "10px" : "40px";
    }
    window.addEventListener('resize', adjustPadding);
    adjustPadding();
});