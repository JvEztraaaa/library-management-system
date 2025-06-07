window.addEventListener("DOMContentLoaded", () => {
  loadBorrowedBooks();
});

function loadBorrowedBooks() {
  fetch("../backend/get_borrowed_books.php")
    .then(res => res.text())
    .then(html => {
      document.getElementById("borrowed-books-body").innerHTML = html;
      setupActionButtons();
    })
    .catch(err => {
      console.error("Error loading borrowed books:", err);
      document.getElementById("borrowed-books-body").innerHTML =
        "<tr><td colspan='5' class='placeholder'>Error loading data</td></tr>";
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
function showPopup(title, message) {
    const popup = document.getElementById('custom-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    
    if (!popup || !popupTitle || !popupMessage) {
        console.error('Popup elements not found');
        // Fallback to regular alert if popup elements are missing
        alert(message);
        return;
    }
    
    popupTitle.textContent = title;
    popupMessage.textContent = message;
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
    const fineCell = row.cells[4]; // Index 4 is the fine amount column
    
    // Check if book is overdue
    if (statusCell.textContent.includes('Overdue')) {
        const fineAmount = fineCell.textContent;
        showPopup('Overdue Book', `Unable to return book. Please pay the fine of ${fineAmount} at the library counter.`);
        // Disable the button and save its state
        disableButton(button);
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
        alert('Are you sure you want to return this book?');
        return;
    }
    
    popupTitle.textContent = 'Return Book';
    popupMessage.textContent = 'Are you sure you want to return this book?';
    popup.style.display = 'flex';
    
    // Show cancel button for return confirmation
    popupCancel.style.display = 'block';
    
    // Remove any existing event listeners
    const newOkBtn = popupOk.cloneNode(true);
    const newCancelBtn = popupCancel.cloneNode(true);
    popupOk.parentNode.replaceChild(newOkBtn, popupOk);
    popupCancel.parentNode.replaceChild(newCancelBtn, popupCancel);
    
    // Add new event listener for OK button
    newOkBtn.addEventListener('click', function confirmReturn() {
        hidePopup();
        
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
                showPopup('Success', 'Book returned successfully!');
            } else {
                // Re-enable the button if there was an error
                button.disabled = false;
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                showPopup('Error', 'Error returning book: ' + data.message);
            }
        })
        .catch(err => {
            console.error('Error:', err);
            debugLog('Error: ' + err.message);
            // Re-enable the button if there was an error
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            showPopup('Error', 'Error returning book. Please try again.');
        });
    });
    
    // Add event listener for Cancel button
    newCancelBtn.addEventListener('click', function() {
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

function handleCancel(event) {
    // Stop event propagation and prevent default
    event.stopPropagation();
    event.preventDefault();
    
    const button = event.target.closest('.action-btn');
    const bookId = button.dataset.bookId;
    
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
    
    popupTitle.textContent = 'Cancel Request';
    popupMessage.textContent = 'Are you sure you want to cancel this request?';
    popup.style.display = 'flex';
    
    // Show cancel button for confirmation
    popupCancel.style.display = 'block';
    
    // Remove any existing event listeners
    const newOkBtn = popupOk.cloneNode(true);
    const newCancelBtn = popupCancel.cloneNode(true);
    popupOk.parentNode.replaceChild(newOkBtn, popupOk);
    popupCancel.parentNode.replaceChild(newCancelBtn, popupCancel);
    
    // Add new event listener for OK button
    newOkBtn.addEventListener('click', function confirmCancel() {
        hidePopup();
        
        fetch('../backend/cancel_request.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `book_id=${bookId}`
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Remove the row from the table
                const row = button.closest('tr');
                row.remove();
                
                // Show success message
                showPopup('Success', 'Request cancelled successfully!');
            } else {
                showPopup('Error', 'Error cancelling request: ' + data.message);
            }
        })
        .catch(err => {
            console.error('Error:', err);
            showPopup('Error', 'Error cancelling request. Please try again.');
        });
    });
    
    // Add event listener for Cancel button
    newCancelBtn.addEventListener('click', function() {
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
