// Unified Toast System
const ToastSystem = {
    container: null,
    
    init() {
        // Check if container already exists in the DOM
        this.container = document.querySelector('.toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
        return this.container;
    },
    
    show(message, type = 'success') {
        const container = this.init();
        
        // Remove any existing toasts
        const existingToasts = container.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode === container) {
                    container.removeChild(toast);
                }
            }, 300); // Wait for fade-out animation to complete
        });
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
                <div class="message">
                    <span class="text text-1">${type === 'success' ? 'Success' : 'Error'}</span>
                    <span class="text text-2">${message}</span>
                </div>
            </div>
            <i class="fas fa-times close"></i>
            <div class="progress"></div>
        `;
        
        container.appendChild(toast);
        
        // Add click event to close button
        const closeBtn = toast.querySelector('.close');
        closeBtn.onclick = () => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode === container) {
                    container.removeChild(toast);
                }
            }, 300); // Wait for fade-out animation to complete
        };
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode === container) {
                    container.removeChild(toast);
                }
            }, 300); // Wait for fade-out animation to complete
        }, 5000);
    },
    
    success(message) {
        this.show(message, 'success');
    },
    
    error(message) {
        this.show(message, 'error');
    }
};

// Global function to show toast
function showToast(message, type = 'success') {
    ToastSystem[type](message);
} 