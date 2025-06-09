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

  // Initialize search functionality
  const searchBar = document.querySelector(".search-bar");
  const searchSuggestions = document.querySelector(".search-suggestions");
  const allBookSections = document.querySelectorAll(".books-section");
  const allBooksSlides = document.querySelectorAll(".books-slides"); // Get all books-slides containers

  searchBar.addEventListener("input", function(e) {
    const searchTerm = e.target.value.toLowerCase();
    let allBookTitles = [];

    // Clear previous suggestions
    searchSuggestions.innerHTML = '';

    // Populate allBookTitles with unique book titles from the page
    document.querySelectorAll(".book-container .title").forEach(titleElement => {
      const title = titleElement.textContent.toLowerCase();
      if (!allBookTitles.includes(title)) {
        allBookTitles.push(title);
      }
    });

    if (searchTerm.length > 0) {
      document.body.classList.add('search-active');
      const filteredSuggestions = allBookTitles.filter(title => title.includes(searchTerm));

      if (filteredSuggestions.length > 0) {
        filteredSuggestions.forEach(suggestion => {
          const suggestionItem = document.createElement('div');
          suggestionItem.classList.add('suggestion-item');
          suggestionItem.textContent = suggestion;
          suggestionItem.addEventListener('click', () => {
            searchBar.value = suggestion;
            searchBar.dispatchEvent(new Event('input')); // Trigger search with selected suggestion
            searchSuggestions.innerHTML = ''; // Clear suggestions after selection
          });
          searchSuggestions.appendChild(suggestionItem);
        });
        searchSuggestions.style.display = 'block'; // Show suggestions
        // Add/remove search-active-grid class based on search term presence
        allBooksSlides.forEach(slidesContainer => {
          if (searchTerm.length > 0) {
            slidesContainer.classList.add('search-active-grid');
          } else {
            slidesContainer.classList.remove('search-active-grid');
          }
        });
      } else {
        document.body.classList.remove('search-active');
        searchSuggestions.style.display = 'none'; // Hide if no suggestions
        // Remove search-active-grid class when search bar is empty
        allBooksSlides.forEach(slidesContainer => {
          slidesContainer.classList.remove('search-active-grid');
        });
      }
    } else {
      document.body.classList.remove('search-active');
      searchSuggestions.style.display = 'none'; // Hide when search bar is empty
      // Remove search-active-grid class when search bar is empty
      allBooksSlides.forEach(slidesContainer => {
        slidesContainer.classList.remove('search-active-grid');
      });
    }
    
    // Filter individual books and manage their display
    const bookContainers = document.querySelectorAll(".book-container");
    let visibleBooksCount = 0; // Initialize a counter

    bookContainers.forEach(container => {
      const title = container.querySelector(".title").textContent.toLowerCase();
      const authorElement = container.querySelector(".info-right p:first-child");
      const genreElement = container.querySelector(".info-right p:last-child");

      const author = authorElement ? authorElement.textContent.toLowerCase().replace('author:', '').trim() : '';
      const genre = genreElement ? genreElement.textContent.toLowerCase().replace('genres:', '').trim() : '';
      
      if (searchTerm.length === 0 || title.includes(searchTerm) || author.includes(searchTerm) || genre.includes(searchTerm)) {
        container.style.display = ""; // Let CSS handle display (e.g., inline-block)
        visibleBooksCount++; // Increment counter if book is visible
      } else {
        container.style.display = "none";
      }
    });

    // Add/remove class based on the number of visible books
    if (searchTerm.length > 0 && visibleBooksCount < 3) {
      document.body.classList.add('search-active-less-than-three');
    } else {
      document.body.classList.remove('search-active-less-than-three');
    }

    // Calculate anyBookVisibleGlobally AFTER all book containers have been processed
    const anyBookVisibleGlobally = document.querySelectorAll(".book-container[style*='display: ']").length > 0;

    // Manage the visibility of the main "Books" title (h2)
    const mainBooksTitle = document.querySelector(".books-section h2");
    if (mainBooksTitle) {
        if (searchTerm.length > 0) {
            mainBooksTitle.style.display = "none"; // Hide if searching
        } else {
            mainBooksTitle.style.display = "block"; // Show when search bar is empty
        }
    }

    // Manage the visibility of the individual sections and their h3 titles
    allBookSections.forEach(section => {
      const h3Title = section.querySelector('h3');
      const booksInThisSection = section.querySelectorAll(".book-container");
      let hasVisibleBooksInThisSection = false; // Check for visible books within this specific section

      booksInThisSection.forEach(book => {
        if (book.style.display !== "none") {
          hasVisibleBooksInThisSection = true;
        }
      });

      if (searchTerm.length > 0) {
        if (hasVisibleBooksInThisSection) {
          section.style.display = "block"; // Show section if it has matching books
          if (h3Title) h3Title.style.display = "block"; // Show sub-section title
        } else {
          section.style.display = "none"; // Hide entire section if no books match within it
        }
      } else {
        // When search bar is empty, show everything
        section.style.display = "block";
        if (h3Title) h3Title.style.display = "block"; // Show sub-section title
      }
    });

    // Adjust the books-slides container width based on visible books
    const booksSlides = document.querySelectorAll(".books-slides");
    booksSlides.forEach(slidesContainer => {
      // No longer explicitly adjust width here, let CSS handle it via search-active-grid
    });
  });
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
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert(`You borrowed "${title}"!`);
    } else if (data.message === 'already_borrowed') {
      alert(`"${title}" is already being borrowed.`);
    } else if (data.message === 'unauthorized') {
      alert("Please log in to borrow books.");
    } else {
      alert(data.message || "Error borrowing book.");
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert("Error borrowing book. Please try again.");
  });
}