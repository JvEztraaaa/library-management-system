<?php
session_start();
require_once 'db_connection.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Please login first']);
    exit;
}

if (!isset($_POST['book_id'])) {
    echo json_encode(['success' => false, 'message' => 'Book ID is required']);
    exit;
}

$book_id = $_POST['book_id'];
$user_id = $_SESSION['user_id'];

try {
    // Start transaction
    $conn->begin_transaction();

    // First verify the book belongs to this user and is in pending status
    $check_stmt = $conn->prepare("SELECT id FROM borrowed_books WHERE id = ? AND user_id = ? AND status = 'Pending'");
    $check_stmt->bind_param("ii", $book_id, $user_id);
    $check_stmt->execute();
    $result = $check_stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception("Book not found or cannot be cancelled");
    }

    // Delete the book from borrowed_books table
    $delete_stmt = $conn->prepare("DELETE FROM borrowed_books WHERE id = ? AND user_id = ?");
    $delete_stmt->bind_param("ii", $book_id, $user_id);
    
    if (!$delete_stmt->execute()) {
        throw new Exception("Failed to cancel borrow request");
    }

    // Commit transaction
    $conn->commit();
    
    echo json_encode(['success' => true, 'message' => 'Borrow request cancelled successfully']);

} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
?> 