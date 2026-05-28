let mode = 1;
let history = [];

const canvas = document.getElementById("blochCanvas");
const ctx = canvas.getContext("2d");

/* STATES */
let state1 = [
  {re:1,im:0},
  {re:0,im:0}
];

let state2 = [
  {re:1,im:0},
  {re:0,im:0},
  {re:0,im:0},
  {re:0,im:0}
];

/* MODE */
function toggleMode(){
  mode = document.getElementById("modeSwitch").checked ? 2 : 1;
  history = [];
  renderControls();
  resetState();
}

/* CONTROLS */
function renderControls(){

  const div = document.getElementById("controls");

  const gates = mode === 1
    ? ["X","Y","Z","H","S","T"]
    : ["X0","X1","CNOT"];

  div.innerHTML = gates.map(g =>
    `<button onclick="applyGate('${g}')">${g}</button>`
  ).join("");
}

/* MATH */
function norm(z){
  return z.re*z.re + z.im*z.im;
}

function add(a,b){ return {re:a.re+b.re, im:a.im+b.im}; }
function mul(a,b){ return {re:a.re*b.re - a.im*b.im, im:a.re*b.im + a.im*b.re}; }

/* APPLY */
function applyGate(g){
  history.push(g);
  updateHistory();

  if(mode === 1) apply1(g);
  else apply2(g);

  refreshUI();
}

/* 1 QUBIT */
function apply1(g){

  const s = 1/Math.sqrt(2);

  const gates = {
    X:[[ {re:0,im:0},{re:1,im:0} ],
       [ {re:1,im:0},{re:0,im:0} ]],

    Y:[[ {re:0,im:0},{re:0,im:-1} ],
       [ {re:0,im:1},{re:0,im:0} ]],

    Z:[[ {re:1,im:0},{re:0,im:0} ],
       [ {re:0,im:0},{re:-1,im:0} ]],

    H:[[ {re:s,im:0},{re:s,im:0} ],
       [ {re:s,im:0},{re:-s,im:0} ]],

    S:[[ {re:1,im:0},{re:0,im:0} ],
       [ {re:0,im:0},{re:0,im:1} ]],

    T:[[ {re:1,im:0},{re:0,im:0} ],
       [ {re:0,im:0},{re:Math.SQRT1_2,im:Math.SQRT1_2} ]]
  };

  const m = gates[g];
  if(m){
    const a = state1[0], b = state1[1];

    state1 = [
      add(mul(m[0][0],a), mul(m[0][1],b)),
      add(mul(m[1][0],a), mul(m[1][1],b))
    ];
  }

  drawBloch();
}

/* 2 QUBITS */
function apply2(g){

  if(g === "CNOT"){
    state2 = [state2[0], state2[1], state2[3], state2[2]];
  }

  if(g === "X0"){
    [state2[0],state2[2]] = [state2[2],state2[0]];
    [state2[1],state2[3]] = [state2[3],state2[1]];
  }

  if(g === "X1"){
    [state2[0],state2[1]] = [state2[1],state2[0]];
    [state2[2],state2[3]] = [state2[3],state2[2]];
  }
}

/* UI SWITCH */
function refreshUI(){
  if(mode === 1) update1();
  else update2();
}

/* DISPLAY 1Q */
function update1(){

  const p0 = norm(state1[0]);
  const p1 = norm(state1[1]);

  document.getElementById("state-vector").innerHTML =
    `|ψ⟩ = ${state1[0].re.toFixed(2)}|0⟩ + ${state1[1].re.toFixed(2)}|1⟩`;

  document.getElementById("probabilities").innerHTML = `
    P(0)
    <div class="prob-bar"><div class="prob-fill" style="width:${p0*100}%"></div></div>

    P(1)
    <div class="prob-bar"><div class="prob-fill" style="width:${p1*100}%"></div></div>
  `;
}

/* DISPLAY 2Q */
function update2(){

  const labels=["00","01","10","11"];

  document.getElementById("state-vector").innerHTML =
    state2.map((z,i)=> `${z.re.toFixed(2)}|${labels[i]}⟩`).join(" + ");

  document.getElementById("probabilities").innerHTML =
    state2.map((z,i)=>`
      P(${labels[i]})
      <div class="prob-bar"><div class="prob-fill" style="width:${norm(z)*100}%"></div></div>
    `).join("");
}

/* HISTORY */
function updateHistory(){
  document.getElementById("gate-sequence").innerHTML =
    history.map(h=>`<div>${h}</div>`).join("");
}

/* BLOCH */
function drawBloch(){

  ctx.clearRect(0,0,400,400);

  ctx.beginPath();
  ctx.arc(200,200,120,0,Math.PI*2);
  ctx.stroke();

  const z = norm(state1[0]) - norm(state1[1]);

  ctx.beginPath();
  ctx.arc(200,200 - z*120,8,0,Math.PI*2);
  ctx.fill();
}

/* RESET */
function resetState(){

  history = [];

  if(mode === 1){
    state1 = [{re:1,im:0},{re:0,im:0}];
  } else {
    state2 = [
      {re:1,im:0},
      {re:0,im:0},
      {re:0,im:0},
      {re:0,im:0}
    ];
  }

  updateHistory();
  refreshUI();
  drawBloch();
}

/* INIT */
renderControls();
refreshUI();
drawBloch();