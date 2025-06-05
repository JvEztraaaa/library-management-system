window.addEventListener("DOMContentLoaded", () => {
  fetch("../backend/get_borrowed_books.php")
    .then(res => res.text())
    .then(html => {
      document.getElementById("borrowed-books-body").innerHTML = html;
    })
    .catch(err => {
      console.error("Error loading borrowed books:", err);
      document.getElementById("borrowed-books-body").innerHTML =
        "<tr><td colspan='4' class='placeholder'>Error loading data</td></tr>";
    });
});
