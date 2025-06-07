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

// Handle different operations
$operation = $_POST['operation'] ?? '';

switch ($operation) {
    case 'check':
        // Check if book is in favorites
        $user_id = $_POST['user_id'] ?? '';
        $book_title = $_POST['title'] ?? '';

        if (empty($user_id) || empty($book_title)) {
            echo json_encode([
                'success' => false, 
                'message' => 'Missing required fields',
                'debug' => ['user_id' => $user_id, 'title' => $book_title]
            ]);
            exit;
        }

        try {
            $stmt = $conn->prepare("SELECT COUNT(*) as count FROM favorites WHERE user_id = ? AND book_title = ?");
            if (!$stmt) {
                throw new Exception("Database prepare error: " . $conn->error);
            }
            
            $stmt->bind_param("is", $user_id, $book_title);
            if (!$stmt->execute()) {
                throw new Exception("Database execute error: " . $stmt->error);
            }
            
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            
            echo json_encode([
                'success' => true,
                'isFavorite' => $row['count'] > 0,
                'debug' => [
                    'count' => $row['count'],
                    'user_id' => $user_id,
                    'title' => $book_title
                ]
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false, 
                'message' => $e->getMessage(),
                'debug' => ['user_id' => $user_id, 'title' => $book_title]
            ]);
        }
        break;

    case 'add':
        // Add book to favorites
        $user_id = $_POST['user_id'] ?? '';
        $book_title = $_POST['title'] ?? '';
        $book_author = $_POST['author'] ?? '';
        $book_genre = $_POST['genre'] ?? '';
        $book_cover = $_POST['cover'] ?? '';
        $book_image = $_POST['image'] ?? '';

        if (empty($user_id) || empty($book_title) || empty($book_author)) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            exit;
        }

        try {
            $stmt = $conn->prepare("INSERT INTO favorites (user_id, book_title, book_author, book_genre, book_cover, book_image) 
                                  VALUES (?, ?, ?, ?, ?, ?)");
            if (!$stmt) {
                throw new Exception("Database prepare error: " . $conn->error);
            }
            
            $stmt->bind_param("isssss", $user_id, $book_title, $book_author, $book_genre, $book_cover, $book_image);
            if (!$stmt->execute()) {
                if ($stmt->errno == 1062) { // Duplicate entry error
                    throw new Exception('Book already in favorites');
                }
                throw new Exception("Database execute error: " . $stmt->error);
            }
            
            echo json_encode(['success' => true, 'message' => 'Book added to favorites']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'remove':
        // Remove book from favorites
        $user_id = $_POST['user_id'] ?? '';
        $book_title = $_POST['title'] ?? '';

        if (empty($user_id) || empty($book_title)) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            exit;
        }

        try {
            $stmt = $conn->prepare("DELETE FROM favorites WHERE user_id = ? AND book_title = ?");
            if (!$stmt) {
                throw new Exception("Database prepare error: " . $conn->error);
            }
            
            $stmt->bind_param("is", $user_id, $book_title);
            if (!$stmt->execute()) {
                throw new Exception("Database execute error: " . $stmt->error);
            }

            if ($stmt->affected_rows > 0) {
                echo json_encode(['success' => true, 'message' => 'Book removed from favorites']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Book not found in favorites']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'get':
        // Get user's favorites
        $user_id = $_POST['user_id'] ?? '';

        if (empty($user_id)) {
            echo json_encode(['success' => false, 'message' => 'Missing user ID']);
            exit;
        }

        try {
            $stmt = $conn->prepare("SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC");
            if (!$stmt) {
                throw new Exception("Database prepare error: " . $conn->error);
            }
            
            $stmt->bind_param("i", $user_id);
            if (!$stmt->execute()) {
                throw new Exception("Database execute error: " . $stmt->error);
            }
            
            $result = $stmt->get_result();
            
            $favorites = [];
            while ($row = $result->fetch_assoc()) {
                $favorites[] = [
                    'title' => $row['book_title'],
                    'author' => $row['book_author'],
                    'genre' => $row['book_genre'],
                    'cover' => $row['book_cover'],
                    'image' => $row['book_image']
                ];
            }
            
            echo json_encode(['success' => true, 'favorites' => $favorites]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Invalid operation']);
        break;
}

$conn->close();
?> 