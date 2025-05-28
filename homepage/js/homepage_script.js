document.querySelectorAll(".book-container").forEach((container) => {
  container.addEventListener("mouseenter", () => {
    const card = container.querySelector(".book-card");
    const rect = container.getBoundingClientRect();
    const cardWidth = card.offsetWidth;

    // Check if card would overflow on the right
    if (rect.right + cardWidth + 20 > window.innerWidth) {
      card.classList.add("left");
    } else {
      card.classList.remove("left");
    }
  });
});
