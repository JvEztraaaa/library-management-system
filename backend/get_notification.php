<?php
session_start();
header('Content-Type: application/json');

// Debug session information
error_log("Session data: " . print_r($_SESSION, true));

// Include database connection and functions
require_once 'notification.php';

try {
    // Check if user is logged in and is admin
    if (!isLoggedIn()) {
        error_log("User not logged in");
        http_response_code(403);
        echo json_encode(['error' => 'User not logged in']);
        exit;
    }

    if (!isAdmin()) {
        error_log("User is not admin. Role: " . ($_SESSION['role'] ?? 'not set'));
        http_response_code(403);
        echo json_encode(['error' => 'User is not admin']);
        exit;
    }

    // Create database connection
    $host = "localhost";
    $user = "root";
    $pass = "";
    $db = "library";

    $conn = new mysqli($host, $user, $pass, $db);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Get notifications
    $notifications = getNotifications($conn);

    if ($notifications === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch notifications']);
        exit;
    }

    // Debug information
    error_log("Fetched notifications: " . print_r($notifications, true));

    // Ensure clean output
    ob_clean();
    echo json_encode($notifications);

} catch (Exception $e) {
    error_log("Error in get_notification.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
} finally {
    // Ensure connection is closed
    if (isset($conn)) {
        $conn->close();
    }
}
?>
