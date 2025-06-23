
// ? Helper to update session ID and QR
function updateSessionDisplay(sessionId) {
  const span = document.getElementById("currentSessionId");
  if (span) span.textContent = sessionId;

  const qr = document.getElementById("qrCodeImage");
  if (qr) qr.src = `/static/qr_codes/${sessionId}.png`;
}

// ? Optional: fetch vitals from Flask
async function fetchSessionData(sessionId) {
  try {
    const res = await fetch(`https://trainingmonitorapp.com/session-data/${sessionId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("Fetching session data failed:", e);
    return null;
  }
}

// ? Update localStorage vitals
function updateLocalVitals(data) {
  localStorage.setItem("resusVitals", JSON.stringify(data));
}

// ? Main function triggered on button click
async function getstarted() {
  try {
    const generateRes = await fetch("https://trainingmonitorapp.com/generate-id");
    if (!generateRes.ok) throw new Error("Generate failed");

    const generateData = await generateRes.json();
    const sessionId = generateData.session_id;

    if (!/^[A-Z0-9]{6}$/.test(sessionId)) {
      alert("Invalid session ID generated.");
      return;
    }

    const setRes = await fetch("https://trainingmonitorapp.com/set_session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });

    const setData = await setRes.json();

    if (setData.exists) {
      const join = confirm("Session already exists. Join it?");
      if (!join) return;

      const sessionData = await fetchSessionData(sessionId);
      if (sessionData) {
        updateLocalVitals(sessionData);
        alert("Joined existing session. Vitals loaded.");
      }

      href="{{ url_for('display_monitor') }}"
      return;
    }

    if (setData.success) {
      localStorage.setItem("session_id", sessionId);
      updateSessionDisplay(sessionId);

      const qrSection = document.getElementById("qrSection");
      if (qrSection) qrSection.style.display = "block";

      alert("New session created and saved.");
      window.location.href = "/displayMonitor";  
    } else {
      alert("Session creation failed.");
    }
  } catch (error) {
    console.error("Session error:", error);
    alert("An error occurred while starting the session:\n" + error.message);
  }
}


  document.addEventListener("DOMContentLoaded", function () {
    const sessionId = localStorage.getItem("session_id");

    const div1 = document.getElementById("div1");
    const div2 = document.getElementById("div2");

    if (sessionId && /^[A-Za-z0-9]{6}$/.test(sessionId)) {
      // Session ID exists
      div1.style.display = "block";
      div2.style.display = "none";
    } else {
      // No valid session ID
      div1.style.display = "none";
      div2.style.display = "block";
    }
  });
