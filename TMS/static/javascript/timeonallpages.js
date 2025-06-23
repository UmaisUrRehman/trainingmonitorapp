// Function to update the current time in the navbar
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('current-time').textContent = timeString;
  }

  // Update time every second
  setInterval(updateTime, 1000);
  updateTime(); // Initial call to set time immediately


  function goToPage(page) {
    const sessionId = localStorage.getItem("session_id");
  
    if (sessionId && sessionId.trim() !== "") {
      window.location.href = page;
    } else {
      alert("Create a new Session ID first.");
    }
  }
