const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const plotBtn = document.getElementById('plotBtn');
const gradientBtn = document.getElementById('gradientBtn');
const resetBtn = document.getElementById('resetBtn');
const input = document.getElementById('equationInput');
const exampleBtns = document.querySelectorAll('.example-btn');
const themeCheckbox = document.getElementById('themeCheckbox');
const learningRateInput = document.getElementById('learningRate');
const lrValue = document.getElementById('lrValue');
const animSpeedInput = document.getElementById('animSpeed');
const speedValue = document.getElementById('speedValue');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const zoomResetBtn = document.getElementById('zoomReset');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
let X_MIN = -10;
let X_MAX = 10;
let Y_MIN = -10;
let Y_MAX = 10;

const DEFAULT_X_MIN = -10;
const DEFAULT_X_MAX = 10;
const DEFAULT_Y_MIN = -10;
const DEFAULT_Y_MAX = 10;

let isDarkMode = false;
let currentFunction = null;
let gradientPath = [];
let isAnimating = false;
let animationInterval = null;
let startPoint = null;

// Mise à jour des valeurs affichées
learningRateInput.addEventListener('input', (e) => {
  lrValue.textContent = e.target.value;
});

animSpeedInput.addEventListener('input', (e) => {
  speedValue.textContent = e.target.value + 'ms';
});

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

function toMathX(px) {
  return X_MIN + (px / WIDTH) * (X_MAX - X_MIN);
}

function toMathY(py) {
  return Y_MAX - (py / HEIGHT) * (Y_MAX - Y_MIN);
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
    currentFunction = math.compile(expr);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    let firstPoint = true;
    let lastValidY = null;
    
    for (let px = 0; px < WIDTH; px++) {
      const x = X_MIN + (px / WIDTH) * (X_MAX - X_MIN);
      let y;
      
      try {
        y = currentFunction.evaluate({ x });
        
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
    currentFunction = null;
  }
}

// Calcul de la dérivée numérique
function derivative(func, x, h = 0.0001) {
  try {
    const y1 = func.evaluate({ x: x + h });
    const y2 = func.evaluate({ x: x - h });
    return (y1 - y2) / (2 * h);
  } catch (e) {
    return 0;
  }
}

// Dessiner une flèche
function drawArrow(x1, y1, x2, y2, color) {
  const headLen = 15;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  
  // Ligne
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // Pointe de la flèche
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLen * Math.cos(angle - Math.PI / 6),
    y2 - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - headLen * Math.cos(angle + Math.PI / 6),
    y2 - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

// Dessiner le chemin de descente de gradient
function drawGradientPath() {
  if (gradientPath.length === 0) return;
  
  // Dessiner les flèches entre les points
  for (let i = 0; i < gradientPath.length - 1; i++) {
    const p1 = gradientPath[i];
    const p2 = gradientPath[i + 1];
    
    const px1 = toPixelX(p1.x);
    const py1 = toPixelY(p1.y);
    const px2 = toPixelX(p2.x);
    const py2 = toPixelY(p2.y);
    
    // Gradient de couleur du rose au cyan
    const ratio = i / (gradientPath.length - 1);
    const r = Math.floor(255 * (1 - ratio) + 0 * ratio);
    const g = Math.floor(0 * (1 - ratio) + 255 * ratio);
    const b = Math.floor(76 * (1 - ratio) + 249 * ratio);
    const color = `rgb(${r}, ${g}, ${b})`;
    
    drawArrow(px1, py1, px2, py2, color);
  }
  
  // Dessiner les points
  gradientPath.forEach((point, i) => {
    const px = toPixelX(point.x);
    const py = toPixelY(point.y);
    
    // Gradient de couleur
    const ratio = i / (gradientPath.length - 1);
    const r = Math.floor(255 * (1 - ratio) + 0 * ratio);
    const g = Math.floor(0 * (1 - ratio) + 255 * ratio);
    const b = Math.floor(76 * (1 - ratio) + 249 * ratio);
    
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Contour blanc
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  
  // Point de départ en vert
  if (gradientPath.length > 0) {
    const start = gradientPath[0];
    const px = toPixelX(start.x);
    const py = toPixelY(start.y);
    
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Point final en rouge
  if (gradientPath.length > 1) {
    const end = gradientPath[gradientPath.length - 1];
    const px = toPixelX(end.x);
    const py = toPixelY(end.y);
    
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function redraw() {
  clearCanvas();
  drawGrid();
  drawAxes();
  if (input.value.trim()) {
    plotFunction(input.value);
  }
  drawGradientPath();
}

// Animation de la descente de gradient
function animateGradientDescent() {
  if (!currentFunction || !startPoint) {
    alert('Please plot a function and click on the graph to set a starting point');
    return;
  }
  
  if (isAnimating) {
    // Arrêter l'animation
    clearInterval(animationInterval);
    isAnimating = false;
    gradientBtn.textContent = 'Continue Gradient Descent';
    return;
  }
  
  isAnimating = true;
  gradientBtn.textContent = 'Pause';
  
  let currentX = startPoint.x;
  let iteration = 0;
  const maxIterations = 100;
  const learningRate = parseFloat(learningRateInput.value);
  const speed = parseInt(animSpeedInput.value);
  
  // Si le chemin est vide, initialiser avec le point de départ
  if (gradientPath.length === 0) {
    try {
      const y = currentFunction.evaluate({ x: currentX });
      gradientPath.push({ x: currentX, y: y });
      redraw();
    } catch (e) {
      alert('Error evaluating function at starting point');
      return;
    }
  } else {
    // Continuer depuis le dernier point
    const lastPoint = gradientPath[gradientPath.length - 1];
    currentX = lastPoint.x;
  }
  
  animationInterval = setInterval(() => {
    iteration++;
    
    // Calculer le gradient
    const grad = derivative(currentFunction, currentX);
    
    // Mise à jour
    const newX = currentX - learningRate * grad;
    
    // Vérifier si on est dans les limites
    if (newX < X_MIN || newX > X_MAX) {
      clearInterval(animationInterval);
      isAnimating = false;
      gradientBtn.textContent = 'Start Gradient Descent';
      alert('Gradient descent reached the boundary');
      return;
    }
    
    try {
      const newY = currentFunction.evaluate({ x: newX });
      
      if (!isFinite(newY)) {
        clearInterval(animationInterval);
        isAnimating = false;
        gradientBtn.textContent = 'Start Gradient Descent';
        alert('Function evaluation error');
        return;
      }
      
      gradientPath.push({ x: newX, y: newY });
      currentX = newX;
      
      redraw();
      
      // Conditions d'arrêt
      if (Math.abs(grad) < 0.001 || iteration >= maxIterations) {
        clearInterval(animationInterval);
        isAnimating = false;
        gradientBtn.textContent = 'Start Gradient Descent';
        
        if (Math.abs(grad) < 0.001) {
          alert('Converged! Minimum found at x ≈ ' + currentX.toFixed(4));
        } else {
          alert('Maximum iterations reached');
        }
      }
    } catch (e) {
      clearInterval(animationInterval);
      isAnimating = false;
      gradientBtn.textContent = 'Start Gradient Descent';
      alert('Error during gradient descent');
    }
  }, speed);
}

// Gestion du clic sur le canvas
canvas.addEventListener('click', (e) => {
  if (!currentFunction) {
    alert('Please plot a function first');
    return;
  }
  
  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  
  const x = toMathX(px);
  
  try {
    const y = currentFunction.evaluate({ x });
    
    if (isFinite(y)) {
      startPoint = { x, y };
      gradientPath = [{ x, y }];
      
      if (isAnimating) {
        clearInterval(animationInterval);
        isAnimating = false;
      }
      
      gradientBtn.textContent = 'Start Gradient Descent';
      redraw();
    }
  } catch (e) {
    alert('Cannot evaluate function at this point');
  }
});

// Reset
resetBtn.addEventListener('click', () => {
  if (isAnimating) {
    clearInterval(animationInterval);
    isAnimating = false;
  }
  gradientPath = [];
  startPoint = null;
  gradientBtn.textContent = 'Start Gradient Descent';
  redraw();
});

// Événements
plotBtn.addEventListener('click', () => {
  if (isAnimating) {
    clearInterval(animationInterval);
    isAnimating = false;
  }
  gradientPath = [];
  startPoint = null;
  gradientBtn.textContent = 'Start Gradient Descent';
  redraw();
});

gradientBtn.addEventListener('click', animateGradientDescent);

input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    if (isAnimating) {
      clearInterval(animationInterval);
      isAnimating = false;
    }
    gradientPath = [];
    startPoint = null;
    gradientBtn.textContent = 'Start Gradient Descent';
    redraw();
  }
});

exampleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    input.value = btn.dataset.eq;
    if (isAnimating) {
      clearInterval(animationInterval);
      isAnimating = false;
    }
    gradientPath = [];
    startPoint = null;
    gradientBtn.textContent = 'Start Gradient Descent';
    redraw();
  });
});

// Fonction de zoom
function zoom(factor, centerX = 0, centerY = 0) {
  const rangeX = X_MAX - X_MIN;
  const rangeY = Y_MAX - Y_MIN;
  
  const newRangeX = rangeX * factor;
  const newRangeY = rangeY * factor;
  
  X_MIN = centerX - newRangeX / 2;
  X_MAX = centerX + newRangeX / 2;
  Y_MIN = centerY - newRangeY / 2;
  Y_MAX = centerY + newRangeY / 2;
  
  redraw();
}

// Boutons de zoom
zoomInBtn.addEventListener('click', () => {
  zoom(0.8);
});

zoomOutBtn.addEventListener('click', () => {
  zoom(1.25);
});

zoomResetBtn.addEventListener('click', () => {
  X_MIN = DEFAULT_X_MIN;
  X_MAX = DEFAULT_X_MAX;
  Y_MIN = DEFAULT_Y_MIN;
  Y_MAX = DEFAULT_Y_MAX;
  redraw();
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  
  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  
  const mouseX = toMathX(px);
  const mouseY = toMathY(py);
  
  const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
  
  const rangeX = X_MAX - X_MIN;
  const rangeY = Y_MAX - Y_MIN;
  
  const newRangeX = rangeX * zoomFactor;
  const newRangeY = rangeY * zoomFactor;
  
  // Zoom centré sur la position de la souris
  const ratioX = (mouseX - X_MIN) / rangeX;
  const ratioY = (mouseY - Y_MIN) / rangeY;
  
  X_MIN = mouseX - newRangeX * ratioX;
  X_MAX = mouseX + newRangeX * (1 - ratioX);
  Y_MIN = mouseY - newRangeY * ratioY;
  Y_MAX = mouseY + newRangeY * (1 - ratioY);
  
  redraw();
});

// Tracé initial
redraw();