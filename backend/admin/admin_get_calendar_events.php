<?php
// Prevent any output before headers
ob_start();

// Set error handling to prevent HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Start session
session_start();

// Set JSON header
header('Content-Type: application/json');

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit();
}

// Database connection
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'library';

try {
    $conn = mysqli_connect($host, $username, $password, $database);

    if (!$conn) {
        throw new Exception('Database connection failed: ' . mysqli_connect_error());
    }

    // Set character set
    if (!mysqli_set_charset($conn, 'utf8mb4')) {
        throw new Exception('Error setting character set: ' . mysqli_error($conn));
    }

    // Get start and end dates from request
    $start = isset($_GET['start']) ? $_GET['start'] : date('Y-m-d');
    $end = isset($_GET['end']) ? $_GET['end'] : date('Y-m-d', strtotime('+1 month'));

    // Convert dates to MySQL format
    $start = date('Y-m-d', strtotime($start));
    $end = date('Y-m-d', strtotime($end));

    // Get calendar events
    $query = "SELECT id, title, description, event_date, start_time, end_time, location, event_type 
              FROM calendar_events 
              WHERE event_date BETWEEN ? AND ?
              ORDER BY event_date, start_time";

    $stmt = mysqli_prepare($conn, $query);
    if (!$stmt) {
        throw new Exception('Error preparing statement: ' . mysqli_error($conn));
    }

    mysqli_stmt_bind_param($stmt, 'ss', $start, $end);
    
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('Error executing statement: ' . mysqli_stmt_error($stmt));
    }

    $result = mysqli_stmt_get_result($stmt);
    if (!$result) {
        throw new Exception('Error getting result: ' . mysqli_error($conn));
    }

    $events = [];
    while ($row = mysqli_fetch_assoc($result)) {
        // Format the event for FullCalendar
        $events[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'start' => $row['event_date'] . 'T' . $row['start_time'],
            'end' => $row['event_date'] . 'T' . $row['end_time'],
            'location' => $row['location'],
            'type' => $row['event_type'],
            'allDay' => ($row['start_time'] == '00:00:00' && $row['end_time'] == '23:59:59')
        ];
    }

    // Close statement and connection
    mysqli_stmt_close($stmt);
    mysqli_close($conn);

    // Clear any output buffers
    while (ob_get_level()) {
        ob_end_clean();
    }

    // Return events as JSON
    echo json_encode($events);

} catch (Exception $e) {
    // Clear any output buffers
    while (ob_get_level()) {
        ob_end_clean();
    }

    // Log the error with more details
    error_log('Calendar error: ' . $e->getMessage() . "\n" . 
              'Session data: ' . print_r($_SESSION, true) . "\n" .
              'Database: ' . $database . "\n" .
              'User ID: ' . ($_SESSION['user_id'] ?? 'not set') . "\n" .
              'Stack trace: ' . $e->getTraceAsString());

    // Return error response
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'details' => $e->getMessage()
    ]);
}
?> 