<?php
session_start();
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Debug session
error_log("Session data: " . print_r($_SESSION, true));

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    error_log("Unauthorized access attempt - User ID: " . (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'not set') . 
              ", Role: " . (isset($_SESSION['role']) ? $_SESSION['role'] : 'not set'));
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
    error_log("Database connection failed: " . mysqli_connect_error());
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . mysqli_connect_error()
    ]));
}

// Set charset to utf8mb4
mysqli_set_charset($conn, "utf8mb4");

try {
    // Get JSON data from request body
    $raw_data = file_get_contents('php://input');
    error_log("Received raw data: " . $raw_data);
    
    $data = json_decode($raw_data, true);
    error_log("Decoded data: " . print_r($data, true));

    // Validate required fields
    if (!isset($data['id']) || empty($data['id'])) {
        throw new Exception("Missing required field: id");
    }

    // Sanitize input
    $id = (int)$data['id'];
    error_log("Attempting to delete event with ID: " . $id);

    // Delete event from database
    $query = "DELETE FROM calendar_events WHERE id = ?";
    
    $stmt = mysqli_prepare($conn, $query);
    if (!$stmt) {
        throw new Exception("Prepare statement failed: " . mysqli_error($conn));
    }
    
    mysqli_stmt_bind_param($stmt, 'i', $id);
    
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception("Execute failed: " . mysqli_error($conn));
    }

    $affected_rows = mysqli_affected_rows($conn);
    error_log("Affected rows: " . $affected_rows);

    if ($affected_rows === 0) {
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
    if (isset($stmt)) {
        mysqli_stmt_close($stmt);
    }
    if (isset($conn)) {
        mysqli_close($conn);
    }
}
?> 