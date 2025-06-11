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
$first_name = sanitize($_POST['first_name'] ?? '');
$last_name = sanitize($_POST['last_name'] ?? '');
$email = sanitize($_POST['email'] ?? '');
$student_number = sanitize($_POST['student_number'] ?? '');
$pass = $_POST['password'] ?? '';
$gender = sanitize($_POST['gender'] ?? '');

// Validate first and last name (non-empty, optional further validation)
if (empty($first_name) || empty($last_name)) {
    echo json_encode(["success" => false, "message" => "First name and last name are required."]);
    exit();
}

// Basic validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email format."]);
    exit();
}

if (!preg_match('/^\d{5}$/', $student_number)) {
    echo json_encode(["success" => false, "message" => "Student number must be exactly 5 digits."]);
    exit();
}

if (strlen($pass) < 8) {
    echo json_encode(["success" => false, "message" => "Password must be at least 8 characters."]);
    exit();
}


// Check if email already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Email already registered."]);
    $stmt->close();
    $conn->close();
    exit();
}
$stmt->close();

// Hash the password securely
$password_hash = password_hash($pass, PASSWORD_DEFAULT);

// Insert user into database with first_name, last_name, and gender
$stmt = $conn->prepare("INSERT INTO users (first_name, last_name, email, student_number, password_hash, gender) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssss", $first_name, $last_name, $email, $student_number, $password_hash, $gender);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Signup successful! You can now log in."]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Signup failed. Please try again later.",
        "error" => $stmt->error // Remove this line in production
    ]);
}

$stmt->close();
$conn->close();
?>
