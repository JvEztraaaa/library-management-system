<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

// Database configuration
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'library';

// Create connection
$conn = mysqli_connect($host, $username, $password, $database);

// Check connection
if (!$conn) {
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . mysqli_connect_error()
    ]));
}

// Set charset to utf8mb4
mysqli_set_charset($conn, "utf8mb4");

try {
    // Get JSON data from request body
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['id']) || empty($data['id'])) {
        throw new Exception("Missing required field: id");
    }

    // Sanitize input
    $id = (int)$data['id'];

    // Delete event from database
    $query = "DELETE FROM calendar_events WHERE id = ?";
    
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, 'i', $id);
    
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception(mysqli_error($conn));
    }

    if (mysqli_affected_rows($conn) === 0) {
        throw new Exception("Event not found");
    }

    echo json_encode([
        'success' => true,
        'message' => 'Event deleted successfully'
    ]);

} catch (Exception $e) {
    error_log("Error in admin_delete_calendar_event.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        mysqli_close($conn);
    }
}
?> 