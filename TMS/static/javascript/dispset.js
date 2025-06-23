
  const popup = document.getElementById('display-settings-popup');
  const openBtn = document.querySelector('.right-button');
  const closeBtn = document.querySelector('.close-popup');
  const increaseBtn = document.getElementById('increase-size');
  const decreaseBtn = document.getElementById('decrease-size');
  const chartWrappers = document.querySelectorAll('.chart-wrapper');
  const dashboard = document.querySelector('.dashboard'); // NEW: select dashboard

  let scaleFactor = 1;

  openBtn.addEventListener('click', () => {
    popup.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => {
    popup.classList.add('hidden');
  });

  increaseBtn.addEventListener('click', () => {
    scaleFactor = Math.min(scaleFactor + 0.1, 2);
    updateChartSize();
  });

  decreaseBtn.addEventListener('click', () => {
    scaleFactor = Math.max(scaleFactor - 0.1, 0.5);
    updateChartSize();
  });

  function updateChartSize() {
    chartWrappers.forEach(wrapper => {
      wrapper.style.transform = `scale(${scaleFactor})`;
      wrapper.style.transformOrigin = 'top';
    });

    // NEW: scale dashboard as well
    dashboard.style.transform = `scale(${scaleFactor})`;
    dashboard.style.transformOrigin = 'top';
  }


  // Graph toggle logic
// Graph and Value Toggles
const toggleControls = [
  { 
    id: 'toggle-ecg-graph', 
    selector: '.vital-box.ecg .chart-wrapper',
    defaultVisible: true
  },
  { 
    id: 'toggle-ecg-value', 
    selector: '.vital-box.ecg .vital-value',
    defaultVisible: true
  },
  { 
    id: 'toggle-spo2-graph', 
    selector: '.vital-box.spo2 .chart-wrapper',
    defaultVisible: true
  },
  { 
    id: 'toggle-spo2-value', 
    selector: '.vital-box.spo2 .vital-value',
    defaultVisible: true
  },
  { 
    id: 'toggle-bp-graph', 
    selector: '.vital-box.bp .chart-wrapper',
    defaultVisible: true
  },
  { 
    id: 'toggle-bp-value', 
    selector: '.vital-box.bp .vital-value',
    defaultVisible: true
  },
  { 
    id: 'toggle-etco2-graph', 
    selector: '.vital-box.vital-box-etco2 .chart-wrapper',
    defaultVisible: true
  },
  { 
    id: 'toggle-etco2-value', 
    selector: '.vital-box.vital-box-etco2 .vital-value',
    defaultVisible: true
  }
];

toggleControls.forEach(({ id, selector, defaultVisible }) => {
  const button = document.getElementById(id);
  const element = document.querySelector(selector);

  if (button && element) {
    // Initialize state
    let visible = defaultVisible;
    button.style.backgroundColor = visible ? '#388e3c' : '#d32f2f';
    element.classList.toggle('hidden', !visible);

    button.addEventListener('click', () => {
      visible = !visible;
      element.classList.toggle('hidden', !visible);
      button.style.backgroundColor = visible ? '#388e3c' : '#d32f2f';
    });
  }
});

// QR SECTION HIDE/DISPLAY
const qrSection = document.getElementById("qrSection");
const toggleBtn = document.querySelector(".left-button");
qrSection.style.display === "none"
toggleBtn.addEventListener("click", () => {
  if (qrSection.style.display === "none" || qrSection.style.display === "") {
    qrSection.style.display = "block";
  } else {
    qrSection.style.display = "none";
  }
});