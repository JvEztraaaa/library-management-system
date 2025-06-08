<?php
session_start();
require_once '../config/database.php';

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    sendJsonResponse(false, 'Unauthorized access', 401);
}

// Get JSON data from request body
$json_data = file_get_contents('php://input');
if (!$json_data) {
    sendJsonResponse(false, 'No data received', 400);
}

$data = json_decode($json_data, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    sendJsonResponse(false, 'Invalid JSON data', 400);
}

if (!isset($data['request_id'])) {
    sendJsonResponse(false, 'Missing request ID', 400);
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
    $stmt->bind_param('ii', $adminId, $requestId);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update book status");
    }

    if ($stmt->affected_rows === 0) {
        throw new Exception("No overdue book found with the given ID");
    }

    // Get the book details for notification
    $bookQuery = "SELECT title, user_id FROM borrowed_books WHERE id = ?";
    $stmt = $conn->prepare($bookQuery);
    $stmt->bind_param('i', $requestId);
    $stmt->execute();
    $result = $stmt->get_result();
    $book = $result->fetch_assoc();

    if ($book) {
        // Create notification for the user
        $notificationQuery = "INSERT INTO user_notifications (user_id, type, message, book_id) 
                            VALUES (?, 'return', ?, ?)";
        $message = "Your overdue book \"{$book['title']}\" has been marked as paid and returned.";
        $stmt = $conn->prepare($notificationQuery);
        $stmt->bind_param('isi', $book['user_id'], $message, $requestId);
        $stmt->execute();
    }

    // Commit transaction
    $conn->commit();
    sendJsonResponse(true, 'Book marked as paid and returned successfully');

} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    sendJsonResponse(false, $e->getMessage(), 500);
}

function sendJsonResponse($success, $message, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message
    ]);
    exit;
} 