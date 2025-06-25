<?php
session_start();
require_once 'db_connection.php';

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $book_id = $_POST['book_id'] ?? '';
    $user_id = $_POST['user_id'] ?? '';

    if (empty($book_id) || empty($user_id)) {
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

        // Update book status to returned
        $stmt = $conn->prepare("UPDATE borrowed_books SET status = 'returned', returned_at = NOW() WHERE id = ?");
        $stmt->bind_param("i", $book_id);
        $stmt->execute();

        // Create notification for user
        $notification_type = 'return_confirmed';
        $message = "Your return of \"$book_title\" has been confirmed.";
        
        // Insert notification
        $stmt = $conn->prepare("INSERT INTO notifications (user_id, admin_id, book_id, type, message) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("iiiss", $user_id, $_SESSION['user_id'], $book_id, $notification_type, $message);
        $stmt->execute();

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Book marked as returned successfully']);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?> 