<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized access'
    ]);
    exit;
}

try {
    require_once 'status.php';
    
    $status = isset($_GET['status']) ? $_GET['status'] : 'all';
    $statusFilter = $status !== 'all' ? "WHERE bb.status = ?" : "";
    
    $query = "
        SELECT 
            bb.id,
            bb.title as book_title,
            bb.author,
            bb.genre,
            bb.status,
            bb.borrow_time,
            bb.due_date,
            bb.admin_comment,
            bb.approved_by,
            bb.approved_at,
            u.first_name,
            u.last_name
        FROM borrowed_books bb
        JOIN users u ON bb.user_id = u.id
        $statusFilter
        ORDER BY bb.borrow_time DESC
    ";

    $stmt = $conn->prepare($query);
    
    if ($status !== 'all') {
        $stmt->bind_param('s', $status);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $requests = [];
    while ($row = $result->fetch_assoc()) {
        $requests[] = [
            'id' => $row['id'],
            'book_title' => $row['book_title'],
            'author' => $row['author'],
            'genre' => $row['genre'],
            'student_name' => $row['first_name'] . ' ' . $row['last_name'],
            'borrow_time' => $row['borrow_time'],
            'due_date' => $row['due_date'],
            'status' => $row['status'],
            'admin_comment' => $row['admin_comment'],
            'approved_by' => $row['approved_by'],
            'approved_at' => $row['approved_at']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'requests' => $requests
    ]);

} catch (Exception $e) {
    error_log("Error in get_approval_requests.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching approval requests: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?> 