const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const plotBtn = document.getElementById('plotBtn');
const input = document.getElementById('equationInput');
const exampleBtns = document.querySelectorAll('.example-btn');
const themeCheckbox = document.getElementById('themeCheckbox');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const X_MIN = -10;
const X_MAX = 10;
const Y_MIN = -10;
const Y_MAX = 10;

let isDarkMode = false;

themeCheckbox.addEventListener('change', () => {
  isDarkMode = themeCheckbox.checked;
  document.body.classList.toggle('dark-mode', isDarkMode);
  redraw();
});

function toPixelX(x) {
  return ((x - X_MIN) / (X_MAX - X_MIN)) * WIDTH;
}

function toPixelY(y) {
  return HEIGHT - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * HEIGHT;
}

function clearCanvas() {
  ctx.fillStyle = '#000510';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawGrid() {
  ctx.strokeStyle = '#0d0d0d';
  ctx.lineWidth = 1;
  
  for (let x = Math.ceil(X_MIN); x <= X_MAX; x++) {
    const px = toPixelX(x);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, HEIGHT);
    ctx.stroke();
  }
  
  for (let y = Math.ceil(Y_MIN); y <= Y_MAX; y++) {
    const py = toPixelY(y);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(WIDTH, py);
    ctx.stroke();
  }
}

function drawAxes() {
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2;
  
  const yAxisPx = toPixelY(0);
  ctx.beginPath();
  ctx.moveTo(0, yAxisPx);
  ctx.lineTo(WIDTH, yAxisPx);
  ctx.stroke();
  
  const xAxisPx = toPixelX(0);
  ctx.beginPath();
  ctx.moveTo(xAxisPx, 0);
  ctx.lineTo(xAxisPx, HEIGHT);
  ctx.stroke();
  
  // Labels
  ctx.fillStyle = '#333333';
  ctx.font = '11px Space Grotesk';
  ctx.textAlign = 'center';
  
  for (let x = Math.ceil(X_MIN); x <= X_MAX; x++) {
    if (x === 0) continue;
    const px = toPixelX(x);
    ctx.fillText(x, px, yAxisPx + 18);
  }
  
  ctx.textAlign = 'right';
  for (let y = Math.ceil(Y_MIN); y <= Y_MAX; y++) {
    if (y === 0) continue;
    const py = toPixelY(y);
    ctx.fillText(y, xAxisPx - 10, py + 4);
  }
}

function plotFunction(expr) {
  try {
    const compiled = math.compile(expr);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    let firstPoint = true;
    let lastValidY = null;
    
    for (let px = 0; px < WIDTH; px++) {
      const x = X_MIN + (px / WIDTH) * (X_MAX - X_MIN);
      let y;
      
      try {
        y = compiled.evaluate({ x });
        
        if (!isFinite(y)) {
          lastValidY = null;
          continue;
        }
        
        const py = toPixelY(y);
        
        if (py < -1000 || py > HEIGHT + 1000) {
          lastValidY = null;
          continue;
        }
        
        if (firstPoint || lastValidY === null) {
          ctx.moveTo(px, py);
          firstPoint = false;
        } else {
          ctx.lineTo(px, py);
        }
        
        lastValidY = y;
      } catch (e) {
        lastValidY = null;
        continue;
      }
    }
    
    ctx.stroke();
  } catch (e) {
    alert('Invalid equation');
  }
}

function redraw() {
  clearCanvas();
  drawGrid();
  drawAxes();
  if (input.value.trim()) {
    plotFunction(input.value);
  }
}

// Événements
plotBtn.addEventListener('click', redraw);

input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    redraw();
  }
});

exampleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    input.value = btn.dataset.eq;
    redraw();
  });
});

// Tracé initial
redraw();