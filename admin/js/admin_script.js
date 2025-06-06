const ctx = document.getElementById("bookCategoryChart").getContext("2d");
const engagementCtx = document.getElementById('engagementChart').getContext('2d');

const bookCategoryChart = new Chart(ctx, {
  type: "pie",
  data: {
    labels: ["Fiction", "Science", "History", "Technology", "Biography"],
    datasets: [
      {
        label: "Popular Book Categories",
        data: [40, 25, 15, 10, 10],
        backgroundColor: [
          "#4e73df",
          "#1cc88a",
          "#36b9cc",
          "#f6c23e",
          "#e74a3b",
        ],
        borderColor: "#000",
        borderWidth: 1,
      },
    ],
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        display: false, // Hide default legend
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.label}: ${context.raw}%`;
          },
        },
      },
    },
  },
});





new Chart(engagementCtx, {
  type: 'line',
  data: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        label: 'Total Students',
        data: [100, 120, 130, 140, 150, 160],
        borderColor: '#4e73df',
        backgroundColor: 'rgba(78, 115, 223, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Borrowed Books',
        data: [30, 45, 40, 50, 60, 70],
        borderColor: '#1cc88a',
        backgroundColor: 'rgba(28, 200, 138, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Returned Books',
        data: [10, 25, 20, 30, 35, 45],
        borderColor: '#e74a3b',
        backgroundColor: 'rgba(231, 74, 59, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
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
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'white'
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
