function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  document.getElementById("clock").textContent = timeString;
}

// Function to update library stats
async function updateLibraryStats() {
  try {
    const response = await fetch('backend/get_stats.php');
    const data = await response.json();
    
    if (data.success) {
      const stats = data.stats;
      document.querySelector('.info-box p:nth-child(2)').textContent = `Total Students: ${stats.total_students}`;
      document.querySelector('.info-box p:nth-child(3)').textContent = `Male: ${stats.male}`;
      document.querySelector('.info-box p:nth-child(4)').textContent = `Female: ${stats.female}`;
      document.querySelector('.info-box p:nth-child(5)').textContent = `Staff on Duty: ${stats.staff_on_duty}`;
    }
  } catch (error) {
    console.error('Error fetching library stats:', error);
  }
}

// Function to show status indicator
function showStatusIndicator(status) {
  // Remove existing indicator if any
  const existingIndicator = document.querySelector('.status-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  // Create new indicator
  const indicator = document.createElement('div');
  indicator.className = 'status-indicator';
  indicator.textContent = status;
  indicator.style.color = status === 'IN' ? '#4CAF50' : '#f44336';
  
  // Add to DOM
  const container = document.querySelector('.container');
  container.appendChild(indicator);

  // Add animation class
  setTimeout(() => {
    indicator.classList.add('show');
  }, 10);

  // Start continuous stats update if status is IN
  let statsInterval;
  if (status === 'IN') {
    statsInterval = setInterval(updateLibraryStats, 1000); // Update every second
  }

  // Remove after 3 seconds
  setTimeout(() => {
    indicator.classList.remove('show');
    if (statsInterval) {
      clearInterval(statsInterval); // Stop continuous updates
    }
    setTimeout(() => {
      indicator.remove();
    }, 500);
  }, 3000);
}

// Function to check student number
async function checkStudentNumber(studentNumber) {
  try {
    const formData = new FormData();
    formData.append('student_number', studentNumber);

    const response = await fetch('backend/check_student.php', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    const studentHint = document.querySelector('.student-hint');
    
    if (data.success) {
      // Show IN/OUT indicator based on user's last status
      showStatusIndicator(data.user.last_status || 'IN');
      
      studentHint.textContent = `Welcome, ${data.user.name}!`;
      studentHint.style.color = 'green';
      
      // Initial stats update
      updateLibraryStats();
      
      // Clear the input
      document.querySelector('.student-number').value = '';
      
      // Reset the hint after 3 seconds
      setTimeout(() => {
        studentHint.textContent = 'Enter your Student Number';
        studentHint.style.color = '';
      }, 3000);
    } else {
      studentHint.textContent = data.message;
      studentHint.style.color = 'red';
    }
  } catch (error) {
    console.error('Error checking student number:', error);
  }
}

// Function to handle student number input
function handleStudentNumberInput() {
  const studentNumberInput = document.querySelector('.student-number');
  const studentHint = document.querySelector('.student-hint');
  
  studentNumberInput.addEventListener('input', function(e) {
    const value = e.target.value;
    
    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      e.target.value = value.replace(/[^\d]/g, '');
    }
    
    // Update hint based on input length
    if (value.length === 5) {
      studentHint.textContent = 'Press Enter to continue';
      studentHint.style.color = 'blue';
    } else if (value.length > 0) {
      studentHint.textContent = 'Student number must be 5 digits';
      studentHint.style.color = 'red';
    } else {
      studentHint.textContent = 'Enter your Student Number';
      studentHint.style.color = '';
    }
  });

  // Handle Enter key press
  studentNumberInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const value = e.target.value;
      if (value.length === 5) {
        checkStudentNumber(value);
      } else {
        studentHint.textContent = 'Please enter a valid 5-digit student number';
        studentHint.style.color = 'red';
      }
    }
  });
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
  setInterval(updateClock, 1000);
  updateClock();
  updateLibraryStats();
  handleStudentNumberInput();
  
  // Update stats every 30 seconds
  setInterval(updateLibraryStats, 30000);

  // Check for logout success message
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('logout') && urlParams.get('logout') === 'success') {
      showToast('You have been successfully logged out.', 'success');
      // Remove the query parameter from the URL
      history.replaceState({}, document.title, window.location.pathname);
  }
});
