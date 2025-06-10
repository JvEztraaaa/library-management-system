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

// Get student number from POST data
$student_number = $_POST['student_number'] ?? '';

// Validate student number format
if (!preg_match('/^\d{5}$/', $student_number)) {
    echo json_encode(["success" => false, "message" => "Invalid student number format."]);
    exit();
}

// Check if student number exists and get user info
$stmt = $conn->prepare("SELECT id, first_name, last_name, role, status FROM users WHERE student_number = ?");
$stmt->bind_param("s", $student_number);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    
    // Toggle status (IN to OUT or OUT to IN)
    $new_status = ($user['status'] === 'IN') ? 'OUT' : 'IN';
    
    // Update user status
    $update_stmt = $conn->prepare("UPDATE users SET status = ? WHERE id = ?");
    $update_stmt->bind_param("si", $new_status, $user['id']);
    $update_stmt->execute();
    $update_stmt->close();

    // If user is checking IN, increment the check-in counter
    if ($new_status === 'IN') {
        // Get current check-in count
        $check_in_query = "SELECT check_in_count FROM users WHERE id = ?";
        $check_in_stmt = $conn->prepare($check_in_query);
        $check_in_stmt->bind_param("i", $user['id']);
        $check_in_stmt->execute();
        $check_in_result = $check_in_stmt->get_result();
        $current_count = $check_in_result->fetch_assoc()['check_in_count'] ?? 0;
        $check_in_stmt->close();

        // Increment check-in count
        $new_count = $current_count + 1;
        $update_count_stmt = $conn->prepare("UPDATE users SET check_in_count = ? WHERE id = ?");
        $update_count_stmt->bind_param("ii", $new_count, $user['id']);
        $update_count_stmt->execute();
        $update_count_stmt->close();
    }
    
    echo json_encode([
        "success" => true,
        "message" => "Status updated successfully!",
        "user" => [
            "name" => $user['first_name'] . ' ' . $user['last_name'],
            "role" => $user['role'],
            "last_status" => $new_status
        ]
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Student number not found."
    ]);
}

$stmt->close();
$conn->close();
?> 