function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  document.getElementById("clock").textContent = timeString;
}

setInterval(updateClock, 1000);
updateClock();
