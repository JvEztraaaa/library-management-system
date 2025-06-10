window.addEventListener("DOMContentLoaded", () => {
  loadBorrowedBooks();
  
  const searchBar = document.querySelector(".search-bar");
  const searchSuggestions = document.querySelector(".search-suggestions");

  let allBorrowedBookTitles = [];

  // Function to update the search suggestions and filter the table
  const updateSearchAndSuggestions = () => {
    const searchTerm = searchBar.value.toLowerCase();
    
    // Clear previous suggestions
    searchSuggestions.innerHTML = '';

    if (searchTerm.length > 0) {
      const filteredSuggestions = allBorrowedBookTitles.filter(title => title.includes(searchTerm));

      if (filteredSuggestions.length > 0) {
        filteredSuggestions.forEach(suggestion => {
          const suggestionItem = document.createElement('div');
          suggestionItem.classList.add('suggestion-item');
          suggestionItem.textContent = suggestion;
          suggestionItem.addEventListener('click', () => {
            searchBar.value = suggestion;
            updateSearchAndSuggestions(); // Trigger update with selected suggestion
            searchSuggestions.innerHTML = ''; // Clear suggestions after selection
            searchSuggestions.style.display = 'none';
          });
          searchSuggestions.appendChild(suggestionItem);
        });
        searchSuggestions.style.display = 'block'; // Show suggestions
      } else {
        searchSuggestions.style.display = 'none'; // Hide if no suggestions
      }
    } else {
      searchSuggestions.style.display = 'none'; // Hide when search bar is empty
    }

    // Filter the table rows based on the search term
    const tableRows = document.querySelectorAll("#borrowed-books-body tr");
    tableRows.forEach(row => {
      if (row.classList.contains('placeholder')) return; // Skip placeholder row
      
      const bookName = row.cells[0].textContent.toLowerCase();
      const status = row.cells[5].textContent.toLowerCase();
      
      if (bookName.includes(searchTerm) || status.includes(searchTerm)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  };

  // Add event listener for search bar input
  searchBar.addEventListener("input", updateSearchAndSuggestions);

  // Function to populate allBorrowedBookTitles after books are loaded
  const populateBorrowedBookTitles = () => {
    allBorrowedBookTitles = []; // Clear previous titles
    document.querySelectorAll("#borrowed-books-body tr").forEach(row => {
      if (!row.classList.contains('placeholder')) {
        const bookName = row.cells[0].textContent.toLowerCase();
        if (!allBorrowedBookTitles.includes(bookName)) {
          allBorrowedBookTitles.push(bookName);
        }
      }
    });
  };

  // Override the original loadBorrowedBooks to also populate titles and trigger initial search
  const originalLoadBorrowedBooks = loadBorrowedBooks;
  loadBorrowedBooks = () => {
    originalLoadBorrowedBooks().then(() => {
      populateBorrowedBookTitles();
      updateSearchAndSuggestions(); // Apply initial filter and suggestions if there's existing text
    });
  };

  // Initial load of borrowed books
  loadBorrowedBooks();
});

function loadBorrowedBooks() {
  return fetch("../backend/get_borrowed_books.php")
    .then(res => {
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.text();
    })
    .then(html => {
      document.getElementById("borrowed-books-body").innerHTML = html;
      setupActionButtons();
    })
    .catch(err => {
      console.error("Error loading borrowed books:", err);
      document.getElementById("borrowed-books-body").innerHTML =
        "<tr><td colspan='7' class='placeholder'>Error loading data</td></tr>";
    });
}

function setupActionButtons() {
  console.log("Setting up action buttons...");
  
  // Setup return buttons
  document.querySelectorAll('.return-btn').forEach(btn => {
    console.log("Found return button:", btn);
    btn.addEventListener('click', handleReturn);
  });

  // Setup view feedback buttons
  document.querySelectorAll('.view-feedback-btn').forEach(btn => {
    console.log("Found feedback button:", btn);
    btn.addEventListener('click', handleViewFeedback);
  });

  // Setup cancel buttons
  document.querySelectorAll('.cancel-btn').forEach(btn => {
    console.log("Found cancel button:", btn);
    btn.addEventListener('click', handleCancel);
  });
}

// Debug function
function debugLog(message) {
  console.log(message);
  const debugContent = document.getElementById('debug-content');
  if (debugContent) {
    debugContent.innerHTML += `<p>${message}</p>`;
  }
}

// Custom Popup Functions
function showPopup(title, message, onOkCallback = null, onCancelCallback = null, showCancel = true) {
    const popup = document.getElementById('custom-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupOk = document.getElementById('popup-ok');
    const popupCancel = document.getElementById('popup-cancel');
    const closeBtn = document.querySelector('.close-popup');
    
    if (!popup || !popupTitle || !popupMessage || !popupOk || !popupCancel || !closeBtn) {
        console.error('Popup elements not found');
        alert(message); // Fallback to regular alert
        return;
    }
    
    // Clear previous event listeners for OK and Cancel buttons
    // This is important because we are re-using the same popup instance
    const oldPopupOk = popupOk.cloneNode(true);
    popupOk.parentNode.replaceChild(oldPopupOk, popupOk);
    const currentPopupOk = document.getElementById('popup-ok'); // Get new reference

    const oldPopupCancel = popupCancel.cloneNode(true);
    popupCancel.parentNode.replaceChild(oldPopupCancel, popupCancel);
    const currentPopupCancel = document.getElementById('popup-cancel'); // Get new reference

    // Set title and message
    popupTitle.textContent = title;
    popupMessage.textContent = message;
    
    // Handle OK button
    if (onOkCallback) {
        currentPopupOk.style.display = 'inline-block'; // Show OK button
        currentPopupOk.addEventListener('click', onOkCallback, { once: true }); // Use { once: true } to remove after first click
    } else {
        currentPopupOk.style.display = 'none'; // Hide OK button if no callback
    }

    // Handle Cancel button
    if (showCancel && onCancelCallback) {
        currentPopupCancel.style.display = 'inline-block'; // Show Cancel button
        currentPopupCancel.addEventListener('click', onCancelCallback, { once: true });
    } else {
        currentPopupCancel.style.display = 'none'; // Hide Cancel button
    }

    // Always attach hidePopup to close button and clicking outside
    // Ensure these listeners are not duplicated
    const closePopupAndHide = () => {
      hidePopup();
      // Also ensure that the original OK/Cancel buttons are reset for next use
      currentPopupOk.removeEventListener('click', onOkCallback);
      currentPopupCancel.removeEventListener('click', onCancelCallback);
    };
    
    // Remove existing event listener for closeBtn before adding a new one
    const oldCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(oldCloseBtn, closeBtn);
    const newCloseBtn = document.querySelector('.close-popup');
    if (newCloseBtn) {
        newCloseBtn.addEventListener('click', closePopupAndHide, { once: true }); // Only one listener
    }

    // Ensure the popup's click-outside-to-close listener is correctly set up only once
    // Or handle it within the function that calls showPopup
    popup.onclick = (e) => { // Use onclick to overwrite previous listeners
      if (e.target === popup) {
        closePopupAndHide();
      }
    };

    popup.style.display = 'flex';
}

function hidePopup() {
    const popup = document.getElementById('custom-popup');
    if (popup) {
        popup.style.display = 'none';
    }
}

// Function to disable a button and save its state
function disableButton(button) {
    button.disabled = true;
    button.style.opacity = '0.5';
    button.style.cursor = 'not-allowed';
    
    // Save the disabled state to localStorage
    const bookId = button.dataset.bookId;
    const disabledButtons = JSON.parse(localStorage.getItem('disabledReturnButtons') || '[]');
    if (!disabledButtons.includes(bookId)) {
        disabledButtons.push(bookId);
        localStorage.setItem('disabledReturnButtons', JSON.stringify(disabledButtons));
    }
}

// Function to check if a button should be disabled
function checkButtonState(button) {
    const bookId = button.dataset.bookId;
    const disabledButtons = JSON.parse(localStorage.getItem('disabledReturnButtons') || '[]');
    if (disabledButtons.includes(bookId)) {
        button.disabled = true;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
    }
}

// Initialize all event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize popup event listeners
    const popup = document.getElementById('custom-popup');
    const closeBtn = document.querySelector('.close-popup');
    const okBtn = document.getElementById('popup-ok');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', hidePopup);
    }
    
    if (okBtn) {
        okBtn.addEventListener('click', hidePopup);
    }
    
    if (popup) {
        // Close popup when clicking outside
        popup.addEventListener('click', function(e) {
            if (e.target === popup) {
                hidePopup();
            }
        });
    }

    // Initialize return buttons
    const returnButtons = document.querySelectorAll('.return-btn');
    returnButtons.forEach(button => {
        // Check if button should be disabled
        checkButtonState(button);
        button.addEventListener('click', handleReturn);
    });

    // Initialize view feedback buttons
    const viewFeedbackButtons = document.querySelectorAll('.view-feedback-btn');
    viewFeedbackButtons.forEach(button => {
        button.addEventListener('click', handleViewFeedback);
    });

    // Initialize cancel buttons
    const cancelButtons = document.querySelectorAll('.cancel-btn');
    cancelButtons.forEach(button => {
        button.addEventListener('click', handleCancel);
    });
});

function handleReturn(event) {
    // Stop event propagation and prevent default
    event.stopPropagation();
    event.preventDefault();
    
    // Get the button and check if it's already disabled
    const button = event.target.closest('.action-btn');
    if (button.disabled) {
        return; // Exit if button is already disabled
    }
    
    debugLog('Return button clicked');
    const bookId = button.dataset.bookId;
    
    // Get the row to check if book is overdue
    const row = button.closest('tr');
    const statusCell = row.querySelector('.status-text');
    const remainingDaysCell = row.cells[3]; // Index 3 is the remaining days column
    const fineCell = row.cells[4]; // Index 4 is the fine amount column
    
    // Get the custom popup elements
    const popup = document.getElementById('custom-popup');
    if (!popup) {
        console.error('Custom popup element not found');
        showToast('Error: Custom popup not found.', 'error');
        return;
    }

    // Remove cloning logic - just get references to the existing elements
    const popupTitle = popup.querySelector('#popup-title');
    const popupMessage = popup.querySelector('#popup-message');
    const popupOk = popup.querySelector('#popup-ok');
    const popupCancel = popup.querySelector('#popup-cancel');
    const closeBtn = popup.querySelector('.close-popup');

    // Ensure popup elements are found
    if (!popupTitle || !popupMessage || !popupOk || !popupCancel || !closeBtn) {
        console.error('Missing popup sub-elements');
        showToast('Error: Missing popup sub-elements.', 'error');
        return;
    }

    // Check if book is overdue
    if (statusCell.textContent.includes('Overdue')) {
        const fineAmount = fineCell.textContent.trim();
        const remainingDays = remainingDaysCell.textContent.trim();
        
        // Extract the numeric value from the fine amount (remove ₱ symbol and any formatting)
        const numericFine = fineAmount.replace(/[^\d.]/g, '');
        
        if (fineAmount === 'N/A' || !numericFine) {
            showPopup('Overdue Book', `Unable to return book. Book is ${remainingDays}. Please visit the library counter to settle the fine.`, () => {
                // OK callback for overdue message
                disableButton(button);
                hidePopup();
            }, null, false); // No cancel button for overdue
        } else {
            showPopup('Overdue Book', `Unable to return book. Book is ${remainingDays}. Please pay the fine of ${fineAmount} at the library counter.`, () => {
                // OK callback for overdue message
                disableButton(button);
                hidePopup();
            }, null, false); // No cancel button for overdue
        }
        
        // Disable the original return button and save its state, as this is a final action for this book
        disableButton(button);
        return;
    }
    
    // This part runs if the book is NOT overdue (i.e., for actual return confirmation)
    showPopup('Return Book', 'Are you sure you want to return this book?', () => {
        // OK callback for return confirmation
        hidePopup(); // Hide popup immediately
        
        fetch('../backend/return_book.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `book_id=${bookId}`
        })
        .then(res => res.json())
        .then(data => {
            debugLog('Return response: ' + JSON.stringify(data));
            if (data.success) {
                // Update the status cell
                const statusCell = row.querySelector('.status-text');
                statusCell.innerHTML = '<i class="fas fa-check"></i> Returned';
                statusCell.className = 'status-text status-returned';
                
                // Remove the return button and replace with returned status
                const actionCell = row.cells[6]; // Index 6 is the actions column
                actionCell.innerHTML = '<span class="status-text status-returned"><i class="fas fa-check"></i> Returned</span>';
                
                // Disable the button
                disableButton(button);
                
                // Show success message
                showToast('Book returned successfully!', 'success');
            } else {
                // Re-enable the button if there was an error
                button.disabled = false;
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                showToast('Error returning book: ' + data.message, 'error');
            }
        })
        .catch(err => {
            console.error('Error:', err);
            debugLog('Error: ' + err.message);
            // Re-enable the button if there was an error
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            showToast('Error returning book. Please try again.', 'error');
        });
    }, () => {
        // Cancel callback for return confirmation
        hidePopup();
    }, true); // Show cancel button
}

function handleViewFeedback(event) {
    // Stop event propagation and prevent default
    event.stopPropagation();
    event.preventDefault();
    
    const button = event.target.closest('.action-btn');
    const bookId = button.dataset.bookId;
    
    // Show custom popup
    const popup = document.getElementById('custom-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupOk = document.getElementById('popup-ok');
    const popupCancel = document.getElementById('popup-cancel');
    
    if (!popup || !popupTitle || !popupMessage || !popupOk || !popupCancel) {
        console.error('Popup elements not found');
        return;
    }
    
    popupTitle.textContent = 'Book Feedback';
    popupMessage.textContent = 'Loading feedback...';
    popup.style.display = 'flex';
    
    // Hide cancel button for feedback view
    popupCancel.style.display = 'none';
    
    // Remove any existing event listeners
    const newOkBtn = popupOk.cloneNode(true);
    popupOk.parentNode.replaceChild(newOkBtn, popupOk);
    
    // Add new event listener for OK button
    newOkBtn.addEventListener('click', function() {
        hidePopup();
    });
    
    // Add event listener for close button
    const closeBtn = document.querySelector('.close-popup');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            hidePopup();
        });
    }
    
    // Close popup when clicking outside
    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            hidePopup();
        }
    });
    
    // Fetch feedback from the server
    fetch('../backend/get_feedback.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `book_id=${bookId}`
    })
    .then(res => res.json())
    .then(data => {
        console.log('Feedback data:', data); // Debug log
        if (data.success) {
            if (data.feedback && typeof data.feedback === 'object' && data.feedback.admin_comment) {
                popupMessage.innerHTML = `
                    <div class="feedback-content">
                        <p><strong>Admin Comment:</strong> ${data.feedback.admin_comment}</p>
                        <p><strong>Date:</strong> ${data.feedback.date || 'Not specified'}</p>
                    </div>
                `;
            } else {
                popupMessage.textContent = data.feedback || 'No feedback available for this book.';
            }
        } else {
            popupMessage.textContent = 'Error loading feedback. Please try again.';
        }
    })
    .catch(err => {
        console.error('Error:', err);
        popupMessage.textContent = 'Error loading feedback. Please try again.';
    });
}

// Toast message function - now using unified toast system from toast.js

function handleCancel(event) {
    // Stop event propagation and prevent default
    event.stopPropagation();
    event.preventDefault();
    
    const button = event.target.closest('.action-btn');
    const bookId = parseInt(button.dataset.bookId, 10); // Ensure bookId is an integer
    
    console.log('Book ID from dataset:', button.dataset.bookId);
    console.log('Parsed Book ID:', bookId);
    
    if (isNaN(bookId)) {
        console.error('Invalid book ID');
        showToast('Invalid book ID. Please try again.', 'error');
        return;
    }
    
    // Show custom popup for confirmation
    const popup = document.getElementById('custom-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupOk = document.getElementById('popup-ok');
    const popupCancel = document.getElementById('popup-cancel');
    
    if (!popup || !popupTitle || !popupMessage || !popupOk || !popupCancel) {
        console.error('Popup elements not found');
        alert('Are you sure you want to cancel this request?');
        return;
    }
    
    // Clear any existing event listeners by cloning and replacing elements
    const newPopup = popup.cloneNode(true);
    popup.parentNode.replaceChild(newPopup, popup);
    
    // Get the new elements after cloning
    const newPopupTitle = newPopup.querySelector('#popup-title');
    const newPopupMessage = newPopup.querySelector('#popup-message');
    const newPopupOk = newPopup.querySelector('#popup-ok');
    const newPopupCancel = newPopup.querySelector('#popup-cancel');
    const newCloseBtn = newPopup.querySelector('.close-popup');
    
    // Set up the popup content
    newPopupTitle.textContent = 'Cancel Request';
    newPopupMessage.textContent = 'Are you sure you want to cancel this request?';
    newPopup.style.display = 'flex';
    newPopupCancel.style.display = 'block';
    
    // Flag to track if a request is in progress
    let isRequestInProgress = false;
    
    // Add event listener for OK button
    newPopupOk.addEventListener('click', function() {
        if (isRequestInProgress) return; // Prevent multiple requests
        isRequestInProgress = true;
        
        // Disable the button
        newPopupOk.disabled = true;
        newPopupOk.style.opacity = '0.5';
        newPopupOk.style.cursor = 'not-allowed';
        
        // Hide the popup
        newPopup.style.display = 'none';
        
        // Create form data
        const formData = new FormData();
        formData.append('book_id', bookId);
        
        console.log('Sending request with book_id:', bookId);
        
        fetch('../backend/cancel_request.php', {
            method: 'POST',
            body: formData
        })
        .then(res => {
            console.log('Response status:', res.status);
            if (!res.ok) {
                return res.text().then(text => {
                    console.log('Error response:', text);
                    throw new Error('Network response was not ok');
                });
            }
            return res.json();
        })
        .then(data => {
            console.log('Response data:', data);
            if (data.success) {
                // Remove the row from the table
                const row = button.closest('tr');
                if (row) {
                    row.remove();
                }
                
                // Show success toast message
                showToast('Request cancelled successfully!', 'success');
            } else {
                showToast('Error cancelling request: ' + data.message, 'error');
            }
        })
        .catch(err => {
            console.error('Error:', err);
            showToast('Error cancelling request. Please try again.', 'error');
        })
        .finally(() => {
            isRequestInProgress = false;
            // Re-enable the OK button and reset its style
            newPopupOk.disabled = false;
            newPopupOk.style.opacity = '1';
            newPopupOk.style.cursor = 'pointer';
        });
    });
    
    // Add event listener for Cancel button
    newPopupCancel.addEventListener('click', function() {
        newPopup.style.display = 'none';
    });
    
    // Add event listener for close button
    if (newCloseBtn) {
        newCloseBtn.addEventListener('click', function() {
            newPopup.style.display = 'none';
        });
    }
    
    // Close popup when clicking outside
    newPopup.addEventListener('click', function(e) {
        if (e.target === newPopup) {
            newPopup.style.display = 'none';
        }
    });
}

function showFeedbackModal(feedback) {
  let modal = document.querySelector('.feedback-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'feedback-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h3>Admin Feedback</h3>
        <div class="feedback-text"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.close-modal').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  modal.querySelector('.feedback-text').textContent = feedback;
  modal.style.display = 'block';
}

function createBookRow(book) {
  const row = document.createElement('tr');
  
  // Format dates
  const borrowDate = new Date(book.borrow_date).toLocaleDateString();
  const returnDate = new Date(book.return_date).toLocaleDateString();
  
  row.innerHTML = `
    <td>${book.title}</td>
    <td>${borrowDate}</td>
    <td>${returnDate}</td>
    <td>${book.status}</td>
    <td>
      ${book.status === 'Pending' ? 
        `<button class="action-btn cancel" data-book-id="${book.id}">Cancel</button>` :
        book.status === 'Borrowed' ?
        `<button class="action-btn return" data-book-id="${book.id}">Return</button>` :
        book.status === 'Returned' ?
        `<button class="action-btn feedback" data-book-id="${book.id}">Give Feedback</button>` :
        ''
      }
    </td>
  `;

  // Add event listeners based on status
  if (book.status === 'Pending') {
    row.querySelector('.cancel').addEventListener('click', handleCancel);
  } else if (book.status === 'Borrowed') {
    row.querySelector('.return').addEventListener('click', handleReturn);
  } else if (book.status === 'Returned') {
    row.querySelector('.feedback').addEventListener('click', handleViewFeedback);
  }

  return row;
}
