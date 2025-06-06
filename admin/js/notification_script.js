async function fetchNotifications() {
  const container = document.querySelector('.notification-box');
  container.setAttribute('aria-busy', 'true');
  container.innerHTML = '<p class="loading">Loading notifications...</p>';

  try {
    const response = await fetch('../backend/get_notification.php', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error messages
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

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = '<p class="empty">No notifications to show.</p>';
      container.setAttribute('aria-busy', 'false');
      return;
    }

    // Clear container
    container.innerHTML = '';

    // Create notification cards
    data.forEach(n => {
      const card = document.createElement('article');
      card.className = 'notification-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', `Notification: ${n.message}`);

      // Header with title and student name
      const header = document.createElement('div');
      header.className = 'notification-header';

      const title = document.createElement('h3');
      title.className = 'notification-title';
      title.textContent = n.book_title || 'Book Borrowed';

      const student = document.createElement('span');
      student.className = 'notification-student';
      student.textContent = n.student_name || 'Unknown';

      // Add status indicator
      const status = document.createElement('span');
      status.className = `notification-status status-${n.type}`;
      status.textContent = n.type || 'borrowed';

      header.appendChild(title);
      header.appendChild(student);
      header.appendChild(status);

      // Message
      const message = document.createElement('p');
      message.className = 'notification-message';
      message.textContent = n.message || 'No message content';

      // Timestamp
      const timestamp = document.createElement('time');
      timestamp.className = 'notification-timestamp';
      timestamp.dateTime = n.timestamp || '';
      timestamp.textContent = formatDate(n.timestamp);

      // Compose card
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

// Initial fetch on page load
document.addEventListener('DOMContentLoaded', () => {
  fetchNotifications();
});

// Auto refresh every 30 seconds for new notifications
setInterval(fetchNotifications, 30000);

