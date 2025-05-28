const ctx = document.getElementById("bookCategoryChart").getContext("2d");
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
