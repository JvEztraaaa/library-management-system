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

// Get total check-ins count (sum of all check-ins)
$total_students_query = "SELECT SUM(check_in_count) as total FROM users WHERE role = 'user'";
$total_students_result = $conn->query($total_students_query);
$total_students = $total_students_result->fetch_assoc()['total'] ?? 0;

// Get male count (only male users who are currently IN)
$male_query = "SELECT COUNT(*) as male_count FROM users WHERE role = 'user' AND gender = 'male' AND status = 'IN'";
$male_result = $conn->query($male_query);
$male_count = $male_result->fetch_assoc()['male_count'];

// Get female count (only female users who are currently IN)
$female_query = "SELECT COUNT(*) as female_count FROM users WHERE role = 'user' AND gender = 'female' AND status = 'IN'";
$female_result = $conn->query($female_query);
$female_count = $female_result->fetch_assoc()['female_count'];

// Get staff on duty (only admins who are currently IN)
$staff_query = "SELECT COUNT(*) as staff_count FROM users WHERE role = 'admin' AND status = 'IN'";
$staff_result = $conn->query($staff_query);
$staff_count = $staff_result->fetch_assoc()['staff_count'];

echo json_encode([
    "success" => true,
    "stats" => [
        "total_students" => $total_students,
        "male" => $male_count,
        "female" => $female_count,
        "staff_on_duty" => $staff_count
    ]
]);

$conn->close();
?> 