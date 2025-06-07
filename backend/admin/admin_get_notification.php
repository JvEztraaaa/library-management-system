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
$database = 'library';  // Changed from library_management to library

try {
    $conn = mysqli_connect($host, $username, $password, $database);

    if (!$conn) {
        throw new Exception('Database connection failed: ' . mysqli_connect_error());
    }

    // Set character set
    if (!mysqli_set_charset($conn, 'utf8mb4')) {
        throw new Exception('Error setting character set: ' . mysqli_error($conn));
    }

    // First, check if the notifications table exists
    $tableCheck = mysqli_query($conn, "SHOW TABLES LIKE 'notifications'");
    if (mysqli_num_rows($tableCheck) == 0) {
        // Table doesn't exist, create it
        $createTable = "CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            admin_id INT,
            book_id INT,
            type VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL
        )";
        
        if (!mysqli_query($conn, $createTable)) {
            throw new Exception('Error creating notifications table: ' . mysqli_error($conn));
        }
    }

    // Get notifications for admin
    $query = "SELECT n.*, 
              u.first_name, u.last_name
              FROM notifications n
              LEFT JOIN users u ON n.user_id = u.id
              ORDER BY n.timestamp DESC
              LIMIT 50";

    $stmt = mysqli_prepare($conn, $query);
    if (!$stmt) {
        throw new Exception('Error preparing statement: ' . mysqli_error($conn));
    }
    
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception('Error executing statement: ' . mysqli_stmt_error($stmt));
    }

    $result = mysqli_stmt_get_result($stmt);
    if (!$result) {
        throw new Exception('Error getting result: ' . mysqli_error($conn));
    }

    $notifications = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $notifications[] = [
            'id' => $row['id'],
            'type' => $row['type'],
            'message' => $row['message'],
            'book_title' => $row['book_title'],
            'student_name' => $row['first_name'] . ' ' . $row['last_name'],
            'timestamp' => $row['timestamp']
        ];
    }

    // Close statement and connection
    mysqli_stmt_close($stmt);
    mysqli_close($conn);

    // Clear any output buffers
    while (ob_get_level()) {
        ob_end_clean();
    }

    // Return notifications as JSON
    echo json_encode($notifications);

} catch (Exception $e) {
    // Clear any output buffers
    while (ob_get_level()) {
        ob_end_clean();
    }

    // Log the error with more details
    error_log('Notification error: ' . $e->getMessage() . "\n" . 
              'Session data: ' . print_r($_SESSION, true) . "\n" .
              'Database: ' . $database . "\n" .
              'User ID: ' . ($_SESSION['user_id'] ?? 'not set') . "\n" .
              'Stack trace: ' . $e->getTraceAsString());

    // Return error response
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'details' => $e->getMessage(),
        'session' => [
            'user_id' => $_SESSION['user_id'] ?? null,
            'role' => $_SESSION['role'] ?? null
        ]
    ]);
}
?> 