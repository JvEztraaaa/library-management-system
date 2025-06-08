// Function to show custom popup message
function showPopup(message, type = 'info') {
  // Remove any existing popups
  const existingPopup = document.querySelector('.custom-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create new popup
  const popup = document.createElement('div');
  popup.className = `custom-popup ${type}`;
  popup.textContent = message;
  document.body.appendChild(popup);

  // Show popup
  setTimeout(() => popup.classList.add('show'), 100);

  // Remove popup after 3 seconds
  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => popup.remove(), 300);
  }, 3000);
}

// Function to check if a book is in favorites
function checkIfInFavorites(title) {
  const formData = new FormData();
  formData.append('operation', 'check');
  formData.append('title', title);

  return fetch('../backend/favorites.php', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    console.log('Check favorites response:', data); // Debug log
    return data.isFavorite;
  })
  .catch(error => {
    console.error('Error checking favorites:', error);
    return false;
  });
}

// Function to update button state
function updateButtonState(button, isFavorite) {
  if (isFavorite) {
    button.classList.add('in-favorites');
    button.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    button.style.borderColor = '#ff4444';
    button.style.color = '#ff4444';
    button.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.3)';
  } else {
    button.classList.remove('in-favorites');
    button.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    button.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    button.style.color = 'white';
    button.style.boxShadow = 'none';
  }
}

// Update favorite buttons on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the homepage
  if (window.location.pathname.endsWith('homepage.html')) {
    document.querySelectorAll('.btn-favorites').forEach(async button => {
      const bookCard = button.closest('.book-card');
      const title = bookCard.querySelector('.title').textContent;
      
      try {
        const isFavorite = await checkIfInFavorites(title);
        console.log(`Book "${title}" is favorite:`, isFavorite); // Debug log
        updateButtonState(button, isFavorite);
      } catch (error) {
        console.error('Error checking favorites status:', error);
      }
    });
  }

  // Banner Carousel for favorites.html
  if (window.location.pathname.endsWith('favorites.html')) {
    const slidesContainer = document.querySelector(".banner-slides");
    const slides = document.querySelectorAll(".banner-slide");
    const nextBtn = document.querySelector(".banner-next");
    const prevBtn = document.querySelector(".banner-prev");

    let currentSlide = 0;
    const totalSlides = slides.length;
    const slideDuration = 10000;

    if (slidesContainer && slides.length > 0) {
        slidesContainer.style.width = `${totalSlides * 100}%`;

        const imagePaths = [
            "images/bg_cover.png",
            "images/bg_cover2.JPG",
            "images/bg_cover3.JPG",
            "images/bg_cover4.JPG",
            "images/bg_cover5.JPG",
            "images/bg_cover6.JPG"
        ];

        slides.forEach((slide, index) => {
            slide.style.backgroundImage = `url('${imagePaths[index % imagePaths.length]}')`;
        });

        function showSlide(index) {
            if (index >= totalSlides) currentSlide = 0;
            else if (index < 0) currentSlide = totalSlides - 1;
            else currentSlide = index;

            slidesContainer.style.transform = `translateX(-${currentSlide * (100 / totalSlides)}%)`;
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
    }
  }
});

// ====================== Favorite Button ======================
document.querySelectorAll('.btn-favorites').forEach(button => {
  button.addEventListener('click', () => {
    console.log('Favorite button clicked'); // Debug log
    const bookCard = button.closest('.book-card');
    const bookContainer = button.closest('.book-container');
    const bookData = {
      image: bookCard.querySelector('.background-image-container').style.backgroundImage,
      cover: bookContainer.querySelector('img.book').src,
      title: bookCard.querySelector('.title').textContent,
      description: bookCard.querySelector('.info-left').textContent,
      author: bookCard.querySelector('.info-right p:nth-child(1)').textContent,
      genres: bookCard.querySelector('.info-right p:nth-child(2)').textContent,
    };

    // Determine operation based on current state
    const operation = button.classList.contains('in-favorites') ? 'remove' : 'add';
    console.log('Operation:', operation); // Debug log

    // Send to backend
    const formData = new FormData();
    formData.append('operation', operation);
    formData.append('title', bookData.title);
    formData.append('author', bookData.author);
    formData.append('genre', bookData.genres);
    formData.append('cover', bookData.cover);
    formData.append('image', bookData.image);

    fetch('../backend/favorites.php', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      console.log('Server response:', data); // Debug log
      if (data.success) {
        // Toggle button state
        updateButtonState(button, operation === 'add');
        alert(operation === 'add' ? 'Book added to favorites!' : 'Book removed from favorites!');
    } else {
        alert(data.message);
    }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error updating favorites');
    });
  });
});

// ====================== Favorites Page Renderer ======================
if (window.location.pathname.endsWith('favorites.html')) {
  const favoritesContainer = document.querySelector('.books-slides');

  // Fetch favorites from backend
  fetch('../backend/favorites.php', {
    method: 'POST',
    body: new URLSearchParams({
      'operation': 'get'
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      data.favorites.forEach(book => {
    const bookContainer = document.createElement('div');
    bookContainer.classList.add("book-container");

   bookContainer.innerHTML = `
  <div class="book-image-wrapper">
    <img src="${book.cover}" alt="${book.title}" class="book" />
            <button class="image-fav" title="Remove from favorites">
              <i class="fas fa-heart"></i>
            </button>
          </div>
          <div class="book-info">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">${book.author}</p>
            <span class="book-genre">${book.genre}</span>
            <div class="book-actions">
              <button class="action-btn borrow-btn" onclick="window.location.href='borrow.html'">
                <i class="fas fa-book"></i> Borrow
              </button>
              <button class="action-btn remove-btn">
                <i class="fas fa-trash"></i> Remove
              </button>
            </div>
  </div> 
`;

    favoritesContainer.appendChild(bookContainer);

    // Remove from favorites
        const removeBtn = bookContainer.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
          const formData = new FormData();
          formData.append('operation', 'remove');
          formData.append('title', book.title);

          fetch('../backend/favorites.php', {
            method: 'POST',
            body: formData
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
      bookContainer.remove();
              showPopup('Book removed from favorites!', 'success');
              
              // Only try to update homepage buttons if we're on the homepage
              if (window.location.pathname.endsWith('homepage.html')) {
                const homepageButtons = document.querySelectorAll('.btn-favorites');
                homepageButtons.forEach(button => {
                  const bookCard = button.closest('.book-card');
                  if (bookCard) {
                    const buttonTitle = bookCard.querySelector('.title').textContent;
                    if (buttonTitle === book.title) {
                      updateButtonState(button, false);
                    }
                  }
                });
              }
            } else {
              showPopup(data.message, 'error');
            }
          })
          .catch(error => {
            console.error('Error:', error);
            showPopup('Error removing from favorites', 'error');
          });
        });

        // Add click event to book image
        const bookImage = bookContainer.querySelector('.book');
        bookImage.addEventListener('click', () => {
          // Add your book details view logic here
          console.log('View book details:', book.title);
        });
      });
    } else {
      favoritesContainer.innerHTML = '<div class="no-favorites">No favorites yet</div>';
    }
  })
  .catch(error => {
    console.error('Error:', error);
    favoritesContainer.innerHTML = '<div class="error">Error loading favorites</div>';
  });
}
