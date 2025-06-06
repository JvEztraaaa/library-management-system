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
            etchApprovalRequests(button.dataset.status);
        });
    });
}

// Fetch approval requests from the server with optional status filter
async function fetchApprovalRequests(status = 'all') {
    try {
        const response = await fetch(`../backend/get_approval_requests.php?status=${status}`);
        const data = await response.json();
        
        if (data.success) {
            displayApprovalRequests(data.requests);
        } else {
            showError(data.message || 'Failed to fetch approval requests');
        }
    } catch (error) {
        console.error('Error fetching approval requests:', error);
        showError('Error connecting to server');
    }
}

// Display approval requests in the approval box
function displayApprovalRequests(requests) {
    const approvalBox = document.getElementById('approvalBox');
    if (!approvalBox) return;

    approvalBox.innerHTML = '';

    if (requests.length === 0) {
        approvalBox.innerHTML = `
            <div class="no-requests">
                <p>No approval requests found</p>
            </div>
        `;
        return;
    }

    requests.forEach(request => {
        const card = createApprovalCard(request);
        approvalBox.appendChild(card);
    });
}

// Create an approval card for a single request
function createApprovalCard(request) {
    const card = document.createElement('div');
    card.className = 'approval-card';
    card.dataset.requestId = request.id;
    
    const statusClass = request.status.toLowerCase();
    const isPending = request.status === 'Pending';
    
    card.innerHTML = `
        <div class="approval-header">
            <h3 class="approval-title">${request.book_title}</h3>
            <span class="approval-status status-${statusClass}">${request.status}</span>
        </div>
        <div class="approval-details">
            <p><strong>Student:</strong> ${request.student_name}</p>
            <p><strong>Author:</strong> ${request.author}</p>
            <p><strong>Genre:</strong> ${request.genre}</p>
            <p><strong>Request Date:</strong> ${formatDate(request.borrow_time)}</p>
            <p><strong>Due Date:</strong> ${request.due_date ? formatDate(request.due_date) : 'Not set'}</p>
            ${request.admin_comment ? `<p><strong>Admin Comment:</strong> ${request.admin_comment}</p>` : ''}
        </div>
        ${isPending ? `
            <div class="approval-actions">
                <textarea class="approval-comment" placeholder="Add a comment (optional)"></textarea>
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
    
    const comment = card.querySelector('.approval-comment')?.value || '';
    await handleApproval(requestId, 'Rejected', comment);
}

// Handle the approval/rejection process by sending request to server
async function handleApproval(requestId, status, comment) {
    try {
        const response = await fetch('../backend/update_approval_status.php', {
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
            showSuccess(`Request ${status.toLowerCase()} successfully`);
            fetchApprovalRequests(); 
        } else {
            showError(data.message || 'Failed to update request status');
        }
    } catch (error) {
        console.error('Error updating approval status:', error);
        showError('Error connecting to server');
    }
}

// Format date 
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Success toast notification
function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    showToast(toast);
}

// Error toast notification
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    showToast(toast);
}

// Display toast notifications
function showToast(toast) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    container.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
} 