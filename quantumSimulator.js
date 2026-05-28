let state = [
  { re: 1, im: 0 },
  { re: 0, im: 0 }
];

let gateHistory = [];

const canvas = document.getElementById("blochCanvas");
const ctx = canvas.getContext("2d");

function complexAdd(a, b) {
  return {
    re: a.re + b.re,
    im: a.im + b.im
  };
}

function complexMul(a, b) {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  };
}

function magnitudeSquared(z) {
  return z.re * z.re + z.im * z.im;
}

function applyMatrix(matrix) {

  const a = state[0];
  const b = state[1];

  const new0 = complexAdd(
    complexMul(matrix[0][0], a),
    complexMul(matrix[0][1], b)
  );

  const new1 = complexAdd(
    complexMul(matrix[1][0], a),
    complexMul(matrix[1][1], b)
  );

  state = [new0, new1];

  updateDisplay();
  drawBlochSphere();
}

function applyGate(gate) {

  const invSqrt2 = 1 / Math.sqrt(2);

  const gates = {

    X: [
      [{re:0, im:0}, {re:1, im:0}],
      [{re:1, im:0}, {re:0, im:0}]
    ],

    Y: [
      [{re:0, im:0}, {re:0, im:-1}],
      [{re:0, im:1}, {re:0, im:0}]
    ],

    Z: [
      [{re:1, im:0}, {re:0, im:0}],
      [{re:0, im:0}, {re:-1, im:0}]
    ],

    H: [
      [{re:invSqrt2, im:0}, {re:invSqrt2, im:0}],
      [{re:invSqrt2, im:0}, {re:-invSqrt2, im:0}]
    ]
  };

  gateHistory.push(gate);

  updateGateHistory();

  applyMatrix(gates[gate]);
}

function formatComplex(z) {

  const re = Math.round(z.re * 1000) / 1000;
  const im = Math.round(z.im * 1000) / 1000;

  if (im === 0) return `${re}`;

  if (re === 0) return `${im}i`;

  return `${re} + ${im}i`;
}

function updateDisplay() {

  const a = state[0];
  const b = state[1];

  document.getElementById("state-vector").innerHTML =
    `
    $$|\\psi\\rangle =
    (${formatComplex(a)})|0\\rangle +
    (${formatComplex(b)})|1\\rangle
    $$
    `;

  const p0 = (magnitudeSquared(a) * 100).toFixed(2);
  const p1 = (magnitudeSquared(b) * 100).toFixed(2);

  document.getElementById("probabilities").innerHTML =
    `
    <div>
      <strong>P(0)</strong>
      <div style="background:#ddd;height:20px;border-radius:10px;">
        <div style="width:${p0}%;height:20px;background:#4caf50;border-radius:10px;"></div>
      </div>
      ${p0}%
    </div>

    <br>

    <div>
      <strong>P(1)</strong>
      <div style="background:#ddd;height:20px;border-radius:10px;">
        <div style="width:${p1}%;height:20px;background:#2196f3;border-radius:10px;"></div>
      </div>
      ${p1}%
    </div>
    `;

  if (window.MathJax) {
    MathJax.typesetPromise();
  }
}

function updateGateHistory() {

  const container = document.getElementById("gate-sequence");

  container.innerHTML = "";

  gateHistory.forEach(gate => {

    const div = document.createElement("div");

    div.className = "gate-box";

    div.innerText = gate;

    container.appendChild(div);
  });
}

function drawBlochSphere() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = 200;
  const centerY = 200;
  const radius = 140;

  // Sphere
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.stroke();

  // Axes
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius);
  ctx.lineTo(centerX, centerY + radius);

  ctx.moveTo(centerX - radius, centerY);
  ctx.lineTo(centerX + radius, centerY);

  ctx.strokeStyle = "#888";
  ctx.stroke();

  // Labels
  ctx.fillStyle = "black";
  ctx.font = "18px Arial";

  ctx.fillText("|0⟩", centerX - 15, centerY - radius - 10);
  ctx.fillText("|1⟩", centerX - 15, centerY + radius + 25);

  const p0 = magnitudeSquared(state[0]);
  const p1 = magnitudeSquared(state[1]);

  const z = p0 - p1;

  const pointY = centerY - z * radius;

  ctx.beginPath();
  ctx.arc(centerX, pointY, 10, 0, 2 * Math.PI);

  ctx.fillStyle = "#e91e63";
  ctx.fill();
}

function resetState() {

  state = [
    { re: 1, im: 0 },
    { re: 0, im: 0 }
  ];

  gateHistory = [];

  updateGateHistory();

  updateDisplay();

  drawBlochSphere();
}

resetState();