document.addEventListener("DOMContentLoaded", function () {
  const slidesContainer = document.querySelector(".banner-slides");
  const slides = document.querySelectorAll(".banner-slide");
  const nextBtn = document.querySelector(".banner-next");
  const prevBtn = document.querySelector(".banner-prev");

  let currentSlide = 0;
  const totalSlides = slides.length;
  const slideDuration = 20000;

  slidesContainer.style.width = `${totalSlides * 100}%`;

  const imagePaths = [
    "images/bg_cover.png",
    "images/bg_cover1.JPG",
    "images/bg_cover2.JPG",
    "images/bg_cover3.JPG",
    "images/bg_cover4.JPG",
    "images/bg_cover5.JPG",
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
