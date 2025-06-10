// Function to show popup
function showPopup(message, type = 'success') {
    const popup = document.getElementById('custom-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupOk = document.getElementById('popup-ok');
    const popupCancel = document.getElementById('popup-cancel');
    
    if (!popup || !popupTitle || !popupMessage || !popupOk || !popupCancel) {
        console.error('Popup elements not found');
        showToast('Error: Popup elements not found', 'error');
        return;
    }
    
    // Set popup content
    popupTitle.textContent = type === 'success' ? 'Success' : 'Error';
    popupMessage.textContent = message;
    
    // Show popup
    popup.style.display = 'flex';
    
    // Hide cancel button for simple messages
    popupCancel.style.display = 'none';
    
    // Add event listener for OK button
    popupOk.onclick = () => {
        popup.style.display = 'none';
    };
    
    // Add event listener for close button
    const closeBtn = document.querySelector('.close-popup');
    if (closeBtn) {
        closeBtn.onclick = () => {
            popup.style.display = 'none';
        };
    }
    
    // Close popup when clicking outside
    popup.onclick = (e) => {
        if (e.target === popup) {
            popup.style.display = 'none';
        }
    };
}

// Function to update favorites
function updateFavorites(bookId, action) {
    const formData = new FormData();
    formData.append('book_id', bookId);
    formData.append('action', action);

    fetch('../backend/update_favorites.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update the heart icon
            const heartIcon = document.querySelector(`.heart-icon[data-book-id="${bookId}"]`);
            if (heartIcon) {
                if (action === 'add') {
                    heartIcon.classList.remove('far');
                    heartIcon.classList.add('fas');
                    showToast('Book added to favorites!', 'success');
                } else {
                    heartIcon.classList.remove('fas');
                    heartIcon.classList.add('far');
                    showToast('Book removed from favorites!', 'success');
                }
            }
        } else {
            showToast(data.message || 'Error updating favorites', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error updating favorites', 'error');
    });
}

// Function to handle heart icon click
function handleHeartClick(event) {
    const heartIcon = event.currentTarget;
    const bookId = heartIcon.dataset.bookId;
    const isFavorite = heartIcon.classList.contains('fas');

    if (isFavorite) {
        // Show confirmation popup before removing
        showPopup('Are you sure you want to remove this book from favorites?', 'confirm');
        const popupOk = document.getElementById('popup-ok');
        const popupCancel = document.getElementById('popup-cancel');
        
        popupCancel.style.display = 'inline-block';
        popupCancel.onclick = () => {
            document.getElementById('custom-popup').style.display = 'none';
        };
        
        popupOk.onclick = () => {
            document.getElementById('custom-popup').style.display = 'none';
            updateFavorites(bookId, 'remove');
        };
    } else {
        updateFavorites(bookId, 'add');
    }
}

// Initialize heart icons
document.addEventListener('DOMContentLoaded', function() {
    const heartIcons = document.querySelectorAll('.heart-icon');
    heartIcons.forEach(icon => {
        icon.addEventListener('click', handleHeartClick);
    });
});

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

// Initialize all event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Handle favorite button clicks on homepage.html
  if (window.location.pathname.endsWith('homepage.html')) {
    console.log('favorites_script.js: Initializing favorite buttons for homepage.html');
    document.querySelectorAll('.btn-favorites').forEach(async button => {
      console.log('favorites_script.js: Found favorite button on homepage:', button);
      const bookCard = button.closest('.book-card');
      const bookContainer = button.closest('.book-container');
      const title = bookCard.querySelector('.title').textContent;
      
      try {
        const isFavorite = await checkIfInFavorites(title);
        console.log(`favorites_script.js: Book "${title}" is favorite:`, isFavorite);
        updateButtonState(button, isFavorite);
      } catch (error) {
        console.error('favorites_script.js: Error checking favorites status on homepage:', error);
      }

      button.addEventListener('click', (event) => {
        event.stopPropagation();
        event.preventDefault();
        console.log('favorites_script.js: Favorite button clicked (homepage.html)');
        
        const bookData = {
          image: bookCard.querySelector('.background-image-container').style.backgroundImage,
          cover: bookContainer.querySelector('img.book').src,
          title: bookCard.querySelector('.title').textContent,
          description: bookCard.querySelector('.info-left').textContent,
          author: bookCard.querySelector('.info-right p:nth-child(1)').textContent,
          genres: bookCard.querySelector('.info-right p:nth-child(2)').textContent,
        };

        const operation = button.classList.contains('in-favorites') ? 'remove' : 'add';
        console.log('favorites_script.js: Operation:', operation);

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
          console.log('Server response:', data);
          if (data.success) {
            updateButtonState(button, operation === 'add');
            showToast(operation === 'add' ? 'Book added to favorites!' : 'Book removed from favorites!', 'success');
          } else {
            showToast(data.message, 'error');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          showToast('Error updating favorites', 'error');
        });
      });
    });
  }

  // Handle favorite button clicks and page rendering on favorites.html
  if (window.location.pathname.endsWith('favorites.html')) {
    document.querySelectorAll('.btn-favorites').forEach(button => {
      button.addEventListener('click', () => {
        console.log('Favorite button clicked (favorites.html)'); // Debug log
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
            showToast(operation === 'add' ? 'Book added to favorites!' : 'Book removed from favorites!', 'success');
          } else {
            showToast(data.message, 'error');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          showToast('Error updating favorites', 'error');
        });
      });
    });

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

  // ====================== Favorites Page Renderer ======================
  if (window.location.pathname.endsWith('favorites.html')) {
    const favoritesContainer = document.querySelector('.books-slides');
    const noFavoritesMessageHTML = `
      <div class="no-favorites-message">
        <p>Your favorites list is currently empty. Add your favorite book now!</p>
        <button class="add-books-btn" onclick="window.location.href='homepage.html'">Add Books</button>
      </div>
    `;

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
        if (data.favorites && data.favorites.length > 0) {
          favoritesContainer.classList.add('has-favorites'); // Add class when books are present
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
              </div>
            `;

            favoritesContainer.appendChild(bookContainer);

            // Add click handler for the heart icon
            const heartButton = bookContainer.querySelector('.image-fav');
            heartButton.addEventListener('click', () => {
              const bookTitle = bookContainer.querySelector('.book-title').textContent;
              const operation = 'remove';
              const formData = new FormData();
              formData.append('operation', operation);
              formData.append('title', bookTitle);

              fetch('../backend/favorites.php', {
                method: 'POST',
                body: formData
              })
              .then(response => response.json())
              .then(data => {
                console.log('Remove favorite response:', data);
                if (data.success) {
                  bookContainer.remove(); // Remove the book card from the DOM
                  showToast('Book removed from favorites!', 'success');
                  
                  // If no more favorites, show empty state and remove has-favorites class
                  if (favoritesContainer.children.length === 0) {
                    favoritesContainer.classList.remove('has-favorites');
                    favoritesContainer.innerHTML = noFavoritesMessageHTML;
                  }
                } else {
                  showToast(data.message, 'error');
                }
              })
              .catch(error => {
                console.error('Error removing favorite:', error);
                showToast('Error removing favorite', 'error');
              });
            });
          });
        } else {
          // Display message and button if favorites list is empty
          favoritesContainer.classList.remove('has-favorites'); // Ensure class is not present
          favoritesContainer.innerHTML = noFavoritesMessageHTML;
        }
      } else {
        favoritesContainer.classList.remove('has-favorites'); // Ensure class is not present on error
        favoritesContainer.innerHTML = `<p class="error">Error loading favorites: ${data.message}</p>`;
      }
    })
    .catch(error => {
      console.error('Error fetching favorites:', error);
      favoritesContainer.classList.remove('has-favorites'); // Ensure class is not present on error
      favoritesContainer.innerHTML = '<p class="error">Failed to load favorites. Please try again later.</p>';
    });
  }
});
