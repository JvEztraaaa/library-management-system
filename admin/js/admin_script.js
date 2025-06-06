// Fetch real-time data from the server
async function fetchDashboardData() {
    try {
        const response = await fetch('../backend/get_admin_stats.php');
        const data = await response.json();
        
        if (data.success) {
            updateDashboardStats(data.stats);
            updateActivityLog(data.stats.activity_log);
            updateEngagementChart(data.stats.engagement_data);
            updateCategoryChart(data.stats.category_stats);
        } else {
            console.error('Failed to fetch dashboard data:', data.error);
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    document.querySelector('.div1 .stat-value p').textContent = stats.total_in;
    document.querySelector('.div2 .stat-value p').textContent = stats.total_out;
    document.querySelector('.div3 .stat-value p').textContent = stats.total_students;
    document.querySelector('.div4 .stat-value p').textContent = stats.total_borrowed;
}

// Update activity log
function updateActivityLog(activities) {
    const activityLog = document.getElementById('activity-log');
    activityLog.innerHTML = activities.map(activity => {
        const time = new Date(activity.time).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        return `<li><strong>${activity.student_name}</strong> ${activity.action} "${activity.book_title}" at ${time}</li>`;
    }).join('');
}

// Update engagement chart
function updateEngagementChart(engagementData) {
    const dates = engagementData.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const totalStudents = engagementData.map(d => d.total_students);
    const borrowedBooks = engagementData.map(d => d.borrowed_books);
    const overdueBooks = engagementData.map(d => d.overdue_books);

    engagementChart.data.labels = dates;
    engagementChart.data.datasets[0].data = totalStudents;
    engagementChart.data.datasets[1].data = borrowedBooks;
    engagementChart.data.datasets[2].data = overdueBooks;
    engagementChart.update();
}

// Update category chart
function updateCategoryChart(categoryStats) {
    console.log('Category Stats:', categoryStats); // Debug log
    
    const labels = categoryStats.map(cat => cat.genre);
    const data = categoryStats.map(cat => cat.count);

    // Update chart
    bookCategoryChart.data.labels = labels;
    bookCategoryChart.data.datasets[0].data = data;
    bookCategoryChart.update();

    // Update legend
    const legendContainer = document.getElementById('categoryLegend');
    const colors = [
        "#4e73df",  // Blue
        "#1cc88a",  // Green
        "#36b9cc",  // Cyan
        "#f6c23e",  // Yellow
        "#e74a3b",  // Red
    ];

    // Clear existing legend
    legendContainer.innerHTML = '';

    // Add new legend items
    categoryStats.forEach((stat, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span style="background:${colors[index % colors.length]}"></span>${stat.genre}`;
        legendContainer.appendChild(li);
    });
}

// Initialize charts
const ctx = document.getElementById("bookCategoryChart").getContext("2d");
const engagementCtx = document.getElementById('engagementChart').getContext('2d');

// Create pie chart for book categories
const bookCategoryChart = new Chart(ctx, {
    type: "pie",
    data: {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: [
                "#4e73df",  // Blue
                "#1cc88a",  // Green
                "#36b9cc",  // Cyan
                "#f6c23e",  // Yellow
                "#e74a3b",  // Red
            ],
            borderColor: "#000",
            borderWidth: 1,
        }],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.label}: ${context.raw} books`;
                    },
                },
            },
        },
    },
});

// Create line chart for student engagement
const engagementChart = new Chart(engagementCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Active Students',
                data: [],
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.1)',
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: true
            },
            {
                label: 'Borrowed Books',
                data: [],
                borderColor: '#1cc88a',
                backgroundColor: 'rgba(28, 200, 138, 0.1)',
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: true
            },
            {
                label: 'Overdue Books',
                data: [],
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8
            }
        ]
    },
    options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: 'white',
                    padding: 15,
                    boxWidth: 12,
                    font: {
                        size: 14
                    }
                }
            },
            tooltip: {
                backgroundColor: '#222',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#444',
                borderWidth: 1,
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.raw}`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: 'white',
                    maxRotation: 0
                },
                grid: {
                    color: '#333'
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: 'white'
                },
                grid: {
                    color: '#333'
                }
            }
        }
    }
});

// Fetch initial data and set up refresh interval
fetchDashboardData();
setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
