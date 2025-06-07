<?php
// Prevent PHP errors from being displayed
error_reporting(0);
ini_set('display_errors', 0);

// Database configuration
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'library';

// Create connection
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]));
}

// Set charset to utf8mb4
if (!$conn->set_charset("utf8mb4")) {
    die(json_encode([
        'success' => false,
        'message' => 'Error setting charset: ' . $conn->error
    ]));
}

// Start session
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Please log in first'
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

// Handle different operations
$operation = $_POST['operation'] ?? '';

switch ($operation) {
    case 'get':
        // Get user's notifications
        try {
            $stmt = $conn->prepare("
                SELECT n.*, u.username as admin_name, b.title as book_title
                FROM notifications n 
                LEFT JOIN users u ON n.admin_id = u.id 
                LEFT JOIN borrowed_books b ON n.book_id = b.id
                WHERE n.user_id = ? 
                ORDER BY n.created_at DESC 
                LIMIT 10
            ");
            
            if (!$stmt) {
                throw new Exception("Database prepare error: " . $conn->error);
            }
            
            $stmt->bind_param("i", $user_id);
            if (!$stmt->execute()) {
                throw new Exception("Database execute error: " . $stmt->error);
            }
            
            $result = $stmt->get_result();
            $notifications = [];
            
            while ($row = $result->fetch_assoc()) {
                // Format the message based on notification type
                $message = formatNotificationMessage($row);
                
                $notifications[] = [
                    'id' => $row['id'],
                    'message' => $message,
                    'type' => $row['type'],
                    'is_read' => (bool)$row['is_read'],
                    'created_at' => $row['created_at'],
                    'admin_name' => $row['admin_name'],
                    'book_title' => $row['book_title']
                ];
            }
            
            echo json_encode([
                'success' => true,
                'notifications' => $notifications
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
        break;

    case 'mark_read':
        // Mark notification as read
        $notification_id = $_POST['notification_id'] ?? '';
        
        if (empty($notification_id)) {
            echo json_encode([
                'success' => false,
                'message' => 'Missing notification ID'
            ]);
            exit;
        }

        try {
            $stmt = $conn->prepare("
                UPDATE notifications 
                SET is_read = 1 
                WHERE id = ? AND user_id = ?
            ");
            
            if (!$stmt) {
                throw new Exception("Database prepare error: " . $conn->error);
            }
            
            $stmt->bind_param("ii", $notification_id, $user_id);
            if (!$stmt->execute()) {
                throw new Exception("Database execute error: " . $stmt->error);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Notification marked as read'
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
        break;

    case 'mark_all_read':
        // Mark all notifications as read
        try {
            $stmt = $conn->prepare("
                UPDATE notifications 
                SET is_read = 1 
                WHERE user_id = ? AND is_read = 0
            ");
            
            if (!$stmt) {
                throw new Exception("Database prepare error: " . $conn->error);
            }
            
            $stmt->bind_param("i", $user_id);
            if (!$stmt->execute()) {
                throw new Exception("Database execute error: " . $stmt->error);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'All notifications marked as read'
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
        break;

    case 'get_unread_count':
        // Get count of unread notifications
        try {
            $stmt = $conn->prepare("
                SELECT COUNT(*) as count 
                FROM notifications 
                WHERE user_id = ? AND is_read = 0
            ");
            
            if (!$stmt) {
                throw new Exception("Database prepare error: " . $conn->error);
            }
            
            $stmt->bind_param("i", $user_id);
            if (!$stmt->execute()) {
                throw new Exception("Database execute error: " . $stmt->error);
            }
            
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            
            echo json_encode([
                'success' => true,
                'count' => (int)$row['count']
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
        break;

    default:
        echo json_encode([
            'success' => false,
            'message' => 'Invalid operation'
        ]);
        break;
}

// Helper function to format notification messages
function formatNotificationMessage($row) {
    $bookTitle = $row['book_title'] ?? 'the book';
    $adminName = $row['admin_name'] ?? 'Admin';
    
    switch ($row['type']) {
        case 'borrow_approved':
            return "Your request to borrow \"$bookTitle\" has been approved by $adminName.";
            
        case 'borrow_rejected':
            return "Your request to borrow \"$bookTitle\" has been rejected by $adminName.";
            
        case 'borrow_overdue':
            return "Warning: Your borrowed book \"$bookTitle\" is overdue. Please return it as soon as possible.";
            
        case 'return_confirmed':
            return "Your return of \"$bookTitle\" has been confirmed by $adminName.";
            
        case 'return_overdue':
            return "Your return of \"$bookTitle\" is overdue. Please return it immediately.";
            
        default:
            return $row['message'];
    }
}

$conn->close();
?> 