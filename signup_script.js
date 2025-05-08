function handleSignup() {
    const username = document.getElementById('username')?.value.trim();
    const email = document.getElementById('school-email')?.value.trim();
    const studentNumber = document.getElementById('student-number')?.value.trim();
    const password = document.getElementById('create-password')?.value;
    const confirmPassword = document.getElementById('confirm-password')?.value;

    if (!username || !email || !studentNumber || !password || !confirmPassword) {
        alert("Please fill in all fields.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    
    localStorage.setItem(`user_password_${email}`, password);

    alert("Account created successfully! Redirecting to login...");
    const encodedEmail = encodeURIComponent(email);
    window.location.href = `login.html?email=${encodedEmail}`;
}
