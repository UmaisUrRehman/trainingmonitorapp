document.addEventListener('DOMContentLoaded', function () {

// Retrieve saved vitals
const vitals = JSON.parse(localStorage.getItem("resusVitals") || "{}");

const rr = parseInt(vitals.rr ?? 16);         // Use 16 if vitals.rr is null/undefined
const etco2 = parseFloat(vitals.etco2 ?? 38); // Use 38 if vitals.etco2 is null/undefined

// Update span display values
document.getElementById('rr-value').textContent = rr;
document.getElementById('etco2-value').textContent = etco2.toFixed(1);

// Get canvas context
const etco2Canvas = document.getElementById('etco2Chart');
const ctxETCO2 = etco2Canvas.getContext('2d');


  // =============================================================================================
  // ETCO2 waveform generator
  // =============================================================================================

  function generateEtco2Pattern(etco2, rr) {
    const pattern = [];
    

    const baseline = 5;
    const plateau = etco2;
    const pointsPerBreath = 10;
    const durationSeconds = 5;

    if (etco2 === 0 || rr === 0) return Array(100).fill(25); // flatline when zero

    const breathsPerDuration = (rr / 60) * durationSeconds;
    const totalPoints = Math.round(breathsPerDuration * pointsPerBreath);

    for (let i = 0; i < totalPoints; i++) {
      const phase = i % pointsPerBreath;
      switch (phase) {
        case 0:
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

  // =============================================================================================
  // Chart.js setup
  // =============================================================================================

  const waveform = generateEtco2Pattern(etco2, rr);

  const etco2Chart = new Chart(ctxETCO2, {
    type: 'line',
    data: {
      labels: Array.from({ length: waveform.length }, (_, i) => i),
      datasets: [{
        label: 'ETCO2',
        data: waveform,
        borderColor: 'white',
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
        x: {
          display: false,
          grid: { display: false }
        },
        y: {
          display: false,
          grid: { display: false },
          Min: 0,
          Max: 50,
          beginAtZero: true
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });

});
