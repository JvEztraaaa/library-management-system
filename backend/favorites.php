<?php
// Prevent PHP errors from being displayed
error_reporting(0);
ini_set('display_errors', 0);

// Start output buffering
ob_start();

try {
    session_start();
    
    // Set JSON header
    header('Content-Type: application/json');

    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Please log in first');
    }

    // Add user_id to POST data
    $_POST['user_id'] = $_SESSION['user_id'];

    // Forward the request to get_favorites.php
    require_once 'get_favorites.php';

} catch (Exception $e) {
    // Clear any previous output
    ob_clean();
    
    // Send error response
    http_response_code(200); // Set to 200 to ensure JSON is processed
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

// End output buffering and flush
ob_end_flush();
?> 