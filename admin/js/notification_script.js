// Fetch notifications from the server and display them
async function fetchNotifications() {
  const container = document.querySelector('.notification-box');
  container.setAttribute('aria-busy', 'true');
  container.innerHTML = '<p class="loading">Loading notifications...</p>';

  try {
    // Fetch notifications from the server
    const response = await fetch('../backend/get_notification.php', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    // Handle authentication errors
    if (!response.ok) {
      if (response.status === 403) {
        if (data.error === 'User not logged in') {
          window.location.href = '../login-page/login.html';
          return;
        } else if (data.error === 'User is not admin') {
          container.innerHTML = '<p class="error-message">Access denied. Admin privileges required.</p>';
          return;
        }
      }
      throw new Error(data.error || `Server returned ${response.status}`);
    }

    // Handle empty notifications
    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = '<p class="empty">No notifications to show.</p>';
      container.setAttribute('aria-busy', 'false');
      return;
    }

    // Clear container and create notification cards
    container.innerHTML = '';
    data.forEach(n => {
      const card = document.createElement('article');
      card.className = 'notification-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', `Notification: ${n.message}`);
      card.setAttribute('data-status', n.type.toLowerCase());

      // Make card clickable if it's a pending request
      if (n.type.toLowerCase() === 'pending') {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          window.location.href = 'book_approvals.html';
        });
      }

      // Create notification header with title and student name
      const header = document.createElement('div');
      header.className = 'notification-header';

      const title = document.createElement('h3');
      title.className = 'notification-title';
      title.textContent = n.book_title || 'Book Request';

      // Create student info container
      const studentInfo = document.createElement('div');
      studentInfo.className = 'student-info';

      const student = document.createElement('span');
      student.className = 'notification-student';
      student.textContent = n.student_name || 'Unknown';

      // Add action type indicator
      const actionType = document.createElement('span');
      actionType.className = 'action-type';
      switch(n.type.toLowerCase()) {
          case 'returned':
              actionType.textContent = 'Returned';
              actionType.classList.add('action-return');
              break;
          case 'overdue':
              actionType.textContent = 'Overdue';
              actionType.classList.add('action-overdue');
              break;
          case 'pending':
              actionType.textContent = 'Wants to borrow';
              actionType.classList.add('action-pending');
              break;
          default:
              actionType.textContent = n.type;
      }

      studentInfo.appendChild(student);
      studentInfo.appendChild(actionType);

      // Add status indicator
      const status = document.createElement('span');
      status.className = `notification-status status-${n.type.toLowerCase()}`;
      status.textContent = n.type || 'pending';

      header.appendChild(title);
      header.appendChild(studentInfo);
      header.appendChild(status);

      // Create notification message
      const message = document.createElement('p');
      message.className = 'notification-message';
      message.textContent = n.message || 'No message content';

      // Create timestamp
      const timestamp = document.createElement('time');
      timestamp.className = 'notification-timestamp';
      timestamp.dateTime = n.timestamp || '';
      timestamp.textContent = formatDate(n.timestamp);

      // Assemble notification card
      card.appendChild(header);
      card.appendChild(message);
      card.appendChild(timestamp);

      container.appendChild(card);
    });

    container.setAttribute('aria-busy', 'false');
  } catch (error) {
    console.error('Error fetching notifications:', error);
    container.innerHTML = `<p class="error-message">Error loading notifications: ${error.message}</p>`;
    container.setAttribute('aria-busy', 'false');
  }
}

// Format date 
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date)) return '';
  return date.toLocaleString(undefined, {
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  });
}

// Initialize notifications on page load
document.addEventListener('DOMContentLoaded', () => {
  fetchNotifications();
});

// Auto refresh notifications every 30 seconds
setInterval(fetchNotifications, 30000);

