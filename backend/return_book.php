<?php
session_start();
require_once 'db_connection.php';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Please login to return books'
    ]);
    exit;
}

// Check if book_id is provided
if (!isset($_POST['book_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Book ID is required'
    ]);
    exit;
}

$book_id = $_POST['book_id'];
$user_id = $_SESSION['user_id'];

try {
    // Start transaction
    $conn->begin_transaction();

    // Debug: Log the incoming data
    error_log("Attempting to return book. Book ID: $book_id, User ID: $user_id");

    // First check if the book exists and belongs to the user
    $check_stmt = $conn->prepare("
        SELECT id, title, status 
        FROM borrowed_books 
        WHERE id = ? AND user_id = ? AND status IN ('Approved', 'Overdue')
    ");

    if (!$check_stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $check_stmt->bind_param("ii", $book_id, $user_id);
    
    if (!$check_stmt->execute()) {
        throw new Exception("Execute failed: " . $check_stmt->error);
    }

    $result = $check_stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception("Book not found or cannot be returned");
    }

    $borrowed_book = $result->fetch_assoc();

    // Debug: Log the found book data
    error_log("Found borrowed book: " . print_r($borrowed_book, true));

    // Update the borrowed_books table
    $update_stmt = $conn->prepare("
        UPDATE borrowed_books 
        SET status = 'Returned', 
            return_time = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
    ");
    $update_stmt->bind_param("ii", $book_id, $user_id);
    
    if (!$update_stmt->execute()) {
        throw new Exception("Failed to update borrowed book status");
    }

    // Commit transaction
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Book returned successfully'
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($conn)) {
        $conn->rollback();
    }
    
    error_log("Error in return_book.php: " . $e->getMessage());
    error_log("SQL State: " . $e->getCode());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    echo json_encode([
        'success' => false,
        'message' => 'Error returning book: ' . $e->getMessage()
    ]);
}

// Close statements
if (isset($check_stmt)) $check_stmt->close();
if (isset($update_stmt)) $update_stmt->close();
if (isset($conn)) $conn->close();
?> 