// Notification System
class NotificationSystem {
    constructor() {
        this.panel = null;
        this.badge = null;
        this.list = null;
        this.unreadCount = 0;
        this.isPanelOpen = false;
        this.init();
    }

    init() {
        // Create notification panel
        this.createNotificationPanel();
        
        // Add notification bell to header-right
        const headerRight = document.querySelector('.header-right .user-icons');
        if (headerRight) {
            // Check if notification bell already exists
            if (!document.querySelector('.notification-bell')) {
                const notificationBell = document.createElement('div');
                notificationBell.className = 'notification-bell';
                notificationBell.innerHTML = `
                    <i class="fas fa-bell"></i>
                    <span class="notification-badge" style="display: none;">0</span>
                `;
                
                // Replace the existing notification icon
                const existingBell = headerRight.querySelector('.notification');
                if (existingBell) {
                    existingBell.replaceWith(notificationBell);
                } else {
                    headerRight.appendChild(notificationBell);
                }
                
                // Add click event to bell
                notificationBell.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent event from bubbling up
                    this.togglePanel();
                });
                
                this.badge = notificationBell.querySelector('.notification-badge');
            }
        }
        
        // Add scroll event listener to close panel
        window.addEventListener('scroll', () => {
            if (this.isPanelOpen) {
                this.panel.classList.remove('show');
                this.isPanelOpen = false;
            }
        });
        
        // Check for notifications every 30 seconds
        this.checkNotifications();
        setInterval(() => this.checkNotifications(), 30000);
    }

    createNotificationPanel() {
        // Create panel element
        this.panel = document.createElement('div');
        this.panel.className = 'notification-panel';
        this.panel.innerHTML = `
            <div class="notification-header">
                <h3>Notifications</h3>
                <button class="mark-all-read">Mark all as read</button>
            </div>
            <ul class="notification-list"></ul>
        `;
        
        // Add panel to body
        document.body.appendChild(this.panel);
        
        // Get list element
        this.list = this.panel.querySelector('.notification-list');
        
        // Add click event to mark all as read button
        const markAllButton = this.panel.querySelector('.mark-all-read');
        markAllButton.addEventListener('click', () => this.markAllAsRead());
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.panel.contains(e.target) && 
                !e.target.closest('.notification-bell')) {
                this.panel.classList.remove('show');
                this.isPanelOpen = false;
            }
        });
    }

    async checkNotifications() {
        try {
            const response = await fetch('../backend/user_notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'operation=get_unread_count'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.unreadCount = data.count;
                this.updateBadge();
            }
        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }

    async loadNotifications() {
        try {
            const response = await fetch('../backend/user_notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'operation=get'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.renderNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    renderNotifications(notifications) {
        this.list.innerHTML = '';
        
        if (notifications.length === 0) {
            this.list.innerHTML = `
                <div class="empty-notifications">
                    No notifications yet
                </div>
            `;
            return;
        }
        
        notifications.forEach(notification => {
            const item = document.createElement('li');
            item.className = `notification-item ${notification.type} ${notification.is_read ? '' : 'unread'}`;
            
            item.innerHTML = `
                <div class="notification-content">
                    <p class="notification-message">${notification.message}</p>
                    <span class="notification-time">${this.formatTime(notification.created_at)}</span>
                </div>
            `;
            
            if (!notification.is_read) {
                item.addEventListener('click', () => this.markAsRead(notification.id));
            }
            
            this.list.appendChild(item);
        });
    }

    async markAsRead(notificationId) {
        try {
            const response = await fetch('../backend/user_notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `operation=mark_read&notification_id=${notificationId}`
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateBadge();
                this.loadNotifications();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            const response = await fetch('../backend/user_notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'operation=mark_all_read'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.unreadCount = 0;
                this.updateBadge();
                this.loadNotifications();
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }

    togglePanel() {
        this.isPanelOpen = !this.isPanelOpen;
        this.panel.classList.toggle('show');
        
        if (this.isPanelOpen) {
            this.loadNotifications();
        }
    }

    updateBadge() {
        if (this.badge) {
            if (this.unreadCount > 0) {
                this.badge.textContent = this.unreadCount;
                this.badge.style.display = 'flex';
            } else {
                this.badge.style.display = 'none';
            }
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }
        
        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
        
        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        
        // Less than 7 days
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
        
        // Otherwise show the date
        return date.toLocaleDateString();
    }
}

// Initialize notification system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NotificationSystem();
}); 