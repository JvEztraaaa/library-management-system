document.addEventListener('DOMContentLoaded', function() {
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
            console.log('Event clicked:', info.event);
            console.log('Event title:', info.event.title);
            console.log('Event start:', info.event.start);
            console.log('Event end:', info.event.end);
            console.log('Event extendedProps:', info.event.extendedProps);
            
            const modal = document.getElementById('eventDetailsModal');
            const modalTitle = document.getElementById('modalEventTitle');
            const modalDescription = document.getElementById('modalEventDescription');
            const modalDateTime = document.getElementById('modalEventDateTime');
            const modalLocation = document.getElementById('modalEventLocation');
            const modalType = document.getElementById('modalEventType');
            const deleteBtn = document.getElementById('deleteEventBtn');
            
            if (!modal || !modalTitle || !modalDescription || !modalDateTime || !modalLocation || !modalType || !deleteBtn) {
                console.error('Modal elements not found');
                return;
            }

            // Set event details
            modalTitle.textContent = info.event.title;
            modalDescription.textContent = info.event.extendedProps.description || 'No description available';
            
            // Format date and time
            const start = new Date(info.event.start);
            const end = new Date(info.event.end);
            const dateStr = start.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            const timeStr = start.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            modalDateTime.textContent = `${dateStr} at ${timeStr}`;
            
            modalLocation.textContent = info.event.extendedProps.location || 'No location specified';
            modalType.textContent = info.event.extendedProps.type || 'Other';
            modalType.className = 'event-type-badge ' + (info.event.extendedProps.type || 'other').toLowerCase().replace(/\s+/g, '-');

            // Set up delete button
            deleteBtn.onclick = function() {
                if (confirm('Are you sure you want to delete this event?')) {
                    deleteEvent(info.event.id);
                }
            };

            // Show modal
            modal.style.display = 'block';
        },
        eventDidMount: function(info) {
            console.log('Event mounted:', info.event);
            // Add tooltips to events
            info.el.title = info.event.title;
            
            // Add event type class
            if (info.event.extendedProps.type) {
                info.el.classList.add('event-type-' + 
                    info.event.extendedProps.type.toLowerCase().replace(/\s+/g, '-'));
            }
        }
    });
    calendar.render();

    // Close modal when clicking the close button or outside the modal
    var modal = document.getElementById('eventDetailsModal');
    var closeBtn = document.getElementsByClassName('event-modal-close')[0];
    
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        }
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    // Add Event Form Submission
    var addEventForm = document.getElementById('addEventForm');
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
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            })
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
                alert('Failed to add event: ' + (error.message || 'Please try again later.'));
            });
        });
    }

    // Delete event function
    function deleteEvent(eventId) {
        fetch('../backend/admin/admin_delete_calendar_event.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: eventId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove event from calendar
                const event = calendar.getEventById(eventId);
                if (event) {
                    event.remove();
                }
                // Close modal
                document.getElementById('eventDetailsModal').style.display = 'none';
                // Show success message
                alert('Event deleted successfully');
            } else {
                throw new Error(data.message || 'Failed to delete event');
            }
        })
        .catch(error => {
            console.error('Error deleting event:', error);
            alert('Failed to delete event: ' + error.message);
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

// Modal functions
function openAddEventModal() {
    var modal = document.getElementById('addEventModal');
    modal.style.display = 'block';
    // Set default date to today
    document.getElementById('eventDate').valueAsDate = new Date();
}

function closeAddEventModal() {
    var modal = document.getElementById('addEventModal');
    modal.style.display = 'none';
    document.getElementById('addEventForm').reset();
} 