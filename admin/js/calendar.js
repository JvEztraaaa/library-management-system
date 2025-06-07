document.addEventListener('DOMContentLoaded', function() {
    // Initialize FullCalendar
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: {
            url: '../backend/admin/admin_get_calendar_events.php',
            method: 'GET',
            failure: function(error) {
                console.error('Error loading events:', error);
                alert('Failed to load calendar events. Please try again later.');
            }
        },
        eventClick: function(info) {
            // Show event details in a modal
            var modal = document.getElementById('eventDetailsModal');
            var modalTitle = document.getElementById('modalEventTitle');
            var modalDescription = document.getElementById('modalEventDescription');
            var modalLocation = document.getElementById('modalEventLocation');
            var modalDateTime = document.getElementById('modalEventDateTime');
            var modalType = document.getElementById('modalEventType');

            modalTitle.textContent = info.event.title;
            modalDescription.textContent = info.event.extendedProps.description || 'No description available';
            modalLocation.textContent = info.event.extendedProps.location || 'No location specified';
            modalDateTime.textContent = formatEventTime(info.event.start, info.event.end);
            modalType.textContent = info.event.extendedProps.type || 'No type specified';

            modal.style.display = 'block';
        },
        eventDidMount: function(info) {
            // Add tooltips to events
            info.el.title = info.event.title;
        }
    });
    calendar.render();

    // Close modal when clicking the close button or outside the modal
    var modal = document.getElementById('eventDetailsModal');
    var closeBtn = document.getElementsByClassName('event-modal-close')[0];
    
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    // Add Event Modal Elements
    const addEventModal = document.getElementById('addEventModal');
    const addEventForm = document.getElementById('addEventForm');
    const addCloseBtn = document.querySelector('.close');

    // Open Modal Function
    window.openAddEventModal = function() {
        addEventModal.style.display = 'block';
        // Set default date to today
        document.getElementById('eventDate').valueAsDate = new Date();
    };

    // Close Modal Function
    window.closeAddEventModal = function() {
        addEventModal.style.display = 'none';
        addEventForm.reset();
    };

    // Close modal when clicking the close button
    if (addCloseBtn) {
        addCloseBtn.onclick = closeAddEventModal;
    }

    // Handle form submission
    if (addEventForm) {
        addEventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            var formData = new FormData(addEventForm);
            var eventData = {
                title: formData.get('title'),
                description: formData.get('description'),
                event_date: formData.get('date'),
                start_time: formData.get('start_time'),
                end_time: formData.get('end_time'),
                location: formData.get('location'),
                event_type: formData.get('event_type')
            };

            fetch('../backend/admin/admin_add_calendar_event.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    calendar.refetchEvents();
                    closeAddEventModal();
                    alert('Event added successfully!');
                } else {
                    alert('Error adding event: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to add event. Please try again later.');
            });
        });
    }
});

function formatEventTime(start, end) {
    var startDate = new Date(start);
    var endDate = new Date(end);
    
    var options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return startDate.toLocaleDateString(undefined, options) + ' - ' + 
           endDate.toLocaleDateString(undefined, options);
}

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