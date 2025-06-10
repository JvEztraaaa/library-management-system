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

// Database configuration
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'library';

// Create connection
$conn = mysqli_connect($host, $username, $password, $database);

// Check connection
if (!$conn) {
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . mysqli_connect_error()
    ]));
}

// Set charset to utf8mb4
mysqli_set_charset($conn, "utf8mb4");

try {
    $status = isset($_GET['status']) ? $_GET['status'] : 'all';
    $requestId = isset($_GET['id']) ? (int)$_GET['id'] : null;
    
    $statusFilter = "";
    $idFilter = "";
    $queryParams = [];
    $paramTypes = "";

    if ($requestId) {
        $idFilter = "WHERE bb.id = ?";
        $queryParams[] = $requestId;
        $paramTypes .= "i";
    } else if ($status !== 'all') {
        $statusFilter = "WHERE bb.status = ?";
        $queryParams[] = $status;
        $paramTypes .= "s";
    }
    
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
            bb.fine_amount,
            u.first_name,
            u.last_name
        FROM borrowed_books bb
        JOIN users u ON bb.user_id = u.id
        $statusFilter
        $idFilter
        ORDER BY bb.borrow_time DESC
    ";

    $stmt = mysqli_prepare($conn, $query);
    
    if (!empty($queryParams)) {
        mysqli_stmt_bind_param($stmt, $paramTypes, ...$queryParams);
    }
    
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    
    $requests = [];
    while ($row = mysqli_fetch_assoc($result)) {
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
            'approved_at' => $row['approved_at'],
            'fine_amount' => $row['fine_amount']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'requests' => $requests
    ]);

} catch (Exception $e) {
    error_log("Error in admin_get_approval_requests.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching approval requests: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        mysqli_close($conn);
    }
}
?> 