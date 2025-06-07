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
    bookContainer.style.padding = "20px";

   bookContainer.innerHTML = `
  <div class="book-image-wrapper">
    <img src="${book.cover}" alt="${book.title}" class="book" />
    <button class="btn-favorites image-fav" title="Remove from favorites">❤️</button>
  </div> 
`;

    favoritesContainer.appendChild(bookContainer);

    // Remove from favorites
    bookContainer.querySelector('.btn-favorites').addEventListener('click', () => {
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
              alert('Book removed from favorites!');
              
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
              alert(data.message);
            }
          })
          .catch(error => {
            console.error('Error:', error);
            alert('Error removing from favorites');
          });
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
