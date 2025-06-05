// Code for Banner Carousel
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
    "images/bg_cover3.JPG"
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

 //============================= Code for Favorite Button =================================//
 // Favorite button code to save to favorites (can be clicked multiple books)
 document.querySelectorAll('.btn-favorites').forEach(button => {
  button.addEventListener('click', () => {
    const bookCard = button.closest('.book-card');
    const bookData = {
      image: bookCard.querySelector('.background-image-container').style.backgroundImage,
      title: bookCard.querySelector('.title').textContent,
      description: bookCard.querySelector('.info-left').textContent,
      author: bookCard.querySelector('.info-right p:nth-child(1)').textContent,
      genres: bookCard.querySelector('.info-right p:nth-child(2)').textContent,
    };

    // Get current favorites list from localStorage or empty array
    let favorites = JSON.parse(localStorage.getItem('favoriteBooks')) || [];

    // Check if book is already in favorites
    const exists = favorites.some(book => book.title === bookData.title);

    //Show feedback to user if added to favorites or already exists in favorites
    if(exists){
      alert(`${bookData.title} already in your favorites!`);
    }
    else{
      favorites.push(bookData);
      localStorage.setItem('favoriteBooks', JSON.stringify(favorites));
      alert(`${bookData.title} added to favorites!`);
    }

  });
});

// On favorites.html page — render favorite books
if (window.location.pathname.endsWith('favorites.html')) {
  const favoritesContainer = document.querySelector('.books-slides');
  const favorites = JSON.parse(localStorage.getItem('favoriteBooks')) || [];

  favorites.forEach(book => {
    const bookCard = document.createElement('div');
    bookCard.classList.add('book-card');
    bookCard.innerHTML = `
      <div class="background-image-container" style="background-image: ${book.image};">
        <div class="gradient"></div>
        <div class="controls">
          <div class="title">${book.title}</div>
          <button class="btn-favorites" title="Remove from favorites">
            <i class="fa-solid fa-heart"></i>
          </button>
          <button class="btn-book" title="Borrow this book">Borrow</button>
        </div>
      </div>
      <div class="infos">
        <div class="info-left">${book.description}</div>
        <div class="info-right">
          <p><span>Author:</span> ${book.author}</p>
          <p><span>Genres:</span> ${book.genres}</p>
        </div>
      </div>
    `;

    favoritesContainer.appendChild(bookCard);

    // Unfavorite button listener
    bookCard.querySelector('.btn-favorites').addEventListener('click', () => {
      let favorites = JSON.parse(localStorage.getItem('favoriteBooks')) || [];
      favorites = favorites.filter(fav => fav.title !== book.title);
      localStorage.setItem('favoriteBooks', JSON.stringify(favorites));
      bookCard.remove();
    });

    // Borrow button listener
    bookCard.querySelector('.btn-book').addEventListener('click', () => {
      localStorage.setItem('borrowedBook', JSON.stringify(book));
      window.location.href = 'borrow.html';
    });
  });

}
