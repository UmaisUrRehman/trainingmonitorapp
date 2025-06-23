document.addEventListener('DOMContentLoaded', function () {
  const vitals = JSON.parse(localStorage.getItem("resusVitals") || "{}");

  let hr = parseInt(vitals.hr ?? 80);
  let rr = parseInt(vitals.rr ?? 0);
  let spo2 = parseFloat(vitals.spo2 ?? 0);
  let sbp = parseInt(vitals.sbp ?? 120);
  let dbp = parseInt(vitals.dbp ?? 80);
  let etco2 = parseFloat(vitals.etco2 ?? 0);
  
  document.getElementById('hr-value').textContent = hr;
  document.getElementById('rr-value').textContent = rr;
  document.getElementById('spo2-value').textContent = spo2;
  document.getElementById('bp-value').textContent = `${sbp} / ${dbp}`;
  document.getElementById('etco2-value').textContent = parseFloat(etco2).toFixed(1);
  
  const bpCanvas = document.getElementById('bpChart');
  const bpValueEl = document.getElementById('bp-value');
  
  if (!bpCanvas || !bpValueEl) {
    console.error('BP canvas or value element not found!');
    return;
  }
  
  const ctxBP = bpCanvas.getContext('2d');
  
  const bpDurationSeconds = 5;
  
  function getVitals() {
    const vitals = JSON.parse(localStorage.getItem("resusVitals") || "{}");
    return {
      hr: parseInt(vitals.hr ?? 80),
      rr: parseInt(vitals.rr ?? 0),
      spo2: parseFloat(vitals.spo2 ?? 0),
      sbp: parseInt(vitals.sbp ?? 120),
      dbp: parseInt(vitals.dbp ?? 80),
      etco2: parseFloat(vitals.etco2 ?? 0),
    };
  }
  

  function generateBPPattern(hr, sbp, dbp) {
    const pattern = [];
    if (hr === 0 || sbp === 0 || dbp === 0) return Array(bpDurationSeconds * 10).fill(100);

    const peak = 100;
    const base = 10;
    const wavesPerDuration = (hr / 60) * bpDurationSeconds;
    const waveLength = 10;
    const totalPoints = Math.round(wavesPerDuration * waveLength);

    for (let i = 0; i < totalPoints; i++) {
      const phase = i % waveLength;
      switch (phase) {
        case 0: pattern.push(base + 40); break;
        case 1: case 2: pattern.push(base + 5); break;
        case 3: pattern.push(peak + 35); break;
        case 4: pattern.push(peak + 20); break;
        case 5:
          pattern.push(peak - 20);
          pattern.push(peak - 10);
          pattern.push(peak - 20);
          break;
        case 6: pattern.push(base + 60); break;
        default: break;
      }
    }

    return pattern;
  }

  const bpChart = new Chart(ctxBP, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Blood Pressure',
        data: [],
        borderColor: 'red',
        borderWidth: 3,
        tension: 0.3,
        fill: false,
        pointRadius: 0
      }]
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

  // Initial render using current vitals
  const vitalsData = getVitals();
  const initialPattern = generateBPPattern(vitalsData.hr, vitalsData.sbp, vitalsData.dbp);

  bpChart.data.labels = Array.from({ length: initialPattern.length }, (_, i) => i);
  bpChart.data.datasets[0].data = initialPattern;
  bpChart.update();

});
