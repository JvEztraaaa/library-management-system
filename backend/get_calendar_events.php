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
    // Get events from database
    $query = "SELECT 
                id,
                title,
                description,
                event_date as start,
                start_time,
                end_time,
                location,
                event_type
              FROM calendar_events 
              ORDER BY event_date, start_time";
    
    $result = mysqli_query($conn, $query);
    
    if (!$result) {
        throw new Exception(mysqli_error($conn));
    }

    $events = [];
    while ($row = mysqli_fetch_assoc($result)) {
        // Format the event for FullCalendar
        $event = [
            'id' => $row['id'],
            'title' => $row['title'],
            'start' => $row['start'] . 'T' . $row['start_time'],
            'end' => $row['start'] . 'T' . $row['end_time'],
            'description' => $row['description'],
            'location' => $row['location'],
            'event_type' => $row['event_type'],
            'extendedProps' => [
                'description' => $row['description'],
                'location' => $row['location'],
                'event_type' => $row['event_type']
            ]
        ];
        $events[] = $event;
    }

    // If no events found, return empty array instead of null
    echo json_encode($events ?: []);

} catch (Exception $e) {
    error_log("Error in get_calendar_events.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while fetching events'
    ]);
} finally {
    if (isset($conn)) {
        mysqli_close($conn);
    }
}
?> 