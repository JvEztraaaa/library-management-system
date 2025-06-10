<?php
session_start();

// Destroy the session
session_destroy();

// Return a JSON response indicating success
header('Content-Type: application/json');
echo json_encode(['status' => 'success', 'message' => 'Logged out successfully']);
?> 