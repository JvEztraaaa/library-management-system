<?php
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

// Retrieve user data by email
$stmt = $conn->prepare("SELECT password_hash FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    // Email not found
    echo json_encode(["success" => false, "message" => "Invalid email or password."]);
    $stmt->close();
    $conn->close();
    exit();
}

$stmt->bind_result($password_hash_from_db);
$stmt->fetch();

// Verify password
if (password_verify($pass, $password_hash_from_db)) {
    echo json_encode(["success" => true, "message" => "Login successful! Redirecting..."]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid email or password."]);
}

$stmt->close();
$conn->close();
?>
