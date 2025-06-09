<?php
// Prevent any HTML output
ob_start();

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/php_errors.log');

// Set content type to JSON
header('Content-Type: application/json');

// Start session
session_start();

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

try {
    // Get JSON data from request body
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    // Validate required fields
    $required_fields = ['title', 'event_date', 'start_time', 'end_time'];
    $missing_fields = [];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missing_fields[] = $field;
        }
    }

    if (!empty($missing_fields)) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Missing required fields: ' . implode(', ', $missing_fields)
        ]);
        exit;
    }

    // Database connection
    $host = 'localhost';
    $username = 'root';
    $password = '';
    $database = 'library';

    $conn = mysqli_connect($host, $username, $password, $database);
    if (!$conn) {
        throw new Exception("Connection failed: " . mysqli_connect_error());
    }

    // Set character set
    mysqli_set_charset($conn, "utf8mb4");

    // Prepare the data
    $title = mysqli_real_escape_string($conn, $data['title']);
    $description = isset($data['description']) ? mysqli_real_escape_string($conn, $data['description']) : '';
    $event_date = mysqli_real_escape_string($conn, $data['event_date']);
    $start_time = mysqli_real_escape_string($conn, $data['start_time']);
    $end_time = mysqli_real_escape_string($conn, $data['end_time']);
    $location = isset($data['location']) ? mysqli_real_escape_string($conn, $data['location']) : '';
    $event_type = isset($data['event_type']) ? mysqli_real_escape_string($conn, $data['event_type']) : '';

    // Insert the event
    $query = "INSERT INTO calendar_events (title, description, event_date, start_time, end_time, location, event_type) 
              VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = mysqli_prepare($conn, $query);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . mysqli_error($conn));
    }

    mysqli_stmt_bind_param($stmt, "sssssss", $title, $description, $event_date, $start_time, $end_time, $location, $event_type);
    
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception("Execute failed: " . mysqli_stmt_error($stmt));
    }

    $event_id = mysqli_insert_id($conn);
    mysqli_stmt_close($stmt);

    // Create notifications for all users about the new event
    $notification_query = "INSERT INTO user_notifications (user_id, type, message, created_at) 
                         SELECT id, 'calendar_event', ?, NOW() 
                         FROM users 
                         WHERE role = 'user'";
    
    $notification_stmt = mysqli_prepare($conn, $notification_query);
    if (!$notification_stmt) {
        throw new Exception("Failed to prepare notification statement: " . mysqli_error($conn));
    }

    // Create a more detailed notification message
    $notification_message = sprintf(
        "New event: %s on %s from %s to %s at %s",
        $title,
        $event_date,
        $start_time,
        $end_time,
        $location
    );
    
    mysqli_stmt_bind_param($notification_stmt, "s", $notification_message);
    
    if (!mysqli_stmt_execute($notification_stmt)) {
        throw new Exception("Failed to create notifications: " . mysqli_stmt_error($notification_stmt));
    }

    mysqli_stmt_close($notification_stmt);
    mysqli_close($conn);

    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Event added successfully',
        'event_id' => $event_id
    ]);

} catch (Exception $e) {
    // Log the error
    error_log("Error in admin_add_calendar_event.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    error_log("Session data: " . print_r($_SESSION, true));
    error_log("Request data: " . print_r($data ?? [], true));

    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to add event: ' . $e->getMessage()
    ]);
}

// End output buffering and flush
ob_end_flush();
?> 