document.addEventListener("DOMContentLoaded", function () {
  const slidesContainer = document.querySelector(".banner-slides");
  const slides = document.querySelectorAll(".banner-slide");
  const nextBtn = document.querySelector(".banner-next");
  const prevBtn = document.querySelector(".banner-prev");

  let currentSlide = 0;
  const totalSlides = slides.length;
  const slideDuration = 10000;

  slidesContainer.style.width = `${totalSlides * 100}%`;

  const imagePaths = [
    "images/bg_cover.png",
    "images/bg_cover2.JPG",
    "images/bg_cover3.JPG",
  ];

  slides.forEach((slide, index) => {
    slide.style.backgroundImage = `url('${
      imagePaths[index % imagePaths.length]
    }')`;
  });

  function showSlide(index) {
    if (index >= totalSlides) currentSlide = 0;
    else if (index < 0) currentSlide = totalSlides - 1;
    else currentSlide = index;

    slidesContainer.style.transform = `translateX(-${
      currentSlide * (100 / totalSlides)
    }%)`;
  }

  nextBtn.addEventListener("click", () => {
    showSlide(currentSlide + 1);
  });

  prevBtn.addEventListener("click", () => {
    showSlide(currentSlide - 1);
  });

  setInterval(() => {
    showSlide(currentSlide + 1);
  }, slideDuration);

  showSlide(currentSlide);
});
document.addEventListener("DOMContentLoaded", function () {
  const slidesContainer = document.querySelector(".banner-slides");
  const slides = document.querySelectorAll(".banner-slide");
  const nextBtn = document.querySelector(".banner-next");
  const prevBtn = document.querySelector(".banner-prev");

  let currentSlide = 0;
  const totalSlides = slides.length;
  const slideDuration = 10000;

  slidesContainer.style.width = `${totalSlides * 100}%`;

  const imagePaths = [
    "images/bg_cover.png",
    "images/bg_cover2.JPG",
    "images/bg_cover3.JPG",
  ];

  slides.forEach((slide, index) => {
    slide.style.backgroundImage = `url('${
      imagePaths[index % imagePaths.length]
    }')`;
  });

  function showSlide(index) {
    if (index >= totalSlides) currentSlide = 0;
    else if (index < 0) currentSlide = totalSlides - 1;
    else currentSlide = index;

    slidesContainer.style.transform = `translateX(-${
      currentSlide * (100 / totalSlides)
    }%)`;
  }

  nextBtn.addEventListener("click", () => {
    showSlide(currentSlide + 1);
  });

  prevBtn.addEventListener("click", () => {
    showSlide(currentSlide - 1);
  });

  setInterval(() => {
    showSlide(currentSlide + 1);
  }, slideDuration);

  showSlide(currentSlide);
});

function borrowBook(button) {
  const title = button.dataset.title;
  const author = button.dataset.author;
  const genre = button.dataset.genre;

  fetch("../backend/borrow_book.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&genre=${encodeURIComponent(genre)}`
  })
  .then(response => response.text())
  .then(result => {
    result = result.trim();
    if (result === "success") {
      alert(`You borrowed "${title}"!`);
    } else if (result === "already_borrowed") {
      alert(`"${title}" is already being borrowed.`);
    } else if (result === "unauthorized") {
      alert("Please log in to borrow books.");
    } else {
      alert("Error borrowing book.");
    }
  });
}
