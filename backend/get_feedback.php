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
        'message' => 'Please login to view feedback'
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
    // Debug log
    error_log("Fetching feedback for book_id: $book_id, user_id: $user_id");

    // Get feedback for the specific book and user
    $stmt = $conn->prepare("
        SELECT admin_comment, status
        FROM borrowed_books 
        WHERE id = ? AND user_id = ?
    ");

    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("ii", $book_id, $user_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Book request not found'
        ]);
    } else {
        $row = $result->fetch_assoc();
        if ($row['status'] !== 'Rejected') {
            echo json_encode([
                'success' => false,
                'message' => 'Feedback is only available for rejected requests'
            ]);
        } else if (empty($row['admin_comment'])) {
            echo json_encode([
                'success' => true,
                'feedback' => 'The administrator has not provided any feedback for this request.'
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'feedback' => $row['admin_comment']
            ]);
        }
    }
} catch (Exception $e) {
    error_log("Error in get_feedback.php: " . $e->getMessage());
    error_log("SQL State: " . $e->getCode());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    echo json_encode([
        'success' => false,
        'message' => 'Unable to load feedback at this time. Please try again later.',
        'debug' => $e->getMessage() // Remove this in production
    ]);
}

if (isset($stmt)) {
    $stmt->close();
}
if (isset($conn)) {
    $conn->close();
}
?> 