document.addEventListener('DOMContentLoaded', function() {
    // Initialize FullCalendar
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listMonth'
        },
        events: '../backend/get_calendar_events.php',
        eventContent: function(arg) {
            return {
                html: `<div class="fc-event-title">${arg.event.title}</div>`
            };
        },
        eventClick: function(info) {
            const event = info.event;
            const startDate = event.start ? new Date(event.start) : null;
            const endDate = event.end ? new Date(event.end) : null;
            
            const formatTime = (date) => {
                if (!date) return 'N/A';
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            };

            const formatDate = (date) => {
                if (!date) return 'N/A';
                return date.toLocaleDateString();
            };

            // Update modal content
            document.getElementById('modalEventTitle').textContent = event.title || 'N/A';
            document.getElementById('modalEventDescription').textContent = event.extendedProps?.description || 'No description available';
            document.getElementById('modalEventDateTime').textContent = `${formatDate(startDate)} ${formatTime(startDate)} - ${formatTime(endDate)}`;
            document.getElementById('modalEventLocation').textContent = event.extendedProps?.location || 'N/A';
            
            const eventTypeElement = document.getElementById('modalEventType');
            eventTypeElement.textContent = event.extendedProps?.event_type || 'Other';
            eventTypeElement.className = 'event-type-badge event-type-' + 
                (event.extendedProps?.event_type || 'other').toLowerCase().replace(/\s+/g, '-');

            // Show modal
            const modal = document.getElementById('eventDetailsModal');
            modal.style.display = 'block';
            setTimeout(() => modal.classList.add('show'), 10);
        },
        eventDidMount: function(info) {
            // Add event type class for styling
            const eventType = info.event.extendedProps?.event_type;
            if (eventType) {
                info.el.classList.add('event-type-' + eventType.toLowerCase().replace(/\s+/g, '-'));
            }
        },
        eventSourceFailure: function(error) {
            console.error('Error loading events:', error);
            showToast('Error loading calendar events', 'error');
        }
    });
    calendar.render();

    // Event Details Modal
    const eventModal = document.getElementById('eventDetailsModal');
    const eventModalClose = eventModal.querySelector('.event-modal-close');
    
    eventModalClose.onclick = function() {
        eventModal.classList.remove('show');
        setTimeout(() => eventModal.style.display = 'none', 300);
    };

    window.onclick = function(event) {
        if (event.target === eventModal) {
            eventModal.classList.remove('show');
            setTimeout(() => eventModal.style.display = 'none', 300);
        }
    };

    // Add Event Modal Elements
    const modal = document.getElementById('addEventModal');
    const addEventForm = document.getElementById('addEventForm');
    const closeBtn = document.querySelector('.close');

    // Open Modal Function
    window.openAddEventModal = function() {
        modal.style.display = 'block';
        // Set default date to today
        document.getElementById('eventDate').valueAsDate = new Date();
    };

    // Close Modal Function
    window.closeAddEventModal = function() {
        modal.style.display = 'none';
        addEventForm.reset();
    };

    // Close modal when clicking the close button
    if (closeBtn) {
        closeBtn.onclick = closeAddEventModal;
    }

    // Handle form submission
    if (addEventForm) {
        addEventForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = {
                title: document.getElementById('eventTitle').value,
                description: document.getElementById('eventDescription').value,
                date: document.getElementById('eventDate').value,
                start_time: document.getElementById('startTime').value,
                end_time: document.getElementById('endTime').value,
                location: document.getElementById('eventLocation').value,
                event_type: document.getElementById('eventType').value
            };

            // Send data to backend
            fetch('../backend/add_calendar_event.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success message
                    showToast('Event added successfully!', 'success');
                    // Close modal and refresh calendar
                    closeAddEventModal();
                    calendar.refetchEvents();
                } else {
                    // Show error message
                    showToast(data.message || 'Error adding event', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('Error adding event', 'error');
            });
        });
    }
});

// Toast notification function
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    // Add toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    toastContainer.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
} 