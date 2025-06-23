// Redirect user to session creation page if no session ID is found
(function checkSession() {
  const sessionId = localStorage.getItem("session_id");
  if (!sessionId || sessionId.trim() === "") {
    alert("Session ID not found. Redirecting to session creation page...");
    window.location.href = "/changeSessionID"; // Relative path for Flask
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const defaultVitals = {
    hrSlider: 80,
    rrSlider: 16,
    spo2Slider: 98,
    sbpSlider: 120,
    dbpSlider: 80,
    etco2Slider: 16,
  };

  const sliderMap = [
    { id: "hrSlider", className: "new-hr" },
    { id: "rrSlider", className: "new-rr" },
    { id: "spo2Slider", className: "new-spo2" },
    { id: "sbpSlider", className: "new-sbp" },
    { id: "dbpSlider", className: "new-dbp" },
    { id: "etco2Slider", className: "new-etco2" },
  ];

  const vitalsToSend = {};
  let isFirstTimeSetup = false;

  sliderMap.forEach(({ id, className }) => {
    const slider = document.getElementById(id);
    const span = slider.nextElementSibling;
    const newValueCell = document.querySelector(`.${className}`);

    let storedValue = localStorage.getItem(id);
    if (storedValue === null) {
      storedValue = defaultVitals[id];
      localStorage.setItem(id, storedValue);
      isFirstTimeSetup = true;
    }

    slider.value = storedValue;
    span.textContent = storedValue;
    newValueCell.textContent = storedValue;

    const key = id.replace("Slider", "");
    vitalsToSend[key] = parseInt(storedValue);

    slider.addEventListener("input", () => {
      span.textContent = slider.value;
      newValueCell.textContent = slider.value;
    });
  });

  updateDashboardVitals();

  if (isFirstTimeSetup) {
    const sessionId = localStorage.getItem("session_id");
    if (sessionId) {
      sendVitalsToBackend(sessionId, vitalsToSend);
    }
  }
});

function updateDashboardVitals() {
  const hr = localStorage.getItem("hrSlider");
  const rr = localStorage.getItem("rrSlider");
  const spo2 = localStorage.getItem("spo2Slider");
  const sbp = localStorage.getItem("sbpSlider");
  const dbp = localStorage.getItem("dbpSlider");
  const etco2 = localStorage.getItem("etco2Slider");

  document.getElementById("hr-value").textContent = hr;
  document.getElementById("rr-value").textContent = rr;
  document.getElementById("spo2-value").textContent = spo2;
  document.getElementById("sbp-value").textContent = sbp;
  document.getElementById("dbp-value").textContent = dbp;
  document.getElementById("etco2-value").textContent = etco2;
}

function onRhythmChange() {
  const selected = document.getElementById("rhythmTemplate").value;
  const funcName = "set" + selected;
  const func = window[funcName];
  if (typeof func === "function") {
    func();
  } else {
    console.warn("No function found for:", funcName);
  }
}

function setAllVitals(hr, rr, spo2, sbp, dbp, etco2) {
  updateSlider("hrSlider", hr);
  updateSlider("rrSlider", rr);
  updateSlider("spo2Slider", spo2);
  updateSlider("sbpSlider", sbp);
  updateSlider("dbpSlider", dbp);
  updateSlider("etco2Slider", etco2);
}

function updateSlider(sliderId, value) {
  const slider = document.getElementById(sliderId);
  if (slider) {
    slider.value = value;
    localStorage.setItem(sliderId, value);

    const valueSpan = slider.nextElementSibling;
    if (valueSpan && valueSpan.classList.contains('resus-slider-value')) {
      valueSpan.textContent = value;
    }

    const dataId = sliderId.replace('Slider', '');
    const newValueCell = document.querySelector(`.new-${dataId}`);
    if (newValueCell) {
      newValueCell.textContent = value;
    }
  }
}

// Example heart rhythm setter functions
function setSinus() { setAllVitals(72, 16, 98, 120, 80, 38); }
function setWideQRS() { setAllVitals(85, 18, 96, 130, 82, 36); }
function setSTElevation() { setAllVitals(105, 22, 93, 95, 60, 30); }
function setSTDepression() { setAllVitals(95, 20, 95, 125, 78, 30); }
function setSVT() { setAllVitals(180, 28, 94, 100, 60, 33); }
function setAFib() { setAllVitals(130, 26, 94, 115, 75, 32); }
function setAFlutter() { setAllVitals(150, 24, 95, 110, 70, 34); }
function setVTach() { setAllVitals(160, 30, 92, 85, 55, 33); }
function setFirstDegree() { setAllVitals(70, 14, 98, 120, 78, 28); }
function setMobitz1() { setAllVitals(60, 14, 97, 115, 75, 37); }
function setMobitz2() { setAllVitals(40, 12, 94, 90, 60, 35); }
function setCompleteBlock() { setAllVitals(35, 10, 92, 85, 55, 30); }
function setPaceNoCapture() { setAllVitals(70, 8, 97, 120, 75, 28); }
function setPaceWithCapture() { setAllVitals(72, 16, 98, 122, 78, 36); }
function setAsystole() { setAllVitals(0, 0, 0, 0, 0, 37); }
function setPEA() { setAllVitals(60, 6, 0, 95, 55, 10); }
function setPVT() { setAllVitals(180, 0, 0, 0, 0, 8); }
function setVFib() { setAllVitals(0, 0, 0, 0, 0, 7); }
function setCustom() {} // Manual customization

function applySettings() {
  const sliders = ["hrSlider", "rrSlider", "spo2Slider", "sbpSlider", "dbpSlider", "etco2Slider"];
  const vitals = {};

  sliders.forEach(id => {
    const slider = document.getElementById(id);
    if (slider) {
      const value = slider.value;
      localStorage.setItem(id, value);
      const dataId = id.replace("Slider", "");
      vitals[dataId] = parseInt(value);

      const currentValueCell = document.querySelector(`.current-${dataId}`);
      if (currentValueCell) {
        currentValueCell.textContent = value;
      }
    }
  });

  localStorage.setItem("resusVitals", JSON.stringify(vitals));

  const sessionId = localStorage.getItem("session_id");

  if (!sessionId) {
    alert("No session ID found. Please create or set one first.");
    return;
  }

  sendVitalsToBackend(sessionId, vitals);
}

function sendVitalsToBackend(sessionId, vitals) {
  fetch("https://trainingmonitorapp.com/update_vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, ...vitals }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log("Vitals updated.");
        updateDashboardVitals();
      } else {
        alert("Failed to update vitals: " + (data.message || ""));
      }
    })
    .catch(error => {
      console.error("Error sending vitals:", error);
    });
}

function resetToDefault() {
  setAllVitals(80, 16, 98, 120, 80, 38);

  const templateSelect = document.getElementById("rhythmTemplate");
  if (templateSelect) {
    templateSelect.value = "Sinus";
  }
}

document.getElementById("applyBtn").addEventListener("click", applySettings);
document.getElementById("resetBtn").addEventListener("click", resetToDefault);
