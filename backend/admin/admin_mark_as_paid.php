<?php
// Prevent any output before headers
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/php_errors.log');

// Start output buffering to catch any unexpected output
ob_start();

session_start();

// Set JSON header
header('Content-Type: application/json');

// Function to send JSON response and exit
function sendJsonResponse($success, $message) {
    ob_end_clean();
    echo json_encode([
        'success' => $success,
        'message' => $message
    ]);
    exit;
}

// Function to log error
function logError($message) {
    error_log("Error in admin_mark_as_paid.php: " . $message);
}

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    logError("Unauthorized access attempt");
    sendJsonResponse(false, 'Unauthorized access');
}

// Include database configuration
require_once __DIR__ . '/../config/database.php';

// Verify database connection
if (!isset($conn) || $conn->connect_error) {
    logError("Database connection failed: " . ($conn->connect_error ?? 'Connection not established'));
    sendJsonResponse(false, 'Database connection failed');
}

// Get JSON data from request body
$json_data = file_get_contents('php://input');
if (!$json_data) {
    logError("No data received in request");
    sendJsonResponse(false, 'No data received');
}

$data = json_decode($json_data, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    logError("Invalid JSON data: " . json_last_error_msg());
    sendJsonResponse(false, 'Invalid JSON data: ' . json_last_error_msg());
}

if (!isset($data['request_id'])) {
    logError("Missing request ID in data");
    sendJsonResponse(false, 'Missing request ID');
}

$requestId = $data['request_id'];
$adminId = $_SESSION['user_id'];

try {
    // Start transaction
    if (!$conn->begin_transaction()) {
        throw new Exception("Failed to start transaction: " . $conn->error);
    }

    // First check if the book exists and is overdue
    $checkQuery = "SELECT id, status FROM borrowed_books WHERE id = ?";
    $stmt = $conn->prepare($checkQuery);
    if (!$stmt) {
        throw new Exception("Database error preparing check query: " . $conn->error);
    }
    
    $stmt->bind_param('i', $requestId);
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute check query: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $book = $result->fetch_assoc();
    
    if (!$book) {
        throw new Exception("Book request not found with ID: " . $requestId);
    }
    
    if ($book['status'] !== 'Overdue') {
        throw new Exception("Book is not in overdue status. Current status: " . $book['status']);
    }

    // Update the borrowed book status to Returned
    $updateQuery = "UPDATE borrowed_books 
                   SET status = 'Returned', 
                       return_time = NOW(),
                       approved_by = ? 
                   WHERE id = ? AND status = 'Overdue'";
    
    $stmt = $conn->prepare($updateQuery);
    if (!$stmt) {
        throw new Exception("Database error preparing update query: " . $conn->error);
    }
    
    $stmt->bind_param('ii', $adminId, $requestId);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute update query: " . $stmt->error);
    }

    if ($stmt->affected_rows === 0) {
        throw new Exception("No overdue book found with ID: " . $requestId);
    }

    // Get the book details for notification
    $bookQuery = "SELECT title, user_id FROM borrowed_books WHERE id = ?";
    $stmt = $conn->prepare($bookQuery);
    if (!$stmt) {
        throw new Exception("Database error preparing book query: " . $conn->error);
    }
    
    $stmt->bind_param('i', $requestId);
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute book query: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $book = $result->fetch_assoc();

    if ($book) {
        // Create notification for the user
        $notificationQuery = "INSERT INTO user_notifications (user_id, type, message, book_id) 
                            VALUES (?, 'return', ?, ?)";
        $stmt = $conn->prepare($notificationQuery);
        if (!$stmt) {
            throw new Exception("Database error preparing notification query: " . $conn->error);
        }
        
        $message = "Your overdue book \"{$book['title']}\" has been marked as paid and returned.";
        $stmt->bind_param('isi', $book['user_id'], $message, $requestId);
        if (!$stmt->execute()) {
            throw new Exception("Failed to create notification: " . $stmt->error);
        }
    }

    // Commit transaction
    if (!$conn->commit()) {
        throw new Exception("Failed to commit transaction: " . $conn->error);
    }

    // Send success response
    sendJsonResponse(true, 'Book marked as paid and returned successfully');

} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollback();
    }
    
    // Log the error
    logError($e->getMessage());
    
    // Send error response
    sendJsonResponse(false, $e->getMessage());
} 