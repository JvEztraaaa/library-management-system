<?php
session_start();
header('Content-Type: application/json');

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
    $required_fields = ['title', 'date', 'start_time', 'end_time', 'location', 'event_type'];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    // Sanitize input
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

    // Insert event into database
    $query = "INSERT INTO calendar_events (title, description, event_date, start_time, end_time, location, event_type) 
             VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, 'sssssss', $title, $description, $date, $start_time, $end_time, $location, $event_type);
    
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception(mysqli_error($conn));
    }

    echo json_encode([
        'success' => true,
        'message' => 'Event added successfully'
    ]);

} catch (Exception $e) {
    error_log("Error in add_calendar_event.php: " . $e->getMessage());
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