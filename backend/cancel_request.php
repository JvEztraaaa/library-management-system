<?php
// Prevent any output before headers
ob_start();

// Enable error logging
ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', 'php_errors.log');

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

// Log incoming request data
error_log("POST data: " . print_r($_POST, true));
error_log("Session data: " . print_r($_SESSION, true));

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    error_log("User not logged in");
    sendJsonResponse(false, 'Please log in to cancel requests', 403);
}

// Validate input
if (!isset($_POST['book_id'])) {
    error_log("Book ID not set in POST data");
    sendJsonResponse(false, 'Book ID is required', 400);
}

// Convert book_id to integer and validate
$book_id = filter_var($_POST['book_id'], FILTER_VALIDATE_INT);
error_log("Filtered book_id: " . var_export($book_id, true));

if ($book_id === false || $book_id <= 0) {
    error_log("Invalid book_id: " . var_export($_POST['book_id'], true));
    sendJsonResponse(false, 'Invalid book ID', 400);
}

$user_id = $_SESSION['user_id'];
error_log("Processing request for user_id: $user_id, book_id: $book_id");

try {
    $host = "localhost";
    $user = "root";
    $pass = "";
    $db = "library";

    $conn = new mysqli($host, $user, $pass, $db);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Check if the book request belongs to the user and is in pending status
    $check = $conn->prepare("SELECT id FROM borrowed_books WHERE id = ? AND user_id = ? AND status = 'Pending'");
    if (!$check) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $check->bind_param("ii", $book_id, $user_id);
    $check->execute();
    $check->store_result();

    error_log("Found " . $check->num_rows . " matching records");

    if ($check->num_rows === 0) {
        $check->close();
        $conn->close();
        error_log("No matching record found for book_id: $book_id, user_id: $user_id");
        sendJsonResponse(false, 'Invalid request or book is not in pending status', 400);
    }
    $check->close();

    // Delete the pending request
    $sql = "DELETE FROM borrowed_books WHERE id = ? AND user_id = ? AND status = 'Pending'";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("ii", $book_id, $user_id);
    $result = $stmt->execute();

    error_log("Delete operation result: " . ($result ? "success" : "failed"));
    error_log("Affected rows: " . $stmt->affected_rows);

    if ($result && $stmt->affected_rows > 0) {
        sendJsonResponse(true, 'Book request cancelled successfully');
    } else {
        sendJsonResponse(false, 'Failed to cancel book request', 500);
    }

    $stmt->close();

} catch (Exception $e) {
    error_log("Error in cancel_request.php: " . $e->getMessage() . "\nStack trace: " . $e->getTraceAsString());
    sendJsonResponse(false, 'An error occurred while cancelling the request', 500);
} finally {
    // Ensure connection is closed
    if (isset($conn)) {
        $conn->close();
    }
}
?> 