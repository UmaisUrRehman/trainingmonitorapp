//Main Function



// Redirect user to session creation page if no session ID is found





document.addEventListener('DOMContentLoaded', function () {


  
// ===================================================================================================
// Load saved vitals from localStorage
// ===================================================================================================
    const vitals = JSON.parse(localStorage.getItem("resusVitals") || "{}");
    let hr = vitals.hr;
    let rr = vitals.rr;
    let spo2 = vitals.spo2;
    let sbp = vitals.sbp;
    let dbp = vitals.dbp;
    let etco2 = vitals.etco2;
  
    // Set span values on the dashboard
    document.getElementById('hr-value').textContent = hr;
    document.getElementById('rr-value').textContent = rr;
    document.getElementById('spo2-value').textContent = spo2;
    document.getElementById('bp-value').textContent = `${sbp} / ${dbp}`;
    document.getElementById('etco2-value').textContent = parseFloat(etco2).toFixed(1);



  
// ==========================================================================================
// ECG Chart (based on BPM)
// ==========================================================================================

// Get references to the canvas and value display element
const ecgCanvas = document.getElementById('ecgChart');

// Ensure the required elements exist
if (!ecgCanvas) {
  console.error('ECG canvas element not found!');
} else {
  const ctxECG = ecgCanvas.getContext('2d');

  // Initialize default vitals
  let currentHR = 80;

  // Buffers hold current and next waveform values
  let currentEcgBuffer = [];
  let nextEcgBuffer = [];

  // Transition control
  let ecgTransitionPosition = 0;
  let ecgStartTime = null;
  let ecgFirstLoad = true;

  const ecgDurationSeconds = 5; // ECG display for 5s
  const ecgTransitionGap = 5;   // Sweep width in pixels

  // Read vitals from localStorage
  function getVitals() {
    const vitals = JSON.parse(localStorage.getItem("resusVitals") || "{}");
    return {
      hr: parseInt(vitals.hr) || 80,
      rr: parseInt(vitals.rr) || 16,
      spo2: parseFloat(vitals.spo2) || 98,
      sbp: parseInt(vitals.sbp) || 120,
      dbp: parseInt(vitals.dbp) || 80,
      etco2: parseFloat(vitals.etco2) || 38,
    };
  }

  // Generate a simulated ECG waveform pattern based on HR
  function generateEcgPattern(hr) {
    const pattern = [];
    if (hr === 0) return Array(ecgDurationSeconds * 10).fill(0);

    const waveLength = 50; // 50 points per cardiac cycle for better resolution
    const wavesPerDuration = (hr / 60) * ecgDurationSeconds;
    const totalPoints = Math.round(wavesPerDuration * waveLength);

    for (let i = 0; i < totalPoints; i++) {
      const phase = i % waveLength;

      // Simple simulated ECG: P-QRS-T waveform shape
      let value = 0;
      if (phase === 5) value = 0.5;              // P wave
      else if (phase === 20) value = -1.2;       // Q wave
      else if (phase === 21) value = 3;          // R wave (sharp peak)
      else if (phase === 22) value = -0.8;       // S wave
      else if (phase === 35) value = 0.5;        // T wave
      pattern.push(value);
    }

    return pattern;
  }

  // Initialize the Chart.js line graph for ECG
  const ecgChart = new Chart(ctxECG, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Current ECG',
          data: [],
          borderColor: 'red',
          borderWidth: 2,
          tension: 0.5,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Next ECG',
          data: [],
          borderColor: 'Green',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          display: false,
          grid: { display: false },
          ticks: { display: false }
        },
        y: {
          display: false,
          grid: { display: false },
          ticks: { display: false },
          suggestedMin: -2,
          suggestedMax: 4
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });

  // Animation function to sweep new ECG waveform into view
  function animateEcgTransition(timestamp) {
    if (!ecgStartTime) ecgStartTime = timestamp;

    const duration = 5000;
    const elapsed = timestamp - ecgStartTime;
    const progress = Math.min(elapsed / duration, 1);

    const chartWidth = ecgCanvas.width;
    const pixelsPerDataPoint = chartWidth / currentEcgBuffer.length;
    const gapPoints = Math.round(ecgTransitionGap / pixelsPerDataPoint);

    const transitionIndex = Math.floor(progress * currentEcgBuffer.length);

    const currentData = [];
    const nextData = [];

    for (let i = 0; i < currentEcgBuffer.length; i++) {
      currentData.push(i > transitionIndex ? currentEcgBuffer[i] : NaN);
      nextData.push(i < transitionIndex - gapPoints ? nextEcgBuffer[i] : NaN);
    }

    ecgChart.data.labels = Array.from({ length: currentEcgBuffer.length }, (_, i) => i);
    ecgChart.data.datasets[0].data = currentData;
    ecgChart.data.datasets[1].data = nextData;
    ecgChart.update('none');

    if (progress < 1) {
      requestAnimationFrame(animateEcgTransition);
    } else {
      currentEcgBuffer = [...nextEcgBuffer];
      ecgChart.data.datasets[0].data = [...currentEcgBuffer];
      ecgChart.data.datasets[1].data = Array(currentEcgBuffer.length).fill(NaN);
      ecgChart.update('none');
      ecgStartTime = null;
    }
  }

  // Update ECG waveform every 5s
  function updateEcgGraph() {
    const vitals = getVitals();
    currentHR = vitals.hr;
    document.getElementById('hr-value').textContent = currentHR;

    nextEcgBuffer = generateEcgPattern(currentHR);

    ecgTransitionPosition = 0;
    ecgStartTime = null;

    if (ecgFirstLoad) {
      currentEcgBuffer = [...nextEcgBuffer];
      ecgChart.data.labels = Array.from({ length: currentEcgBuffer.length }, (_, i) => i);
      ecgChart.data.datasets[0].data = [...currentEcgBuffer];
      ecgChart.data.datasets[1].data = Array(currentEcgBuffer.length).fill(NaN);
      ecgChart.update();
      ecgFirstLoad = false;
    } else {
      requestAnimationFrame(animateEcgTransition);
    }
  }

  // Initial draw and repeat every 5s
  updateEcgGraph();
  setInterval(updateEcgGraph, 5000);
}

// ===========================================================================================
// SpO2 chart
// ===========================================================================================

// Get references to the canvas and value display element
const spo2Canvas = document.getElementById('spo2Chart');
const spo2ValueEl = document.getElementById('spo2-value');

// Ensure the required elements exist
if (!spo2Canvas || !spo2ValueEl) {
  console.error('SpO₂ canvas or value element not found!');
} else {
  const ctxSPO = spo2Canvas.getContext('2d');

  // Initialize default vitals
  let currentSpo2 = 98;
  let currentHR = 80;

  // Buffers hold current and next waveform values
  let currentBuffer = [];
  let nextBuffer = [];

  // Transition control
  let transitionPosition = 0;
  let startTime = null;
  let firstLoad = true;

  const durationSeconds = 5;     // Duration of one full waveform in seconds
  const transitionGap = 5;       // Sweep width in pixels

  // Read vitals from localStorage with fallback values
  function getVitals() {
    const vitals = JSON.parse(localStorage.getItem("resusVitals") || "{}");
    return {
      hr: parseInt(vitals.hr) || 80,
      rr: parseInt(vitals.rr) || 16,
      spo2: parseFloat(vitals.spo2) || 98,
      sbp: parseInt(vitals.sbp) || 120,
      dbp: parseInt(vitals.dbp) || 80,
      etco2: parseFloat(vitals.etco2) || 38,
    };
  }

  // Generate a stylized waveform pattern for SpO₂ based on HR and SpO₂
  function generateSpo2Pattern(spo2, hr) {
    const pattern = [];
    if (spo2 === 0 || hr === 0) return Array(durationSeconds * 10).fill(0);
  
    // Waveform parameters
    const peak = 100;          // Top of the pulse wave
    const baseline = 94;       // Bottom baseline between pulses
    const notchDip = 2;        // Depth of dicrotic notch
  
    const wavesPerDuration = (hr / 60) * durationSeconds;
    const waveLength = 10;     // 10 points per cardiac cycle
    const totalPoints = Math.round(wavesPerDuration * waveLength);
  
    for (let i = 0; i < totalPoints; i++) {
      const phase = i % 10;    // 10-point cardiac cycle
  
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

  // Initialize the Chart.js line graph
  const spo2Chart = new Chart(ctxSPO, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Current',
          data: [],
          borderColor: 'yellow',
          borderWidth: 3,
          tension: 0.4,           // Smooth curve
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Next',
          data: [],
          borderColor: 'yellow',
          borderWidth: 3,
          tension: 0.4,
          fill: false,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          display: false,
          grid: { display: false },
          ticks: { display: false }
        },
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

  // Animation function to sweep the new waveform into view
  function animateSpo2Transition(timestamp) {
    if (!startTime) startTime = timestamp;

    const duration = 5000; // Transition over 5s
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1); // 0 to 1

    const chartWidth = spo2Canvas.width;
    const pixelsPerDataPoint = chartWidth / currentBuffer.length;
    const gapPoints = Math.round(transitionGap / pixelsPerDataPoint); // Convert pixel gap to points

    const transitionIndex = Math.floor(progress * currentBuffer.length); // Index being transitioned

    const currentData = [];
    const nextData = [];

    // Draw NaNs to create sweep gap between old and new waveforms
    for (let i = 0; i < currentBuffer.length; i++) {
      currentData.push(i > transitionIndex ? currentBuffer[i] : NaN);
      nextData.push(i < transitionIndex - gapPoints ? nextBuffer[i] : NaN);
    }

    // Set chart data
    spo2Chart.data.labels = Array.from({ length: currentBuffer.length }, (_, i) => i);
    spo2Chart.data.datasets[0].data = currentData;
    spo2Chart.data.datasets[1].data = nextData;
    spo2Chart.update('none');

    // Continue animation
    if (progress < 1) {
      requestAnimationFrame(animateSpo2Transition);
    } else {
      // Transition done → shift nextBuffer to currentBuffer
      currentBuffer = [...nextBuffer];
      spo2Chart.data.datasets[0].data = [...currentBuffer];
      spo2Chart.data.datasets[1].data = Array(currentBuffer.length).fill(NaN);
      spo2Chart.update('none');
      startTime = null;
    }
  }

  // Update waveform and display every 5s
  function updateSpo2Graph() {
    const vitals = getVitals();
    currentHR = vitals.hr;
    currentSpo2 = vitals.spo2;
    spo2ValueEl.textContent = currentSpo2;

    // Generate next waveform shape
    nextBuffer = generateSpo2Pattern(currentSpo2, currentHR);

    transitionPosition = 0;
    startTime = null;

    if (firstLoad) {
      currentBuffer = [...nextBuffer];
      spo2Chart.data.labels = Array.from({ length: currentBuffer.length }, (_, i) => i);
      spo2Chart.data.datasets[0].data = [...currentBuffer];
      spo2Chart.data.datasets[1].data = Array(currentBuffer.length).fill(NaN);
      spo2Chart.update();
      firstLoad = false;
    } else {
      requestAnimationFrame(animateSpo2Transition);
    }
  }

  // Initial draw and update every 5s
  updateSpo2Graph();
  setInterval(updateSpo2Graph, 5000);
}


//==========================================================================================
// Blood Pressure Chart
// =========================================================================================




const bpCanvas = document.getElementById('bpChart');
const bpValueEl = document.getElementById('bp-value');

if (!bpCanvas || !bpValueEl) {
  console.error('BP canvas or value element not found!');
} else {
  const ctxBP = bpCanvas.getContext('2d');

  let currentHR = 80;
  let currentSBP = 120;
  let currentDBP = 80;

  let currentBPBuffer = [];
  let nextBPBuffer = [];

  let bpStartTime = null;
  let bpFirstLoad = true;

  const bpDurationSeconds = 5;
  const bpTransitionGap = 5;

  function getVitals() {
    const vitals = JSON.parse(localStorage.getItem("resusVitals") || "{}");
    return {
      hr: parseInt(vitals.hr) || 80,
      rr: parseInt(vitals.rr) || 16,
      spo2: parseFloat(vitals.spo2) || 98,
      sbp: parseInt(vitals.sbp) || 120,
      dbp: parseInt(vitals.dbp) || 80,
      etco2: parseFloat(vitals.etco2) || 38,
    };
  }

  function generateBPPattern(hr, sbp, dbp) {
    const pattern = [];
    if (hr === 0 || sbp === 0 || dbp === 0) return Array(bpDurationSeconds * 10).fill(0);

    const peak = 100;
    const base = 10;
    const wavesPerDuration = (hr / 60) * bpDurationSeconds;
    const waveLength = 10;
    const totalPoints = Math.round(wavesPerDuration * waveLength);

    for (let i = 0; i < totalPoints; i++) {
      const phase = i % waveLength;

      switch (phase) {
        case 0: 
          pattern.push(base + 40); 
          break;                    
        case 1: 
          pattern.push(base + 5); 
          break;               
        case 2: 
          pattern.push(base + 5); 
          break;                   
        case 3: 
          pattern.push(peak + 35); 
          break;               
        case 4:
           pattern.push(peak + 20); 
           break;              
        case 5: 
          pattern.push(peak - 20);  
          pattern.push(peak - 10);  
          pattern.push(peak - 20);

          break;               
        case 6:
          pattern.push(base + 60);
      
          break;
        case 7: 
          
          break;
        case 8: 
           
          break;
        case 9: 
          
          break;                   
      }
    }

    return pattern;
  }

  const bpChart = new Chart(ctxBP, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Current',
          data: [],
          borderColor: 'red',
          borderWidth: 3,
          tension: 0.3,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Next',
          data: [],
          borderColor: 'red',
          borderWidth: 3,
          tension: 0.3,
          fill: false,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          display: false,
          grid: { display: false },
          ticks: { display: false }
        },
        y: {
          display: false,
          grid: { display: false },
          ticks: { display: false },
          suggestedMin: 50,
          suggestedMax: 150,
          beginAtZero: false
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });

  function animateBPTransition(timestamp) {
    if (!bpStartTime) bpStartTime = timestamp;

    const duration = 5000;
    const elapsed = timestamp - bpStartTime;
    const progress = Math.min(elapsed / duration, 1);

    const chartWidth = bpCanvas.width;
    const pixelsPerDataPoint = chartWidth / currentBPBuffer.length;
    const gapPoints = Math.round(bpTransitionGap / pixelsPerDataPoint);

    const transitionIndex = Math.floor(progress * currentBPBuffer.length);

    const currentData = [];
    const nextData = [];

    for (let i = 0; i < currentBPBuffer.length; i++) {
      currentData.push(i > transitionIndex ? currentBPBuffer[i] : NaN);
      nextData.push(i < transitionIndex - gapPoints ? nextBPBuffer[i] : NaN);
    }

    bpChart.data.labels = Array.from({ length: currentBPBuffer.length }, (_, i) => i);
    bpChart.data.datasets[0].data = currentData;
    bpChart.data.datasets[1].data = nextData;
    bpChart.update('none');

    if (progress < 1) {
      requestAnimationFrame(animateBPTransition);
    } else {
      currentBPBuffer = [...nextBPBuffer];
      bpChart.data.datasets[0].data = [...currentBPBuffer];
      bpChart.data.datasets[1].data = Array(currentBPBuffer.length).fill(NaN);
      bpChart.update('none');
      bpStartTime = null;
    }
  }

  function updateBPGraph() {
    const vitals = getVitals();
    currentHR = vitals.hr;
    currentSBP = vitals.sbp;
    currentDBP = vitals.dbp;
    bpValueEl.textContent = `${currentSBP} / ${currentDBP}`;

    nextBPBuffer = generateBPPattern(currentHR, currentSBP, currentDBP);

    if (bpFirstLoad) {
      currentBPBuffer = [...nextBPBuffer];
      bpChart.data.labels = Array.from({ length: currentBPBuffer.length }, (_, i) => i);
      bpChart.data.datasets[0].data = [...currentBPBuffer];
      bpChart.data.datasets[1].data = Array(currentBPBuffer.length).fill(NaN);
      bpChart.update();
      bpFirstLoad = false;
    } else {
      requestAnimationFrame(animateBPTransition);
    }
  }

  updateBPGraph();
  setInterval(updateBPGraph, 5000);
}


// =============================================================================================
// Combined RR & ETCO₂ Chart
// =============================================================================================
// Get references to the canvas and value display element
const etco2Canvas = document.getElementById('etco2Chart');
const etco2ValueEl = document.getElementById('etco2-value');

// Ensure the required elements exist
if (!etco2Canvas || !etco2ValueEl) {
  console.error('ETCO₂ canvas or value element not found!');
} else {
  const ctxETCO2 = etco2Canvas.getContext('2d');

  // Initialize default vitals
  let currentEtco2 = 38;
  let currentRR = 16;

  // Buffers hold current and next waveform values
  let currentBuffer = [];
  let nextBuffer = [];

  // Transition control
  let startTime = null;
  let firstLoad = true;

  const durationSeconds = 5;     // Duration of one full waveform in seconds
  const transitionGap = 5;       // Sweep width in pixels

  // Read vitals from localStorage with fallback values
  function getVitals() {
    const vitals = JSON.parse(localStorage.getItem("resusVitals") || "{}");
    return {
      hr: parseInt(vitals.hr) || 80,
      rr: parseInt(vitals.rr) || 16,
      spo2: parseFloat(vitals.spo2) || 98,
      sbp: parseInt(vitals.sbp) || 120,
      dbp: parseInt(vitals.dbp) || 80,
      etco2: parseFloat(vitals.etco2) || 38,
    };
  }

  // Generate ETCO₂ waveform pattern based on RR
  function generateEtco2Pattern(etco2, rr) {
    const pattern = [];
    if (etco2 === 0 || rr === 0) return Array(durationSeconds * 10).fill(0);
  
    const baseline = 5;
    const plateau = etco2;
    const pointsPerBreath = 10;
    const breathsPerDuration = (rr / 60) * durationSeconds;
    const totalPoints = Math.round(breathsPerDuration * pointsPerBreath);
  
    for (let i = 0; i < totalPoints; i++) {
      const phase = i % pointsPerBreath;
  
      switch (phase) {
        case 0: // start of inspiration — sharp rise
          pattern.push(baseline) ;
          break;
        case 1:
          pattern.push(plateau);
          break;
        case 2:
          pattern.push(plateau + 4);
          break;
        case 3:
        case 4:
        case 5:
          pattern.push(plateau + 5); // flat plateau
          break;
        case 6:
          pattern.push(baseline); // start sharp fall
          break;
        case 7:
          pattern.push(baseline); // continue sharp fall
          break;
        case 8:
          pattern.push(baseline); // back near baseline
          break;
        case 9:
        default:

          break;
      }
    }
  
    return pattern;
  }
  

  // Initialize the Chart.js line graph
  const etco2Chart = new Chart(ctxETCO2, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Current',
          data: [],
          borderColor: 'white',
          borderWidth: 3,
          tension: 0.4,           // Smooth curve
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Next',
          data: [],
          borderColor: 'white',
          borderWidth: 3,
          tension: 0.4,
          fill: false,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          display: false,
          grid: { display: false },
          ticks: { display: false }
        },
        y: {
          display: false,
          grid: { display: false },
          ticks: { display: false },
          suggestedMin: 0,
          suggestedMax: 50,
          beginAtZero: true
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });

  // Animation function to sweep the new waveform into view
  function animateEtco2Transition(timestamp) {
    if (!startTime) startTime = timestamp;

    const duration = 5000; // Transition over 5s
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1); // 0 to 1

    const chartWidth = etco2Canvas.width;
    const pixelsPerDataPoint = chartWidth / currentBuffer.length;
    const gapPoints = Math.round(transitionGap / pixelsPerDataPoint);

    const transitionIndex = Math.floor(progress * currentBuffer.length);

    const currentData = [];
    const nextData = [];

    for (let i = 0; i < currentBuffer.length; i++) {
      currentData.push(i > transitionIndex ? currentBuffer[i] : NaN);
      nextData.push(i < transitionIndex - gapPoints ? nextBuffer[i] : NaN);
    }

    etco2Chart.data.labels = Array.from({ length: currentBuffer.length }, (_, i) => i);
    etco2Chart.data.datasets[0].data = currentData;
    etco2Chart.data.datasets[1].data = nextData;
    etco2Chart.update('none');

    if (progress < 1) {
      requestAnimationFrame(animateEtco2Transition);
    } else {
      currentBuffer = [...nextBuffer];
      etco2Chart.data.datasets[0].data = [...currentBuffer];
      etco2Chart.data.datasets[1].data = Array(currentBuffer.length).fill(NaN);
      etco2Chart.update('none');
      startTime = null;
    }
  }

  // Update waveform and display every 5s
  function updateEtco2Graph() {
    const vitals = getVitals();
    currentRR = vitals.rr;
    currentEtco2 = vitals.etco2;
    etco2ValueEl.textContent = parseFloat(currentEtco2).toFixed(1);

    // Generate next waveform shape
    nextBuffer = generateEtco2Pattern(currentEtco2, currentRR);

    transitionPosition = 0;
    startTime = null;

    if (firstLoad) {
      currentBuffer = [...nextBuffer];
      etco2Chart.data.labels = Array.from({ length: currentBuffer.length }, (_, i) => i);
      etco2Chart.data.datasets[0].data = [...currentBuffer];
      etco2Chart.data.datasets[1].data = Array(currentBuffer.length).fill(NaN);
      etco2Chart.update();
      firstLoad = false;
    } else {
      requestAnimationFrame(animateEtco2Transition);
    }
  }

  // Initial draw and update every 5s
  updateEtco2Graph();
  setInterval(updateEtco2Graph, 5000);
}

    });