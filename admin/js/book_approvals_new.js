// Global variables
let currentApprovalId = null;
let currentApprovalIdForPayment = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // --- NEW: Auto-activate filter from URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');
    if (filter) {
        // Find the filter button and trigger its click event
        const filterButton = document.querySelector(`.filter-btn[data-status="${filter.toLowerCase()}"]`);
        if (filterButton) {
            filterButton.click();
        }
    }
    // --- END NEW ---

    // Initialize all popup elements
    const popup = document.getElementById('notificationPopup');
    const successPopup = document.getElementById('successPopup');
    const markPaidPopup = document.getElementById('markPaidPopup');
    const markPaidSuccessPopup = document.getElementById('markPaidSuccessPopup');
    const successMessage = document.getElementById('successMessage');
    const markPaidSuccessMessage = document.getElementById('markPaidSuccessMessage');
    const closePopup = document.querySelector('.close-popup');
    const cancelBtn = document.querySelector('.cancel-btn');
    const confirmBtn = document.querySelector('.confirm-btn');
    const confirmMarkPaid = document.getElementById('confirmMarkPaid');
    
    console.log('Popup elements:', {
        popup,
        successPopup,
        markPaidPopup,
        markPaidSuccessPopup,
        confirmMarkPaid
    });
    
    // Setup event listeners for popups
    function setupPopupEventListeners() {
        console.log('Setting up popup event listeners');
        
        // Close buttons for all popups
        document.querySelectorAll('.close-popup').forEach(btn => {
            btn.addEventListener('click', function() {
                console.log('Close button clicked');
                const popup = this.closest('.notification-popup');
                if (popup) {
                    popup.classList.remove('active');
                }
            });
        });

        // Cancel buttons
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                console.log('Cancel button clicked');
                const popup = this.closest('.notification-popup');
                if (popup) {
                    popup.classList.remove('active');
                }
            });
        });

        // Success popup OK button
        if (successPopup) {
            const successConfirmBtn = successPopup.querySelector('.confirm-btn');
            if (successConfirmBtn) {
                successConfirmBtn.addEventListener('click', function() {
                    console.log('Success popup OK clicked');
                    successPopup.classList.remove('active');
                });
            }
        }

        // Mark as Paid success popup OK button
        if (markPaidSuccessPopup) {
            const markPaidSuccessConfirmBtn = markPaidSuccessPopup.querySelector('.confirm-btn');
            if (markPaidSuccessConfirmBtn) {
                markPaidSuccessConfirmBtn.addEventListener('click', function() {
                    console.log('Mark as Paid success popup OK clicked');
                    markPaidSuccessPopup.classList.remove('active');
                });
            }
        }

        // Mark as Paid confirmation button
        if (confirmMarkPaid) {
            console.log('Adding click listener to confirmMarkPaid button');
            confirmMarkPaid.addEventListener('click', async function() {
                console.log('Confirm mark as paid clicked. Current ID:', currentApprovalIdForPayment);
                if (!currentApprovalIdForPayment) {
                    console.error('No approval ID set for payment');
                    return;
                }

                try {
                    console.log('Sending mark as paid request for ID:', currentApprovalIdForPayment);
                    const response = await fetch('/library-management-system/backend/admin/admin_mark_as_paid.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            request_id: currentApprovalIdForPayment
                        })
                    });
                    
                    console.log('Server response:', response);
                    const data = await response.json();
                    console.log('Response data:', data);
                    
                    if (data.success) {
                        if (markPaidPopup) markPaidPopup.classList.remove('active');
                        if (markPaidSuccessMessage) markPaidSuccessMessage.textContent = data.message;
                        if (markPaidSuccessPopup) markPaidSuccessPopup.classList.add('active');
                        // Refresh the list after successful payment
                        fetchApprovalRequests();
                    } else {
                        if (markPaidSuccessMessage) markPaidSuccessMessage.textContent = data.message || 'Failed to mark book as paid';
                        if (markPaidSuccessPopup) markPaidSuccessPopup.classList.add('active');
                    }
                } catch (error) {
                    console.error('Error marking book as paid:', error);
                    if (markPaidSuccessMessage) markPaidSuccessMessage.textContent = 'An error occurred while marking the book as paid';
                    if (markPaidSuccessPopup) markPaidSuccessPopup.classList.add('active');
                }
            });
        } else {
            console.warn('confirmMarkPaid button not found - this is expected if no overdue books are present');
        }

        // Notification confirmation button
        if (popup) {
            const confirmBtn = popup.querySelector('.confirm-btn');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', async () => {
                    if (!currentApprovalId) return;
                    
                    try {
                        const response = await fetch('../backend/send_overdue_notification.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ approval_id: currentApprovalId })
                        });
                        
                        const data = await response.json();
                        
                        // Hide notification popup
                        popup.classList.remove('active');
                        
                        if (data.success) {
                            // Show success popup
                            if (successMessage) successMessage.textContent = 'Reminder notification sent successfully!';
                            if (successPopup) successPopup.classList.add('active');
                        } else {
                            // Show error popup
                            if (successMessage) successMessage.textContent = 'Failed to send reminder: ' + data.message;
                            if (successPopup) successPopup.classList.add('active');
                        }
                    } catch (error) {
                        console.error('Error sending notification:', error);
                        if (successMessage) successMessage.textContent = 'Failed to send reminder. Please try again.';
                        if (successPopup) successPopup.classList.add('active');
                    }
                });
            }
        }
    }

    // Call setupPopupEventListeners to initialize all popup event listeners
    setupPopupEventListeners();

    // Function to show mark as paid popup
    window.showMarkPaidPopup = function(approvalId, studentName, bookTitle, fineAmount) {
        currentApprovalIdForPayment = approvalId;
        document.getElementById('paidStudentName').textContent = studentName;
        document.getElementById('paidBookTitle').textContent = bookTitle;
        document.getElementById('paidAmount').textContent = fineAmount;
        markPaidPopup.classList.add('active');
    };

    // Function to show notification popup
    window.sendOverdueNotification = function(approvalId, studentName, bookTitle, dueDate, fineAmount) {
        currentApprovalId = approvalId;
        document.getElementById('studentName').textContent = studentName;
        document.getElementById('bookTitle').textContent = bookTitle;
        document.getElementById('dueDate').textContent = dueDate;
        document.getElementById('fineAmount').textContent = fineAmount;
        popup.classList.add('active');
    };

    fetchApprovalRequests();
    setupEventListeners();
    
    // Refresh approvals every 30 seconds
    setInterval(fetchApprovalRequests, 30000);
});

// Set up event listeners for filter buttons (All, Pending, Approved, Rejected)
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            fetchApprovalRequests(button.dataset.status);
        });
    });

    // Add event delegation for quick feedback buttons
    document.addEventListener('click', function(e) {
        console.log('Click event triggered:', e.target);
        if (e.target.classList.contains('quick-feedback-btn')) {
            console.log('Quick feedback button clicked:', e.target.dataset.feedback);
            const feedback = e.target.dataset.feedback;
            const card = e.target.closest('.approval-card');
            if (card) {
                console.log('Found approval card:', card.dataset.requestId);
                const commentInput = card.querySelector('.approval-comment');
                if (commentInput) {
                    console.log('Setting comment value to:', feedback);
                    commentInput.value = feedback;
                    // Focus the comment input after setting the value
                    commentInput.focus();
                } else {
                    console.error('Comment input not found');
                }
            } else {
                console.error('Approval card not found');
            }
        }
    });
}

// Fetch approval requests from the server
async function fetchApprovalRequests(status = 'all') {
    try {
        // Get the current active filter button
        const activeButton = document.querySelector('.filter-btn.active');
        const currentStatus = activeButton ? activeButton.dataset.status : status;

        const response = await fetch(`../backend/admin/admin_get_approval_requests.php${currentStatus !== 'all' ? `?status=${currentStatus}` : ''}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched approval requests:', JSON.stringify(data, null, 2)); // Detailed debug log
        if (data.success) {
            displayApprovalRequests(data.requests);
            // Ensure the correct filter button stays active
            const filterButtons = document.querySelectorAll('.filter-btn');
            filterButtons.forEach(btn => {
                if (btn.dataset.status === currentStatus) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        } else {
            throw new Error(data.message || 'Failed to fetch approval requests');
        }
    } catch (error) {
        console.error('Error fetching approval requests:', error);
        const container = document.getElementById('approvalContainer');
        if (container) {
            container.innerHTML = `<div class="error-message">Error loading approval requests: ${error.message}</div>`;
        }
    }
}

// Display approval requests in the approval box
function displayApprovalRequests(requests) {
    const container = document.getElementById('approvalContainer');
    if (!container) {
        console.error('Approval container not found');
        return;
    }

    container.innerHTML = '';

    // Sort requests: pending first, then by date (newest first)
    requests.sort((a, b) => {
        // If one is pending and the other isn't, pending comes first
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        
        // If both are pending or both are not pending, sort by date
        return new Date(b.borrow_time) - new Date(a.borrow_time);
    });

    if (requests.length === 0) {
        container.innerHTML = '<div class="no-requests">No approval requests found</div>';
        return;
    }

    requests.forEach(request => {
        console.log('Processing request:', JSON.stringify(request, null, 2)); // Log each request
        const card = createApprovalCard(request);
        container.appendChild(card);
    });
}

// Create an approval card for a single request
function createApprovalCard(request) {
    // console.log('Creating card for request:', request); // Keep this for debugging if needed
    const card = document.createElement('div');
    card.classList.add('approval-card');
    card.dataset.requestId = request.id;

    const isPending = request.status === 'Pending';
    const isApproved = request.status === 'Approved';
    const isRejected = request.status === 'Rejected';
    const isBorrowed = request.status === 'Borrowed';
    const isReturned = request.status === 'Returned';
    const isOverdue = request.status === 'Overdue';

    let fineDisplay = '';
    let finalFineAmount = 0; // The value that will be used for display and notification

    // If status is Overdue and fine_amount is provided by backend, use it as source of truth
    if (isOverdue && request.fine_amount !== null && request.fine_amount !== undefined) {
        const backendFine = parseFloat(request.fine_amount);
        if (!isNaN(backendFine) && backendFine > 0) {
            finalFineAmount = backendFine;
            fineDisplay = `<p class="fine-amount"><strong>Fine Amount:</strong> ₱${finalFineAmount.toFixed(2)}</p>`;
        }
    }

    // Ensure finalFineAmount is a valid number for further use
    finalFineAmount = isNaN(finalFineAmount) ? 0 : finalFineAmount;

    const cardHTML = `
        <div class="approval-header">
            <h3 class="approval-title">${request.book_title}</h3>
            <div class="status-container">
                <span class="approval-status status-${request.status.toLowerCase()}">${request.status}</span>
                ${isOverdue ? `
                    <button type="button" class="approval-btn mark-paid-btn" onclick="markAsPaid(${request.id})">
                        <i class="fas fa-check"></i> Mark as Paid
                    </button>
                ` : ''}
            </div>
        </div>
        <div class="approval-details">
            <p><strong>Student:</strong> ${request.student_name}</p>
            <p><strong>Author:</strong> ${request.author}</p>
            <p><strong>Genre:</strong> ${request.genre}</p>
            <p><strong>Request Date:</strong> ${formatDate(request.borrow_time)}</p>
            <p><strong>Due Date:</strong> ${request.due_date ? formatDate(request.due_date) : 'Not set'}</p>
            ${fineDisplay}
            ${request.admin_comment ? `<p><strong>Admin Comment:</strong> ${request.admin_comment}</p>` : ''}
        </div>
        <div class="approval-actions">
            ${isPending ? `
                <div class="quick-feedback">
                    <p class="quick-feedback-label">Quick Feedback:</p>
                    <div class="quick-feedback-buttons">
                        <button type="button" class="quick-feedback-btn" data-feedback="Not Available" onclick="handleQuickFeedback(this)">Not Available</button>
                        <button type="button" class="quick-feedback-btn" data-feedback="Already Borrowed" onclick="handleQuickFeedback(this)">Already Borrowed</button>
                        <button type="button" class="quick-feedback-btn" data-feedback="Book Under Maintenance" onclick="handleQuickFeedback(this)">Under Maintenance</button>
                        <button type="button" class="quick-feedback-btn" data-feedback="Invalid Request" onclick="handleQuickFeedback(this)">Invalid Request</button>
                    </div>
                </div>
                <textarea class="approval-comment" placeholder="Add a comment (required for rejection)"></textarea>
                <div class="button-group">
                    <button type="button" class="approval-btn approve-btn" onclick="approveRequest(${request.id})">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button type="button" class="approval-btn reject-btn" onclick="rejectRequest(${request.id})">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            ` : ''}
            ${isOverdue ? `
                <div class="button-group">
                    <button type="button" class="notification-btn" onclick="sendOverdueNotification(${request.id}, '${request.student_name}', '${request.book_title}', '${request.due_date ? formatDate(request.due_date) : 'Not set'}', '${finalFineAmount.toFixed(2)}')">
                        <i class="fas fa-bell"></i> Send Reminder
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    card.innerHTML = cardHTML;
    return card;
}

// Handle approval of a request
async function approveRequest(requestId) {
    const card = document.querySelector(`[data-request-id="${requestId}"]`);
    if (!card) return;
    
    const comment = card.querySelector('.approval-comment')?.value || '';
    await handleApproval(requestId, 'Approved', comment);
}

// Handle rejection of a request
async function rejectRequest(requestId) {
    const card = document.querySelector(`[data-request-id="${requestId}"]`);
    if (!card) return;
    
    const commentInput = card.querySelector('.approval-comment');
    const comment = commentInput?.value?.trim() || '';
    
    // Check if comment is empty when rejecting
    if (!comment) {
        showError('Please provide a reason for rejection');
        // Highlight the comment textarea
        if (commentInput) {
            commentInput.style.borderColor = '#e74a3b';
            commentInput.focus();
            // Remove the highlight after 2 seconds
            setTimeout(() => {
                commentInput.style.borderColor = '';
            }, 2000);
        }
        return;
    }
    
    await handleApproval(requestId, 'Rejected', comment);
}

// Handle the approval/rejection process by sending request to server
async function handleApproval(requestId, status, comment) {
    try {
        const response = await fetch('../backend/admin/admin_update_approval_status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                request_id: requestId,
                status: status,
                comment: comment
            })
        });

        const data = await response.json();
        
        if (data.success) {
            if (status === 'Rejected') {
                showToast('Request rejected successfully', 'success');
            } else {
                showToast('Request approved successfully', 'success');
            }
            // Refresh the approval requests list
            fetchApprovalRequests();
        } else {
            throw new Error(data.message || 'Failed to update request status');
        }
    } catch (error) {
        console.error('Error updating request status:', error);
        showToast(error.message, 'error');
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show success message
function showSuccess(message) {
    showToast(message, 'success');
}

// Show error message
function showError(message) {
    showToast(message, 'error');
}

// Add the closeMarkPaidSuccessPopup function to global scope
window.closeMarkPaidSuccessPopup = function() {
    console.log('Closing mark as paid success popup');
    const markPaidSuccessPopup = document.getElementById('markPaidSuccessPopup');
    if (markPaidSuccessPopup) {
        markPaidSuccessPopup.classList.remove('active');
    }
};

// Add the closeSuccessPopup function to global scope
window.closeSuccessPopup = function() {
    console.log('Closing success popup');
    const successPopup = document.getElementById('successPopup');
    if (successPopup) {
        successPopup.classList.remove('active');
    }
};

// Add the markAsPaid function to global scope
window.markAsPaid = async function(requestId) {
    console.log('markAsPaid called with ID:', requestId);
    
    // Set the currentApprovalIdForPayment immediately
    currentApprovalIdForPayment = requestId;
    console.log('Set currentApprovalIdForPayment to:', currentApprovalIdForPayment);
    
    // Get the book details first
    try {
        const response = await fetch(`/library-management-system/backend/admin/admin_get_approval_requests.php?id=${requestId}`);
        const data = await response.json();
        console.log('Book details raw response:', data); // Keep this for raw data
        
        if (data.success && data.requests && data.requests.length > 0) {
            const request = data.requests[0];
            console.log('Request object for paid popup:', request); // Add this new log
            
            // Show the mark as paid confirmation popup
            document.getElementById('paidStudentName').textContent = `${request.first_name} ${request.last_name}`;
            document.getElementById('paidBookTitle').textContent = request.book_title;
            document.getElementById('paidAmount').textContent = `₱${request.fine_amount}`;
            markPaidPopup.classList.add('active');
            console.log('Mark as paid popup shown');
        } else {
            throw new Error('Failed to get book details');
        }
    } catch (error) {
        console.error('Error getting book details:', error);
        markPaidSuccessMessage.textContent = 'An error occurred while getting book details';
        markPaidSuccessPopup.classList.add('active');
    }
};

// Add a direct handler function for quick feedback
window.handleQuickFeedback = function(button) {
    console.log('Quick feedback handler called:', button.dataset.feedback);
    const feedback = button.dataset.feedback;
    const card = button.closest('.approval-card');
    if (card) {
        const commentInput = card.querySelector('.approval-comment');
        if (commentInput) {
            commentInput.value = feedback;
            // Focus the comment input after setting the value
            commentInput.focus();
        }
    }
}; 