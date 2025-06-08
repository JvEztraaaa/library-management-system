<?php
require_once 'db_connection.php';

try {
    // Get all borrowed books that are overdue
    $stmt = $conn->prepare("
        SELECT bb.id, bb.user_id, bb.book_id, b.title, bb.due_date
        FROM borrowed_books bb
        JOIN books b ON bb.book_id = b.id
        WHERE bb.status = 'approved'
        AND bb.due_date < NOW()
        AND bb.returned_at IS NULL
    ");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $conn->begin_transaction();
    
    while ($row = $result->fetch_assoc()) {
        // Create overdue notification
        $notification_type = 'borrow_overdue';
        $message = "Warning: Your borrowed book \"{$row['title']}\" is overdue. Please return it as soon as possible.";
        
        $stmt = $conn->prepare("
            INSERT INTO notifications (user_id, book_id, type, message)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->bind_param("iiss", $row['user_id'], $row['book_id'], $notification_type, $message);
        $stmt->execute();
    }
    
    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Overdue books checked successfully']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?> 