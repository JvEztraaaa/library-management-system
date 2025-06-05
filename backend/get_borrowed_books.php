<?php
$conn = new mysqli("localhost", "root", "", "library");
if ($conn->connect_error) {
  die("Database connection failed");
}

$sql = "SELECT bb.title, bb.author, bb.genre, bb.status, u.first_name, u.last_name
        FROM borrowed_books bb
        LEFT JOIN users u ON bb.user_id = u.id
        ORDER BY bb.borrow_time DESC";

$result = $conn->query($sql);

if ($result->num_rows > 0) {
  while($row = $result->fetch_assoc()) {
    $userName = htmlspecialchars($row['first_name'] . " " . $row['last_name']);
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
