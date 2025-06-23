document.addEventListener('DOMContentLoaded', function () {
  const vitals = JSON.parse(localStorage.getItem("resusVitals") || "{}");
  let hr = vitals.hr;

  document.getElementById('hr-value').textContent = hr;

  const ecgCanvas = document.getElementById('ecgChart');
  if (!ecgCanvas) {
      console.error('ECG canvas element not found!');
      return;
  }

  const ctxECG = ecgCanvas.getContext('2d');

  function getVitals() {
      const vitals = JSON.parse(localStorage.getItem("resusVitals") || "{}");
      return parseInt(vitals.hr ?? 80);
  }

  function generateEcgPattern(hr) {
      const pattern = [];
      if (hr === 0) return Array(500).fill(1);

      const waveLength = 50;
      const wavesPerDuration = (hr / 60) * 5;
      const totalPoints = Math.round(wavesPerDuration * waveLength);

      for (let i = 0; i < totalPoints; i++) {
          const phase = i % waveLength;
          let value = 0;
          if (phase === 15) value = 0.5;
          else if (phase === 20) value = -0.5;
          else if (phase === 21) value = 3.5;
          else if (phase === 22) value = -0.8;
          else if (phase === 30) value = 0.8;
          pattern.push(value);
      }

      return pattern;
  }

  const ecgChart = new Chart(ctxECG, {
      type: 'line',
      data: {
          labels: [],
          datasets: [
              {
                  label: 'ECG',
                  data: [],
                  borderColor: 'green',
                  borderWidth: 3,
                  tension: 0.5,
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
              x: { display: false, grid: { display: false }, ticks: { display: false } },
              y: { display: false, grid: { display: false }, ticks: { display: false }, suggestedMin: -2, suggestedMax: 4 }
          },
          plugins: {
              legend: { display: false },
              tooltip: { enabled: false }
          }
      }
  });

  function updateEcgGraph() {
      hr = getVitals();
      document.getElementById('hr-value').textContent = hr;

      const buffer = generateEcgPattern(hr);
      ecgChart.data.labels = Array.from({ length: buffer.length }, (_, i) => i);
      ecgChart.data.datasets[0].data = buffer;
      ecgChart.update();

      // Apply CSS animation class
      ecgCanvas.classList.remove('sweep-animation');
      void ecgCanvas.offsetWidth; // Re-trigger animation
      ecgCanvas.classList.add('sweep-animation');
  }

  updateEcgGraph();
  setInterval(updateEcgGraph, 5000);
});

    function goToPage(page) {
      const sessionId = localStorage.getItem("session_id");
    
      if (sessionId && sessionId.trim() !== "") {
        window.location.href = page;
      } else {
        alert("Create a new Session ID first.");
      }
    }



  (function () {
    const sessionId = localStorage.getItem("session_id");
    if (!sessionId || sessionId.trim() === "") {
      alert("Session ID not found. Redirecting to session creation page...");
      window.location.href = "/changeSessionID"; // Relative to domain
    }
  })();

