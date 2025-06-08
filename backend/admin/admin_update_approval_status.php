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
$status_file = __DIR__ . '/../status.php';
if (!file_exists($status_file)) {
    error_log("Required file not found: " . $status_file);
    sendJsonResponse(false, 'Server configuration error', 500);
}

require_once $status_file;

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    sendJsonResponse(false, 'Unauthorized access', 403);
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

if (!isset($data['request_id']) || !isset($data['status'])) {
    sendJsonResponse(false, 'Missing required parameters', 400);
}

$requestId = $data['request_id'];
$status = $data['status'];
$comment = isset($data['comment']) ? trim($data['comment']) : '';

// Validate that comment is provided when rejecting
if ($status === 'Rejected' && empty($comment)) {
    sendJsonResponse(false, 'Feedback is required when rejecting a request', 400);
}

$adminId = $_SESSION['user_id'];

try {
    // Start transaction
    $conn->begin_transaction();

    // Get book and user details for notification
    $detailsQuery = "
        SELECT bb.*, u.id as user_id 
        FROM borrowed_books bb 
        JOIN users u ON bb.user_id = u.id 
        WHERE bb.id = ?
    ";
    $stmt = $conn->prepare($detailsQuery);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param('i', $requestId);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $details = $result->fetch_assoc();
    
    if (!$details) {
        throw new Exception("Book request not found");
    }

    // Update the borrowed_books record
    $updateQuery = "
        UPDATE borrowed_books 
        SET status = ?,
            admin_comment = ?,
            approved_by = ?,
            approved_at = NOW()
        WHERE id = ?
    ";
    
    $stmt = $conn->prepare($updateQuery);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param('ssii', $status, $comment, $adminId, $requestId);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }

    // Delete the corresponding notification
    $deleteNotificationQuery = "
        DELETE FROM notifications 
        WHERE book_title = (
            SELECT title 
            FROM borrowed_books 
            WHERE id = ?
        )
        AND type = 'pending'
    ";
    
    $deleteStmt = $conn->prepare($deleteNotificationQuery);
    if (!$deleteStmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $deleteStmt->bind_param('i', $requestId);
    if (!$deleteStmt->execute()) {
        throw new Exception("Execute failed: " . $deleteStmt->error);
    }

    // Create user notification
    $userMessage = $status === 'Approved' 
        ? "Your request to borrow \"{$details['title']}\" has been approved."
        : "Your request to borrow \"{$details['title']}\" has been rejected. Reason: $comment";

    $userNotificationQuery = "
        INSERT INTO user_notifications (user_id, book_id, type, message) 
        VALUES (?, ?, ?, ?)
    ";
    
    $stmt = $conn->prepare($userNotificationQuery);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $userType = $status === 'Approved' ? 'borrow_approved' : 'borrow_rejected';
    $stmt->bind_param('iiss', $details['user_id'], $requestId, $userType, $userMessage);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }

    // Commit transaction
    $conn->commit();

    sendJsonResponse(true, 'Request status updated successfully');

} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($conn)) {
    $conn->rollback();
    }
    
    error_log("Error in admin_update_approval_status.php: " . $e->getMessage() . "\nStack trace: " . $e->getTraceAsString());
    sendJsonResponse(false, 'Error updating request status: ' . $e->getMessage(), 500);
} finally {
    // Close statements
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($deleteStmt)) {
        $deleteStmt->close();
}
    // Close connection
    if (isset($conn)) {
$conn->close();
    }
}
?> 