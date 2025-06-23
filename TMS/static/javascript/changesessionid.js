document.addEventListener("DOMContentLoaded", function () {


  
  const generateBtn = document.getElementById("generateBtn");
  const sessionIdInput = document.getElementById("sessionIdInput");
  const qrSection = document.getElementById("qrSection");
  const setBtn = document.getElementById("setBtn");

  // Load existing session if present
  const savedSessionId = localStorage.getItem("session_id");
    if (savedSessionId) {
        document.getElementById("currentSessionId").textContent = savedSessionId;
        // FIXED: Use relative path for QR code
        document.getElementById("qrCodeImage").src = `/static/qr_codes/${savedSessionId}.png`;
        qrSection.style.display = "block";
        startVitalsUpdate(savedSessionId);
    }

  // Generate new session ID
  generateBtn.addEventListener("click", () => {
    sessionIdInput.value = "";
    fetch("https://trainingmonitorapp.com/generate-id")
      .then(response => response.json())
      .then(data => {
        sessionIdInput.value = data.session_id;
        qrSection.style.display = "none";
      })
      .catch(error => {
        alert("Could not generate session ID");
        console.error("Error:", error);
      });
  });

  // Set session handler
  setBtn.addEventListener("click", async () => {
    const sessionId = sessionIdInput.value.trim();
    
    if (!/^[A-Za-z0-9]{6}$/.test(sessionId)) {
      alert("Invalid Session ID (6 alphanumeric characters required)");
      return;
    }

    try {
      // Check if session exists
      const response = await fetch("https://trainingmonitorapp.com/set_session", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          sessionId,
          ...getCurrentVitals()
        })
      });
      
      const data = await response.json();

      if (data.exists) {
        const joinSession = confirm("Session exists! Join existing session?");
        if (!joinSession) return;
        
        // Load existing session data
        const sessionData = await fetchSessionData(sessionId);
        if (sessionData) {
          updateLocalVitals(sessionData);
          alert("Joined existing session! Vitals loaded.");
        }
        return;
      }

      if (data.success) {
        localStorage.setItem("session_id", sessionId);
        updateSessionDisplay(sessionId);
        alert("New session created! Share the QR code with participants.");
    }
    } catch (error) {
        console.error("Session error:", error);
        alert("Session operation failed");
    }


    
  });

  // URL parameter session joining
const urlParams = new URLSearchParams(window.location.search);
const sessionParam = urlParams.get("session");
if (sessionParam) {
    handleUrlSession(sessionParam).catch(error => {
        console.error("Failed to handle URL session:", error);
    });
}

// Helper functions
function getCurrentVitals() {
    return {
        hr: parseInt(localStorage.getItem("hrSlider")) || 0,
        rr: parseInt(localStorage.getItem("rrSlider")) || 0,
        sbp: parseInt(localStorage.getItem("sbpSlider")) || 0,
        dbp: parseInt(localStorage.getItem("dbpSlider")) || 0,
        spo2: parseInt(localStorage.getItem("spo2Slider")) || 0,
        etco2: parseInt(localStorage.getItem("etco2Slider")) || 0
    };
}

async function fetchSessionData(sessionId) {
    try {
        // Fixed double slash in URL
        const response = await fetch(`https://trainingmonitorapp.com/get_session_data?sessionId=${encodeURIComponent(sessionId)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.success ? data : null;
    } catch (error) {
        console.error("Fetch session error:", error);
        return null;
    }
}

function updateLocalVitals(sessionData) {
    try {
        // Validate session data before storing
        if (!sessionData || !sessionData.session_id) {
            throw new Error("Invalid session data");
        }

        localStorage.setItem("session_id", sessionData.session_id);
        localStorage.setItem("hrSlider", sessionData.hr || 0);
        localStorage.setItem("rrSlider", sessionData.rr || 0);
        localStorage.setItem("sbpSlider", sessionData.sbp || 0);
        localStorage.setItem("dbpSlider", sessionData.dbp || 0);
        localStorage.setItem("spo2Slider", sessionData.spo2 || 0);
        localStorage.setItem("etco2Slider", sessionData.etco2 || 0);
        
        updateSessionDisplay(sessionData.session_id);
        window.location.reload(); // Refresh to apply new values
    } catch (error) {
        console.error("Error updating local vitals:", error);
        alert("Failed to update vitals. Please try again.");
    }
}

function updateSessionDisplay(sessionId) {
    try {
        if (!sessionId) {
            throw new Error("No session ID provided");
        }

        const currentSessionElement = document.getElementById("currentSessionId");
        const qrImageElement = document.getElementById("qrCodeImage");
        
        if (!currentSessionElement || !qrImageElement) {
            throw new Error("Required DOM elements not found");
        }

        currentSessionElement.textContent = sessionId;
        qrImageElement.src = `/static/qr_codes/${sessionId}.png`;
        qrImageElement.onerror = () => {
            console.warn("QR code image failed to load");
            qrImageElement.style.display = "none";
        };
        
        if (qrSection) {
            qrSection.style.display = "block";
        }
        
        startVitalsUpdate(sessionId);
    } catch (error) {
        console.error("Error updating session display:", error);
    }
}

async function handleUrlSession(sessionId) {
    try {
        if (!sessionId || !/^[A-Za-z0-9]{6}$/.test(sessionId)) {
            throw new Error("Invalid session ID format");
        }

        const sessionData = await fetchSessionData(sessionId);
        if (sessionData) {
            updateLocalVitals(sessionData);
            // Clean URL without reloading
            window.history.replaceState({}, document.title, window.location.pathname);
            return true;
        } else {
            console.warn("Session not found:", sessionId);
            alert("Session not found. Please check the session ID.");
            return false;
        }
    } catch (error) {
        console.error("URL session error:", error);
        alert(`Error joining session: ${error.message}`);
        return false;
    }
}
});

