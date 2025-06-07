<?php
require_once 'status.php';

try {
    // Update status to overdue for books past their due date
    $updateQuery = "
        UPDATE borrowed_books 
        SET status = 'Overdue'
        WHERE (status = 'Approved' OR status = 'Pending')
        AND due_date < NOW()
    ";
    
    $result = $conn->query($updateQuery);
    
    if ($result) {
        // Get the updated books to create notifications
        $selectQuery = "
            SELECT bb.*, u.first_name, u.last_name 
            FROM borrowed_books bb
            JOIN users u ON bb.user_id = u.id
            WHERE bb.status = 'Overdue'
            AND bb.due_date < NOW()
        ";
        
        $result = $conn->query($selectQuery);
        
        while ($row = $result->fetch_assoc()) {
            $user_name = $row['first_name'] . ' ' . $row['last_name'];
            $message = $user_name . "'s book \"" . $row['title'] . "\" is overdue.";
            createAdminNotification($conn, $row['user_id'], 'overdue', $row['title'], $message);
        }
        
        echo json_encode(['success' => true, 'message' => 'Overdue books updated successfully']);
    } else {
        throw new Exception("Failed to update overdue books");
    }
    
} catch (Exception $e) {
    error_log("Error in admin_check_overdue.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error updating overdue books']);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?> 