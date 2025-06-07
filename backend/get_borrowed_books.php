<?php
session_start();
require_once 'db_connection.php';

if (!isset($_SESSION['user_id'])) {
    echo "<tr><td colspan='7' class='placeholder'>Please login to view your borrowed books</td></tr>";
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    $stmt = $conn->prepare("
        SELECT *, 
        DATE_FORMAT(borrow_time, '%Y-%m-%d') as borrow_date, 
        DATE_FORMAT(due_date, '%Y-%m-%d') as return_date,
        DATEDIFF(due_date, CURDATE()) as remaining_days
        FROM borrowed_books 
        WHERE user_id = ? 
        ORDER BY borrow_time DESC
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo "<tr><td colspan='7' class='placeholder'>You haven't borrowed any books yet</td></tr>";
    } else {
        while ($row = $result->fetch_assoc()) {
            $actionButton = '';
            
            // Determine status and styling
            $status = $row['status'];
            $statusClass = 'status-' . strtolower($status);
            
            // If book is approved but overdue, change status to Overdue
            if ($status === 'Approved' && $row['remaining_days'] < 0) {
                $status = 'Overdue';
                $statusClass = 'status-overdue';
            }
            
            // Format remaining days and add overdue styling
            $remaining_days = $row['remaining_days'];
            $remaining_days_class = '';
            if ($row['status'] === 'Approved') {
                if ($remaining_days < 0) {
                    $remaining_days = abs($remaining_days) . ' days overdue';
                    $remaining_days_class = 'status-overdue';
                } else {
                    $remaining_days = $remaining_days . ' days left';
                }
            } else {
                $remaining_days = 'N/A';
            }
            
            // Format fine amount
            $fine = 'N/A';
            if ($row['status'] === 'Approved' && $row['remaining_days'] < 0) {
                $fine = '₱' . number_format($row['fine_amount'], 2);
            }
            
            // Debug output
            error_log("Processing book: " . $row['title'] . " with status: " . $status);
            
            switch ($status) {
                case 'Approved':
                case 'Overdue':
                    $actionButton = "<button type='button' class='action-btn return-btn' data-book-id='{$row['id']}'>
                        <i class='fas fa-undo'></i> Return Book
                    </button>";
                    break;
                case 'Rejected':
                    $actionButton = "<button type='button' class='action-btn view-feedback-btn' data-book-id='{$row['id']}'>
                        <i class='fas fa-comment'></i> View Feedback
                    </button>";
                    break;
                case 'Pending':
                    $actionButton = "<button type='button' class='action-btn cancel-btn' data-book-id='{$row['id']}'>
                        <i class='fas fa-times'></i> Cancel Request
                    </button>";
                    break;
                case 'Returned':
                    $actionButton = "<span class='status-text status-returned'><i class='fas fa-check'></i> Returned</span>";
                    break;
                case 'Cancelled':
                    $actionButton = "<span class='status-text status-cancelled'><i class='fas fa-ban'></i> Cancelled</span>";
                    break;
                default:
                    $actionButton = '';
            }

            // Debug output
            error_log("Generated button HTML: " . $actionButton);

    echo "<tr>
                    <td>{$row['title']}</td>
                    <td>{$row['borrow_date']}</td>
                    <td>{$row['return_date']}</td>
                    <td class='{$remaining_days_class}'>{$remaining_days}</td>
                    <td>{$fine}</td>
                    <td><span class='status-text {$statusClass}'><i class='fas fa-circle'></i> {$status}</span></td>
                    <td>{$actionButton}</td>
          </tr>";
  }
    }
} catch (Exception $e) {
    error_log("Error in get_borrowed_books.php: " . $e->getMessage());
    echo "<tr><td colspan='7' class='placeholder'>Error loading borrowed books</td></tr>";
}

$stmt->close();
$conn->close();
?>
