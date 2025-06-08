<?php
// Start session management if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Basic CORS headers for local development (remove in production)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'library';

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed']));
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    die(json_encode(['status' => 'error', 'message' => 'User not logged in']));
}

$user_id = $_SESSION['user_id'];

// Handle GET request for user data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['action']) && $_GET['action'] === 'get_user_data') {
        $stmt = $conn->prepare("SELECT id, first_name, last_name, email, avatar_url FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            $user = [
                'id' => $row['id'],
                'full_name' => $row['first_name'] . ' ' . $row['last_name'],
                'email' => $row['email'],
                'avatar' => $row['avatar_url'] ?? '../homepage/images/default_avatar.jpg'
            ];
            echo json_encode(['status' => 'success', 'user' => $user]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'User not found']);
        }
        exit();
    } else if (isset($_GET['action']) && $_GET['action'] === 'logout') {
        session_unset();
        session_destroy();
        echo json_encode(['status' => 'success', 'message' => 'Logged out successfully', 'redirect' => '../index.php']);
        exit();
    }
}

// Handle POST request for profile updates
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $response = ['status' => 'error', 'message' => 'Invalid request'];
    
    // Handle file upload
    if (isset($_FILES['avatar-upload'])) {
        $file = $_FILES['avatar-upload'];
        $allowed = ['jpg', 'jpeg', 'png'];
        $filename = $file['name'];
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        
        if (in_array($ext, $allowed)) {
            $new_filename = 'avatar_' . $user_id . '_' . time() . '.' . $ext;
            $upload_path = '../homepage/images/' . $new_filename;
            
            if (move_uploaded_file($file['tmp_name'], $upload_path)) {
                $avatar_url = '../homepage/images/' . $new_filename;
                $stmt = $conn->prepare("UPDATE users SET avatar_url = ? WHERE id = ?");
                $stmt->bind_param("si", $avatar_url, $user_id);
                
                if ($stmt->execute()) {
                    $_SESSION['avatar_url'] = $avatar_url;
                    $response = [
                        'status' => 'success',
                        'message' => 'Avatar updated successfully',
                        'user' => ['avatar' => $avatar_url]
                    ];
                }
            }
        }
    } else {
        // Handle other profile updates
        $updates = [];
        $types = "";
        $params = [];
        
        if (isset($_POST['full_name'])) {
            $names = explode(' ', $_POST['full_name'], 2);
            $first_name = $names[0];
            $last_name = isset($names[1]) ? $names[1] : '';
            $updates[] = "first_name = ?, last_name = ?";
            $types .= "ss";
            $params[] = $first_name;
            $params[] = $last_name;
        }
        
        if (isset($_POST['email'])) {
            $updates[] = "email = ?";
            $types .= "s";
            $params[] = $_POST['email'];
        }
        
        if (isset($_POST['password']) && !empty($_POST['password'])) {
            $hashed_password = password_hash($_POST['password'], PASSWORD_DEFAULT);
            $updates[] = "password_hash = ?";
            $types .= "s";
            $params[] = $hashed_password;
        }
        
        if (!empty($updates)) {
            $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
            $types .= "i";
            $params[] = $user_id;
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            
            if ($stmt->execute()) {
                $response = ['status' => 'success', 'message' => 'Profile updated successfully'];
            }
        }
    }
    
    echo json_encode($response);
}

$conn->close();
?> 