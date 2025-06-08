document.addEventListener('DOMContentLoaded', function() {
    fetchApprovalRequests();
    setupEventListeners();
    
    // Refresh approvals every 30 seconds
    setInterval(fetchApprovalRequests, 30000);
});

// Set up event listeners for filter buttons (All, Pending, Approved, Rejected)
function setupEventListeners() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            fetchApprovalRequests(button.dataset.status);
        });
    });
}

// Fetch approval requests from the server
async function fetchApprovalRequests(status = 'all') {
    try {
        const response = await fetch(`../backend/admin/admin_get_approval_requests.php${status !== 'all' ? `?status=${status}` : ''}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched approval requests:', JSON.stringify(data, null, 2)); // Detailed debug log
        if (data.success) {
            displayApprovalRequests(data.requests);
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

// Calculate fine for overdue books
function calculateFine(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    
    // For testing purposes, let's simulate a future date
    const testDate = new Date('2025-06-07'); // Simulate a date after the due date
    
    // Only calculate fine if the book is overdue
    if (testDate > due) {
        // Calculate the difference in days, ignoring time
        const testDateOnly = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate());
        const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        const diffTime = Math.abs(testDateOnly - dueDateOnly);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        console.log('Days overdue:', diffDays);
        const fine = diffDays * 20; // 20 PHP per day
        console.log('Calculated fine:', fine);
        return fine;
    }
    return 0;
}

// Create an approval card for a single request
function createApprovalCard(request) {
    console.log('Creating card for request:', JSON.stringify(request, null, 2));
    const card = document.createElement('div');
    card.className = 'approval-card';
    card.dataset.requestId = request.id;
    
    const statusClass = request.status.toLowerCase();
    const isPending = request.status === 'Pending';
    const isOverdue = request.status === 'Overdue';
    
    // Calculate fine if overdue
    let fineAmount = 0;
    if (isOverdue && request.due_date) {
        fineAmount = calculateFine(request.due_date);
        console.log('Calculated fine amount:', fineAmount);
    }
    
    console.log('Request details:');
    console.log('Status:', request.status);
    console.log('Is overdue:', isOverdue);
    console.log('Due date:', request.due_date);
    
    // Create fine display HTML - force display for overdue books
    const fineDisplay = isOverdue ? 
        `<div class="fine-amount" style="display: block !important; color: #e74a3b; font-weight: 600; padding: 10px; background-color: rgba(231, 74, 59, 0.1); border-radius: 6px; margin-top: 10px; border: 1px solid rgba(231, 74, 59, 0.2);">
            <strong>Fine Amount:</strong> ₱${parseFloat(fineAmount).toFixed(2)}
        </div>` : '';
    
    // Quick feedback options
    const quickFeedbackOptions = isPending ? `
        <div class="quick-feedback">
            <p class="quick-feedback-label">Quick Feedback:</p>
            <div class="quick-feedback-buttons">
                <button type="button" class="quick-feedback-btn" data-feedback="Not Available">Not Available</button>
                <button type="button" class="quick-feedback-btn" data-feedback="Already Borrowed">Already Borrowed</button>
                <button type="button" class="quick-feedback-btn" data-feedback="Book Under Maintenance">Under Maintenance</button>
                <button type="button" class="quick-feedback-btn" data-feedback="Invalid Request">Invalid Request</button>
            </div>
        </div>
    ` : '';
    
    const cardHTML = `
        <div class="approval-header">
            <h3 class="approval-title">${request.book_title}</h3>
            <div class="status-container">
                <span class="approval-status status-${statusClass}">${request.status}</span>
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
        ${isPending ? `
            <div class="approval-actions">
                ${quickFeedbackOptions}
                <textarea class="approval-comment" placeholder="Add a comment (required for rejection)"></textarea>
                <div class="button-group">
                    <button type="button" class="approval-btn approve-btn" onclick="approveRequest(${request.id})">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button type="button" class="approval-btn reject-btn" onclick="rejectRequest(${request.id})">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </div>
        ` : ''}
    `;
    
    console.log('Generated card HTML:', cardHTML);
    card.innerHTML = cardHTML;

    // Add event listeners for quick feedback buttons
    if (isPending) {
        const quickFeedbackBtns = card.querySelectorAll('.quick-feedback-btn');
        const commentTextarea = card.querySelector('.approval-comment');
        
        quickFeedbackBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (commentTextarea) {
                    commentTextarea.value = btn.dataset.feedback;
                    // Trigger input event to ensure any validation is updated
                    commentTextarea.dispatchEvent(new Event('input'));
                }
            });
        });
    }

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
                showError('Request rejected successfully');
            } else {
                showSuccess('Request approved successfully');
            }
            // Refresh the approval requests list
            fetchApprovalRequests();
        } else {
            throw new Error(data.message || 'Failed to update request status');
        }
    } catch (error) {
        console.error('Error updating request status:', error);
        showError(error.message);
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

// Toast notification system
const ToastSystem = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
        return this.container;
    },
    
    show(message, type = 'success') {
        const container = this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode === container) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    },
    
    success(message) {
        this.show(message, 'success');
    },
    
    error(message) {
        this.show(message, 'error');
    }
};

// Show success message
function showSuccess(message) {
    ToastSystem.success(message);
}

// Show error message
function showError(message) {
    ToastSystem.error(message);
}

// Add the markAsPaid function
async function markAsPaid(requestId) {
    try {
        const response = await fetch('/library-management-system/backend/admin/admin_mark_as_paid.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ request_id: requestId })
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();
        
        if (data.success) {
            ToastSystem.success('Book marked as paid and returned successfully');
            // Refresh the book approvals list
            location.reload(); // Simple page reload to refresh the data
        } else {
            ToastSystem.error(data.message || 'Failed to mark book as paid');
        }
    } catch (error) {
        console.error('Error marking book as paid:', error);
        ToastSystem.error('An error occurred while marking the book as paid');
    }
} 