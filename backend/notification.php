<?php
// Function to create a notification
function createNotification($conn, $user_id, $type, $book_title, $message) {
    $sql = "INSERT INTO notifications (user_id, type, book_title, message) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        error_log("Prepare failed: " . $conn->error);
        return false;
    }
    
    $stmt->bind_param("isss", $user_id, $type, $book_title, $message);
    
    $result = $stmt->execute();
    $stmt->close();
    
    return $result;
}

// Function to get notifications
function getNotifications($conn) {
    $sql = "SELECT n.*, u.first_name, u.last_name 
            FROM notifications n 
            JOIN users u ON n.user_id = u.id 
            ORDER BY n.timestamp DESC";
            
    $result = $conn->query($sql);
    
    if (!$result) {
        error_log("Query failed: " . $conn->error);
        return false;
    }
    
    $notifications = [];
    while ($row = $result->fetch_assoc()) {
        $notifications[] = [
            'id' => $row['id'],
            'type' => $row['type'],
            'book_title' => $row['book_title'],
            'message' => $row['message'],
            'timestamp' => $row['timestamp'],
            'student_name' => $row['first_name'] . ' ' . $row['last_name']
        ];
    }
    
    $result->close();
    return $notifications;
}

// Function to check if user is admin
function isAdmin() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}

// Function to check if user is logged in
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}
?>
