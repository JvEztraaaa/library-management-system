<?php
session_start();
header('Content-Type: application/json');
require_once 'status.php';

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized access'
    ]);
    exit;
}

// Get JSON data from request body
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['request_id']) || !isset($data['status'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required parameters'
    ]);
    exit;
}

$requestId = $data['request_id'];
$status = $data['status'];
$comment = isset($data['comment']) ? $data['comment'] : '';
$adminId = $_SESSION['user_id'];

try {
    // Start transaction
    $conn->begin_transaction();

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
    $stmt->bind_param('ssii', $status, $comment, $adminId, $requestId);
    $stmt->execute();

    // Create notification for the student
    $notificationQuery = "
        INSERT INTO notifications (user_id, type, book_title, message)
        SELECT 
            bb.user_id,
            ?,
            bb.title,
            CONCAT('Your request for \"', bb.title, '\" has been ', LOWER(?))
        FROM borrowed_books bb
        WHERE bb.id = ?
    ";
    
    $stmt = $conn->prepare($notificationQuery);
    $stmt->bind_param('ssi', $status, $status, $requestId);
    $stmt->execute();

    // Commit transaction
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Request status updated successfully'
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    
    echo json_encode([
        'success' => false,
        'message' => 'Error updating request status: ' . $e->getMessage()
    ]);
}

$conn->close();
?> 