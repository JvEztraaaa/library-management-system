<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

try {
    $conn = new mysqli("localhost", "root", "", "library");
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Get total students
    $total_students = $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'user'")->fetch_assoc()['count'];

    // Get total check-ins (from index page)
    $check_ins = $conn->query("SELECT SUM(check_in_count) as count FROM users WHERE role = 'user'")->fetch_assoc()['count'] ?? 0;

    // Get total logins (from login page)
    $logins = $conn->query("SELECT COUNT(*) as count FROM login_log")->fetch_assoc()['count'] ?? 0;

    // Calculate total visitors (check-ins + logins)
    $visitors_count = $check_ins + $logins;

    // Get total borrowed books (excluding rejected)
    $total_borrowed = $conn->query("SELECT COUNT(*) as count FROM borrowed_books WHERE status != 'Rejected'")->fetch_assoc()['count'];

    // Get total overdue books
    $total_overdue = $conn->query("SELECT COUNT(*) as count FROM borrowed_books WHERE status = 'Overdue'")->fetch_assoc()['count'];

    // Get recent activity log (last 5 activities)
    $activity_log = [];
    $activity_query = "SELECT bb.title, bb.status, bb.borrow_time, u.first_name, u.last_name 
                      FROM borrowed_books bb 
                      JOIN users u ON bb.user_id = u.id 
                      ORDER BY bb.borrow_time DESC 
                      LIMIT 5";
    $activity_result = $conn->query($activity_query);
    while ($row = $activity_result->fetch_assoc()) {
        $action = '';
        switch($row['status']) {
            case 'Approved':
                $action = 'borrowed';
                break;
            case 'Rejected':
                $action = 'request was rejected';
                break;
            case 'Pending':
                $action = 'wants to borrow';
                break;
            default:
                $action = $row['status'];
        }
        
        $activity_log[] = [
            'student_name' => $row['first_name'] . ' ' . $row['last_name'],
            'action' => $action,
            'book_title' => $row['title'],
            'time' => $row['borrow_time']
        ];
    }

    // Get student engagement data (last 3 days)
    $engagement_data = [];
    
    // Get data for last 3 days
    $engagement_query = "SELECT 
                            DATE(borrow_time) as date,
                            COUNT(DISTINCT user_id) as total_students,
                            SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as borrowed_books,
                            COUNT(CASE WHEN status = 'Overdue' THEN 1 END) as overdue_books
                        FROM borrowed_books 
                        WHERE borrow_time >= DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY)
                        GROUP BY DATE(borrow_time)
                        ORDER BY date ASC";
    $engagement_result = $conn->query($engagement_query);
    
    // Fill in missing dates with zero values
    $dates = [];
    for ($i = 2; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $dates[$date] = [
            'date' => $date,
            'total_students' => 0,
            'borrowed_books' => 0,
            'overdue_books' => 0
        ];
    }
    
    while ($row = $engagement_result->fetch_assoc()) {
        $dates[$row['date']] = [
            'date' => $row['date'],
            'total_students' => (int)$row['total_students'],
            'borrowed_books' => (int)$row['borrowed_books'],
            'overdue_books' => (int)$row['overdue_books']
        ];
    }
    
    $engagement_data = array_values($dates);

    // Get book category statistics
    $category_stats = [];
    $category_query = "SELECT 
                        SUBSTRING_INDEX(genre, ',', 1) as main_genre, 
                        COUNT(*) as count 
                      FROM borrowed_books 
                      WHERE status != 'Rejected'
                      AND genre IS NOT NULL 
                      AND genre != ''
                      GROUP BY main_genre 
                      ORDER BY count DESC 
                      LIMIT 5";
    
    // Debug: Log the query results
    $category_result = $conn->query($category_query);
    if (!$category_result) {
        error_log("Category query error: " . $conn->error);
    }
    
    while ($row = $category_result->fetch_assoc()) {
        error_log("Genre: " . $row['main_genre'] . ", Count: " . $row['count']);
        $category_stats[] = [
            'genre' => $row['main_genre'],
            'count' => (int)$row['count']
        ];
    }

    // Add debug info to the response
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_students' => (int)$total_students,
            'visitors_count' => (int)$visitors_count,
            'total_borrowed' => (int)$total_borrowed,
            'total_out' => (int)$total_overdue,
            'activity_log' => $activity_log,
            'engagement_data' => $engagement_data,
            'category_stats' => $category_stats
        ]
    ]);

} catch (Exception $e) {
    error_log("Error in get_admin_stats.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?> 