<?php
$conn = new mysqli("localhost", "root", "", "library");
if ($conn->connect_error) {
  die("Database connection failed");
}

session_start();
$user_id = $_SESSION['user_id'];
$sql = "SELECT bb.title, bb.author, bb.genre, bb.status
        FROM borrowed_books bb
        WHERE bb.user_id = $user_id
        ORDER BY bb.borrow_time DESC";

$result = $conn->query($sql);

if ($result->num_rows > 0) {
  while($row = $result->fetch_assoc()) {
    echo "<tr>
            <td>" . htmlspecialchars($row['title']) . "</td>
            <td>" . htmlspecialchars($row['author']) . "</td>
            <td>" . htmlspecialchars($row['genre']) . "</td>
            <td>" . htmlspecialchars($row['status']) . "</td>
          </tr>";
  }
} else {
  echo "<tr><td colspan='4' class='placeholder'>No borrowed books yet</td></tr>";
}

$conn->close();
?>
