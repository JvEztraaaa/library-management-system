<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to browser
ini_set('log_errors', 1); // Log errors instead

header('Content-Type: application/json');
session_start();

// Use the correct path to config file
require_once 'config/database.php';

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

// Get POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data: ' . json_last_error_msg()]);
    exit;
}

$approval_id = $data['approval_id'] ?? null;

if (!$approval_id) {
    echo json_encode(['success' => false, 'message' => 'Invalid approval ID']);
    exit;
}

try {
    // Get approval details including student information
    $stmt = $conn->prepare("
        SELECT bb.*, u.email, u.student_number, u.first_name, u.last_name, u.id as user_id
        FROM borrowed_books bb
        JOIN users u ON bb.user_id = u.id
        WHERE bb.id = ?
    ");
    
    if (!$stmt) {
        throw new Exception("Database prepare error: " . $conn->error);
    }
    
    $stmt->bind_param("i", $approval_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Database execute error: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $approval = $result->fetch_assoc();

    if (!$approval) {
        echo json_encode(['success' => false, 'message' => 'Approval not found']);
        exit;
    }

    // Calculate overdue days and fine
    $due_date = new DateTime($approval['due_date']);
    $today = new DateTime();
    $overdue_days = $today->diff($due_date)->days;
    $fine_per_day = 20; // ₱20 per day as per the trigger in the database
    $total_fine = $overdue_days * $fine_per_day;

    // Create notification message
    $student_name = $approval['first_name'] . ' ' . $approval['last_name'];
    $message = "Dear {$student_name},\n\n";
    $message .= "This is a reminder that you have an overdue book:\n";
    $message .= "Book Title: {$approval['title']}\n";
    $message .= "Due Date: " . $due_date->format('F j, Y') . "\n";
    $message .= "Days Overdue: {$overdue_days} days\n";
    $message .= "Fine Amount: ₱{$total_fine}\n\n";
    $message .= "Please return the book and settle the fine at the library counter.\n";
    $message .= "Thank you for your cooperation.\n\n";
    $message .= "Library Management System";

    // Insert notification into notifications table
    $stmt = $conn->prepare("
        INSERT INTO notifications (user_id, type, book_title, message, timestamp)
        VALUES (?, 'overdue', ?, ?, NOW())
    ");
    
    if (!$stmt) {
        throw new Exception("Database prepare error for notification: " . $conn->error);
    }
    
    $stmt->bind_param("iss", $approval['user_id'], $approval['title'], $message);
    
    if (!$stmt->execute()) {
        throw new Exception("Database execute error for notification: " . $stmt->error);
    }

    // Also insert into user_notifications table
    $stmt = $conn->prepare("
        INSERT INTO user_notifications (user_id, type, message, book_id, is_read, created_at)
        VALUES (?, 'overdue', ?, ?, 0, NOW())
    ");
    
    if (!$stmt) {
        throw new Exception("Database prepare error for user notification: " . $conn->error);
    }
    
    $stmt->bind_param("isi", $approval['user_id'], $message, $approval_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Database execute error for user notification: " . $stmt->error);
    }

    // Send email notification if email exists
    if (!empty($approval['email'])) {
        $to = $approval['email'];
        $subject = "Overdue Book Reminder - {$approval['title']}";
        $headers = "From: library@nudasma.edu.ph\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

        if (!mail($to, $subject, $message, $headers)) {
            // Log email failure but don't stop the process
            error_log("Failed to send email to: " . $to);
        }
    }

    echo json_encode(['success' => true, 'message' => 'Notification sent successfully']);

} catch (Exception $e) {
    error_log("Error in send_overdue_notification.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error sending notification: ' . $e->getMessage()]);
}
?> 