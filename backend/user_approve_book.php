<?php
session_start();
require_once 'db_connection.php';

// Enable error logging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'debug.log');

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $book_id = $_POST['book_id'] ?? '';
    $action = $_POST['action'] ?? '';
    $user_id = $_POST['user_id'] ?? '';

    error_log("Received request - Book ID: $book_id, Action: $action, User ID: $user_id");

    if (empty($book_id) || empty($action) || empty($user_id)) {
        echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
        exit;
    }

    try {
        $conn->begin_transaction();

        // Get book title for notification
        $stmt = $conn->prepare("SELECT b.title FROM borrowed_books bb JOIN books b ON bb.book_id = b.id WHERE bb.id = ?");
        $stmt->bind_param("i", $book_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $book = $result->fetch_assoc();
        $book_title = $book['title'];

        error_log("Book title retrieved: $book_title");

        if ($action === 'approve') {
            // Update book status to approved
            $stmt = $conn->prepare("UPDATE borrowed_books SET status = 'approved', approved_by = ?, approved_at = NOW() WHERE id = ?");
            $stmt->bind_param("ii", $_SESSION['user_id'], $book_id);
            $stmt->execute();

            // Create notification for user
            $notification_type = 'borrow_approved';
            $message = "Your request to borrow \"$book_title\" has been approved.";
        } else if ($action === 'reject') {
            // Update book status to rejected
            $stmt = $conn->prepare("UPDATE borrowed_books SET status = 'rejected', approved_by = ?, approved_at = NOW() WHERE id = ?");
            $stmt->bind_param("ii", $_SESSION['user_id'], $book_id);
            $stmt->execute();

            // Create notification for user
            $notification_type = 'borrow_rejected';
            $message = "Your request to borrow \"$book_title\" has been rejected.";
        } else {
            throw new Exception('Invalid action');
        }

        error_log("Creating notification - Type: $notification_type, Message: $message");

        // Insert notification into user_notifications table
        $stmt = $conn->prepare("INSERT INTO user_notifications (user_id, admin_id, book_id, type, message) VALUES (?, ?, ?, ?, ?)");
        if (!$stmt) {
            error_log("Prepare failed: " . $conn->error);
            throw new Exception("Failed to prepare notification insert statement");
        }
        
        $stmt->bind_param("iiiss", $user_id, $_SESSION['user_id'], $book_id, $notification_type, $message);
        if (!$stmt->execute()) {
            error_log("Execute failed: " . $stmt->error);
            throw new Exception("Failed to insert notification");
        }

        error_log("Notification inserted successfully");

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Book request ' . $action . 'd successfully']);
    } catch (Exception $e) {
        $conn->rollback();
        error_log("Error occurred: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?> 