<?php
// Prevent any output before headers
ob_start();

// Disable error display
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Start session and set JSON header
session_start();
header('Content-Type: application/json');

// Function to send JSON response and exit
function sendJsonResponse($success, $message, $code = 200) {
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message]);
    ob_end_flush();
    exit;
}

// Check if required file exists
$notification_file = __DIR__ . '/admin/admin_notification.php';
if (!file_exists($notification_file)) {
    error_log("Required file not found: " . $notification_file);
    sendJsonResponse(false, 'Server configuration error', 500);
}

// Include database connection and functions
require_once $notification_file;

try {
    if (!isLoggedIn()) {
        sendJsonResponse(false, 'unauthorized', 403);
    }

    // Validate input
    if (!isset($_POST['title']) || !isset($_POST['author']) || !isset($_POST['genre'])) {
        sendJsonResponse(false, 'Missing required fields', 400);
    }

    $title = trim($_POST['title']);
    $author = trim($_POST['author']);
    $genre = trim($_POST['genre']);
    $user_id = $_SESSION['user_id'];

    if (empty($title) || empty($author) || empty($genre)) {
        sendJsonResponse(false, 'All fields are required', 400);
    }

    $host = "localhost";
    $user = "root";
    $pass = "";
    $db = "library";

    $conn = new mysqli($host, $user, $pass, $db);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Check if book is already borrowed
    $check = $conn->prepare("SELECT id FROM borrowed_books WHERE title = ?");
    if (!$check) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $check->bind_param("s", $title);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        $check->close();
        $conn->close();
        sendJsonResponse(false, 'already_borrowed', 400);
    }
    $check->close();

    // Insert book since it's not borrowed yet
    $sql = "INSERT INTO borrowed_books (title, author, genre, user_id, status, borrow_time, due_date) 
            VALUES (?, ?, ?, ?, 'Pending', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("sssi", $title, $author, $genre, $user_id);
    $result = $stmt->execute();

    if ($result && $stmt->affected_rows > 0) {
        // Get user's name for the notification
        $user_query = "SELECT first_name, last_name FROM users WHERE id = ?";
        $user_stmt = $conn->prepare($user_query);
        if (!$user_stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $user_stmt->bind_param("i", $user_id);
        $user_stmt->execute();
        $user_result = $user_stmt->get_result();
        $user_data = $user_result->fetch_assoc();
        $user_name = $user_data['first_name'] . ' ' . $user_data['last_name'];
        
        // Create notification for borrow request
        $message = $user_name . " requested to borrow the book \"" . $title . "\".";
        createAdminNotification($conn, $user_id, 'pending', $title, $message);
        
        $user_stmt->close();
        sendJsonResponse(true, 'Book borrow request submitted successfully');
    } else {
        sendJsonResponse(false, 'Failed to submit borrow request', 500);
    }

    $stmt->close();

} catch (Exception $e) {
    error_log("Error in borrow_book.php: " . $e->getMessage() . "\nStack trace: " . $e->getTraceAsString());
    sendJsonResponse(false, 'An error occurred while borrowing the book', 500);
} finally {
    // Ensure connection is closed
    if (isset($conn)) {
        $conn->close();
    }
}
?>
