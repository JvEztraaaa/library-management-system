<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo "unauthorized";
    exit;
}

$host = "localhost";
$user = "root";
$pass = "";
$db = "library";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$title = $_POST['title'];
$author = $_POST['author'];
$genre = $_POST['genre'];
$user_id = $_SESSION['user_id'];

// ✅ Check if book is already borrowed (based on title)
$check = $conn->prepare("SELECT id FROM borrowed_books WHERE title = ?");
$check->bind_param("s", $title);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo "already_borrowed";
    $check->close();
    $conn->close();
    exit;
}
$check->close();

// ✅ Insert book since it's not borrowed yet
$sql = "INSERT INTO borrowed_books (title, author, genre, user_id) VALUES (?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sssi", $title, $author, $genre, $user_id);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo "success";
} else {
    echo "error";
}

$stmt->close();
$conn->close();
?>
