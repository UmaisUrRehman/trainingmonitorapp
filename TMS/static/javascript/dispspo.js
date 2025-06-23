document.addEventListener('DOMContentLoaded', () => {

  const spo2Canvas = document.getElementById('spo2Chart');
  const spo2ValueEl = document.getElementById('spo2-value');

  const ctxSPO = spo2Canvas.getContext('2d');

  // Read vitals from localStorage with fallback values
  function getVitals() {
    const vitals = JSON.parse(localStorage.getItem("resusVitals") || "{}");
  
    const safeParseInt = (value, fallback) => {
      const parsed = parseInt(value);
      return isNaN(parsed) ? fallback : parsed;
    };
  
    const safeParseFloat = (value, fallback) => {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? fallback : parsed;
    };
  
    return {
      hr: safeParseInt(vitals.hr, 80),
      rr: safeParseInt(vitals.rr, 0),
      spo2: safeParseFloat(vitals.spo2, 98),
      sbp: safeParseInt(vitals.sbp, 0),
      dbp: safeParseInt(vitals.dbp, 0),
      etco2: safeParseFloat(vitals.etco2, 0),
    };
  }
  

  // Generate waveform pattern based on HR and SpO2
  function generateSpo2Pattern(spo2, hr) {
    const pattern = [];
    if (spo2 === 0 || hr === 0) return Array(50).fill(98); // flat line

    const peak = 100;
    const baseline = 94;
    const notchDip = 2;

    const durationSeconds = 5;
    const wavesPerDuration = (hr / 60) * durationSeconds;
    const waveLength = 10;     // points per cycle
    const totalPoints = Math.round(wavesPerDuration * waveLength);

    for (let i = 0; i < totalPoints; i++) {
      const phase = i % 10;

      switch (phase) {
        // ----- CARDIAC CYCLE POINTS -----
        case 0:  // Start of cycle (baseline)
          pattern.push(baseline);
          break;
        case 1:  // Rapid upstroke (anacrotic limb)
        case 2:  // Peak systolic
          pattern.push(baseline - notchDip);
          break;
        case 3:  // Early diastolic plateau
          pattern.push(peak + 4);
          break;
        case 4:  // Dicrotic notch (valve closure)
        case 5:  // Catacrotic limb (gradual decline)
        case 6:  
          pattern.push();
          break;  
        case 7:
          pattern.push(baseline + 5);
          break;
        case 8:
          pattern.push(baseline + 4);
          break;
        case 9:
          pattern.push(peak - 3);
          break;
        case 10:
          
        default: // Return to baseline (late diastole)
      }
    }

    return pattern;
  }

  // Initialize Chart.js
  const spo2Chart = new Chart(ctxSPO, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'SpO2',
        data: [],
        borderColor: 'yellow',
        borderWidth: 3,
        tension: 0.4,
        fill: false,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: { display: false, grid: { display: false }, ticks: { display: false } },
        y: { 
          display: false, 
          grid: { display: false }, 
          ticks: { display: false }, 
          suggestedMin: 90, 
          suggestedMax: 105, 
          beginAtZero: false 
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });

  // Update the graph data once based on current vitals (no animation)
  function updateSpo2Graph() {
    const vitals = getVitals();
    const currentHR = vitals.hr;
    const currentSpo2 = vitals.spo2;
    spo2ValueEl.textContent = currentSpo2;

    const waveform = generateSpo2Pattern(currentSpo2, currentHR);
    spo2Chart.data.labels = waveform.map((_, i) => i);
    spo2Chart.data.datasets[0].data = waveform;
    spo2Chart.update();
  }

  // Initial draw and update every 5 seconds (no animation)
  updateSpo2Graph();
  setInterval(updateSpo2Graph, 5000);

});
