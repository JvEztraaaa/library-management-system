<?php
session_start();
header('Content-Type: application/json');

// Database connection settings
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "library";

// Connect to MySQL
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

// Sanitize input function
function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// Get POST data
$email = sanitize($_POST['email'] ?? '');
$pass = $_POST['password'] ?? '';

// Validate inputs
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email format."]);
    exit();
}

if (strlen($pass) < 8) {
    echo json_encode(["success" => false, "message" => "Password must be at least 8 characters."]);
    exit();
}

// Retrieve full user data by email
$stmt = $conn->prepare("SELECT id, first_name, last_name, password_hash, role, avatar_url FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Invalid email or password."]);
    $stmt->close();
    $conn->close();
    exit();
}

$stmt->bind_result($user_id, $first_name, $last_name, $password_hash_from_db, $role, $avatar_url);
$stmt->fetch();

// Verify password
if (password_verify($pass, $password_hash_from_db)) {
    // Log the successful login
    $log_stmt = $conn->prepare("INSERT INTO login_log (user_id) VALUES (?)");
    $log_stmt->bind_param("i", $user_id);
    $log_stmt->execute();
    $log_stmt->close();

    // ✅ Store user data in session
    $_SESSION['user_id'] = $user_id;
    $_SESSION['email'] = $email;
    $_SESSION['first_name'] = $first_name;
    $_SESSION['last_name'] = $last_name;
    $_SESSION['role'] = $role;
    $_SESSION['avatar_url'] = $avatar_url;

    // Debug role value
    error_log("User role: " . $role);
    
    // Determine redirect URL based on role - using strict comparison with correct folder paths
    $redirect_url = ($role === 'admin') ? 'admin/admin.html' : 'homepage/homepage.html';
    
    // Debug redirect URL
    error_log("Redirect URL: " . $redirect_url);
    
    echo json_encode([
        "success" => true, 
        "message" => "Login successful! Redirecting...",
        "redirect_url" => $redirect_url,
        "role" => $role // Adding role to response for debugging
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid email or password."]);
}

$stmt->close();
$conn->close();
?>
