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
    $required_fields = ['id', 'title', 'date', 'start_time', 'end_time', 'location', 'event_type'];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    // Sanitize input
    $id = (int)$data['id'];
    $title = mysqli_real_escape_string($conn, trim($data['title']));
    $description = isset($data['description']) ? mysqli_real_escape_string($conn, trim($data['description'])) : null;
    $date = mysqli_real_escape_string($conn, trim($data['date']));
    $start_time = mysqli_real_escape_string($conn, trim($data['start_time']));
    $end_time = mysqli_real_escape_string($conn, trim($data['end_time']));
    $location = mysqli_real_escape_string($conn, trim($data['location']));
    $event_type = mysqli_real_escape_string($conn, trim($data['event_type']));

    // Validate event type
    $valid_types = ['Book Fair', 'Author Visit', 'Workshop', 'Library Closure', 'Other'];
    if (!in_array($event_type, $valid_types)) {
        throw new Exception("Invalid event type");
    }

    // Update event in database
    $query = "UPDATE calendar_events 
             SET title = ?, description = ?, event_date = ?, start_time = ?, end_time = ?, location = ?, event_type = ? 
             WHERE id = ?";
    
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, 'sssssssi', $title, $description, $date, $start_time, $end_time, $location, $event_type, $id);
    
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception(mysqli_error($conn));
    }

    if (mysqli_affected_rows($conn) === 0) {
        throw new Exception("Event not found or no changes made");
    }

    echo json_encode([
        'success' => true,
        'message' => 'Event updated successfully'
    ]);

} catch (Exception $e) {
    error_log("Error in admin_update_calendar_event.php: " . $e->getMessage());
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