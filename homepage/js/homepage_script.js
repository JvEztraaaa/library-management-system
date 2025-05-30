document.addEventListener("DOMContentLoaded", function () {
  const slidesContainer = document.querySelector(".banner-slides");
  const slides = document.querySelectorAll(".banner-slide");
  const nextBtn = document.querySelector(".banner-next");
  const prevBtn = document.querySelector(".banner-prev");

  let currentSlide = 0;
  const totalSlides = slides.length;
  const slideDuration = 6000;

  slides.forEach((slide, index) => {
    slide.style.backgroundImage = `url("images/bg_cover.png")`;
  });

  function showSlide(index) {
    if (index >= totalSlides) currentSlide = 0;
    else if (index < 0) currentSlide = totalSlides - 1;
    else currentSlide = index;

    slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
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
