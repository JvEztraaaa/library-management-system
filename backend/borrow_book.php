<?php
session_start();
header('Content-Type: application/json');

// Include database connection and functions
require_once 'notification.php';

try {
    if (!isLoggedIn()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'unauthorized']);
        exit;
    }

    // Validate input
    if (!isset($_POST['title']) || !isset($_POST['author']) || !isset($_POST['genre'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    $title = trim($_POST['title']);
    $author = trim($_POST['author']);
    $genre = trim($_POST['genre']);
    $user_id = $_SESSION['user_id'];

    if (empty($title) || empty($author) || empty($genre)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }

    $host = "localhost";
    $user = "root";
    $pass = "";
    $db = "library";

    $conn = new mysqli($host, $user, $pass, $db);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // ✅ Check if book is already borrowed (based on title)
    $check = $conn->prepare("SELECT id FROM borrowed_books WHERE title = ?");
    if (!$check) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $check->bind_param("s", $title);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'already_borrowed']);
        $check->close();
        $conn->close();
        exit;
    }
    $check->close();

    // Insert book since it's not borrowed yet
    $sql = "INSERT INTO borrowed_books (title, author, genre, user_id, status, borrow_time, due_date) 
            VALUES (?, ?, ?, ?, 'Pending', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("sssi", $title, $author, $genre, $user_id);
    $result = $stmt->execute();

    if ($result && $stmt->affected_rows > 0) {
        // Get user's name for the notification
        $user_query = "SELECT first_name, last_name FROM users WHERE id = ?";
        $user_stmt = $conn->prepare($user_query);
        if (!$user_stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $user_stmt->bind_param("i", $user_id);
        $user_stmt->execute();
        $user_result = $user_stmt->get_result();
        $user_data = $user_result->fetch_assoc();
        $user_name = $user_data['first_name'] . ' ' . $user_data['last_name'];
        
        // Create notification for borrow request
        $message = $user_name . " requested to borrow the book \"" . $title . "\".";
        createNotification($conn, $user_id, 'pending', $title, $message);
        
        $user_stmt->close();
        echo json_encode(['success' => true, 'message' => 'Book borrow request submitted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to submit borrow request']);
    }

    $stmt->close();

} catch (Exception $e) {
    error_log("Error in borrow_book.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred while borrowing the book']);
} finally {
    // Ensure connection is closed
    if (isset($conn)) {
        $conn->close();
    }
}
?>
