<?php
// Prevent any output before headers
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Start output buffering to catch any unexpected output
ob_start();

session_start();

// Set JSON header
header('Content-Type: application/json');

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    ob_end_clean();
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized access'
    ]);
    exit;
}

// Include database configuration
require_once __DIR__ . '/../config/database.php';

// Get JSON data from request body
$json_data = file_get_contents('php://input');
if (!$json_data) {
    ob_end_clean();
    echo json_encode([
        'success' => false,
        'message' => 'No data received'
    ]);
    exit;
}

$data = json_decode($json_data, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    ob_end_clean();
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON data'
    ]);
    exit;
}

if (!isset($data['request_id'])) {
    ob_end_clean();
    echo json_encode([
        'success' => false,
        'message' => 'Missing request ID'
    ]);
    exit;
}

$requestId = $data['request_id'];
$adminId = $_SESSION['user_id'];

try {
    // Start transaction
    $conn->begin_transaction();

    // Update the borrowed book status to Returned
    $updateQuery = "UPDATE borrowed_books 
                   SET status = 'Returned', 
                       return_time = NOW(),
                       approved_by = ? 
                   WHERE id = ? AND status = 'Overdue'";
    
    $stmt = $conn->prepare($updateQuery);
    if (!$stmt) {
        throw new Exception("Database error: " . $conn->error);
    }
    
    $stmt->bind_param('ii', $adminId, $requestId);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update book status: " . $stmt->error);
    }

    if ($stmt->affected_rows === 0) {
        throw new Exception("No overdue book found with the given ID");
    }

    // Get the book details for notification
    $bookQuery = "SELECT title, user_id FROM borrowed_books WHERE id = ?";
    $stmt = $conn->prepare($bookQuery);
    if (!$stmt) {
        throw new Exception("Database error: " . $conn->error);
    }
    
    $stmt->bind_param('i', $requestId);
    if (!$stmt->execute()) {
        throw new Exception("Failed to get book details: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $book = $result->fetch_assoc();

    if ($book) {
        // Create notification for the user
        $notificationQuery = "INSERT INTO user_notifications (user_id, type, message, book_id) 
                            VALUES (?, 'return', ?, ?)";
        $stmt = $conn->prepare($notificationQuery);
        if (!$stmt) {
            throw new Exception("Database error: " . $conn->error);
        }
        
        $message = "Your overdue book \"{$book['title']}\" has been marked as paid and returned.";
        $stmt->bind_param('isi', $book['user_id'], $message, $requestId);
        if (!$stmt->execute()) {
            throw new Exception("Failed to create notification: " . $stmt->error);
        }
    }

    // Commit transaction
    $conn->commit();

    // Clear any output buffer
    ob_end_clean();

    echo json_encode([
        'success' => true,
        'message' => 'Book marked as paid and returned successfully'
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollback();
    }
    
    // Clear any output buffer
    ob_end_clean();
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} 