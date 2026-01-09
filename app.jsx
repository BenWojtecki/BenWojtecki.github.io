const { useState, useEffect, useRef } = React;

const DVVariationalViz = () => {
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [divergence, setDivergence] = useState(0);
  const [hoveredMetric, setHoveredMetric] = useState(null);
  
  const distCanvas = useRef(null);
  const tradeoffCanvas = useRef(null);

  // Reference distribution π (standard normal)
  const pi = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  
  // Modified distribution ρ
  const rho = (x, t) => {
    const alpha = t / (2 * Math.PI);
    const fValue = f(x);
    const tiltFactor = Math.exp(alpha * fValue * 2);
    const unnormalized = pi(x) * tiltFactor;
    const normalization = 1 + alpha * 0.8;
    return unnormalized / normalization;
  };

  // Function f(x)
  const f = (x) => x > 0 ? x * 0.6 : x * 0.2;

  // Calculate KL divergence
  const calculateKL = (t) => {
    const alpha = t / (2 * Math.PI);
    return alpha * alpha * 3;
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setTime(t => {
          const newT = t + 0.05;
          if (newT >= 2 * Math.PI) {
            setIsPlaying(false);
            return 2 * Math.PI;
          }
          setDivergence(calculateKL(newT));
          return newT;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  // Draw distribution chart
  useEffect(() => {
    const canvas = distCanvas.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set styles
    ctx.font = '11px JetBrains Mono, monospace';
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#ccc' : '#888';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(150,150,150,0.2)';

    // Draw grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Labels
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText('x', width / 2, height - 10);
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Density', 0, 0);
    ctx.restore();

    // X-axis labels
    ctx.textAlign = 'center';
    for (let x = -4; x <= 4; x += 2) {
      const px = padding + ((x + 5) / 10) * chartWidth;
      ctx.fillText(x.toString(), px, height - padding + 20);
    }

    // Draw distributions
    const xMin = -5, xMax = 5;
    const yMax = 0.5;

    // Helper function to transform coordinates
    const toCanvasX = (x) => padding + ((x - xMin) / (xMax - xMin)) * chartWidth;
    const toCanvasY = (y) => height - padding - (y / yMax) * chartHeight;

    // Draw π (reference)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = xMin; x <= xMax; x += 0.05) {
      const y = pi(x);
      const cx = toCanvasX(x);
      const cy = toCanvasY(y);
      if (x === xMin) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Draw ρ (modified)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = xMin; x <= xMax; x += 0.05) {
      const y = rho(x, time);
      const cx = toCanvasX(x);
      const cy = toCanvasY(y);
      if (x === xMin) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Draw f(x) scaled
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let x = xMin; x <= xMax; x += 0.05) {
      const y = f(x) / 2 + 0.5;
      const cy = toCanvasY(Math.max(0, Math.min(yMax, y)));
      const cx = toCanvasX(x);
      if (x === xMin) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Legend
    const legendX = width - padding - 120;
    const legendY = padding + 20;
    ctx.font = '12px JetBrains Mono, monospace';
    
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + 30, legendY);
    ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText('π', legendX + 35, legendY + 4);

    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 20);
    ctx.lineTo(legendX + 30, legendY + 20);
    ctx.stroke();
    ctx.fillText('ρ', legendX + 35, legendY + 24);

    ctx.strokeStyle = '#10b981';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 40);
    ctx.lineTo(legendX + 30, legendY + 40);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('f(x)', legendX + 35, legendY + 44);

  }, [time]);

  // Draw tradeoff chart
  useEffect(() => {
    const canvas = tradeoffCanvas.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    ctx.clearRect(0, 0, width, height);
    
    ctx.font = '11px JetBrains Mono, monospace';
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#ccc' : '#888';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(150,150,150,0.2)';

    // Draw grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Labels
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText('Deformation progression (%)', width / 2, height - 15);
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Value', 0, 0);
    ctx.restore();

    // Generate data
    const data = [];
    for (let t = 0; t <= 2 * Math.PI; t += 0.1) {
      const alpha = t / (2 * Math.PI);
      const expRho = alpha * 1.2;
      const kl = calculateKL(t);
      data.push({
        progress: alpha * 100,
        expRho: expRho,
        kl: kl,
        net: expRho - kl
      });
    }

    const yMin = -0.5, yMax = 1.5;
    
    const toCanvasX = (progress) => padding + (progress / 100) * chartWidth;
    const toCanvasY = (y) => height - padding - ((y - yMin) / (yMax - yMin)) * chartHeight;

    // X-axis labels
    ctx.textAlign = 'center';
    ctx.fillStyle = textColor;
    for (let i = 0; i <= 100; i += 20) {
      const x = toCanvasX(i);
      ctx.fillText(i.toString(), x, height - padding + 20);
    }

    // Y-axis labels
    ctx.textAlign = 'right';
    for (let y = yMin; y <= yMax; y += 0.5) {
      const cy = toCanvasY(y);
      ctx.fillText(y.toFixed(1), padding - 10, cy + 4);
    }

    // Zero line
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padding, toCanvasY(0));
    ctx.lineTo(width - padding, toCanvasY(0));
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw E_ρ[f] (green)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = toCanvasX(d.progress);
      const y = toCanvasY(d.expRho);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw KL (red)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = toCanvasX(d.progress);
      const y = toCanvasY(d.kl);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Net (blue, thick)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = toCanvasX(d.progress);
      const y = toCanvasY(d.net);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Current position marker
    const currentProgress = (time / (2 * Math.PI)) * 100;
    const currentData = data[Math.floor(data.length * time / (2 * Math.PI))];
    if (currentData) {
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(toCanvasX(currentProgress), toCanvasY(currentData.net), 5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Legend
    const legendX = padding + 20;
    const legendY = padding + 20;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + 30, legendY);
    ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.fillText('E_ρ[f] (Benefit)', legendX + 35, legendY + 4);

    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 20);
    ctx.lineTo(legendX + 30, legendY + 20);
    ctx.stroke();
    ctx.fillText('KL(ρ||π) (Cost)', legendX + 35, legendY + 24);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 40);
    ctx.lineTo(legendX + 30, legendY + 40);
    ctx.stroke();
    ctx.fillText('DV Bound (Net)', legendX + 35, legendY + 44);

  }, [time]);

  const alpha = time / (2 * Math.PI);
  const currentExpRho = alpha * 1.2;
  const currentKL = divergence;
  const tradeoff = currentExpRho - currentKL;

  const PlayIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );

  const PauseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );

  const ResetIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );

  return (
    <div className="viz-container">
      <p></p>
      <div className="controls">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="btn btn-primary"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={() => { setTime(0); setDivergence(0); setIsPlaying(false); }}
          className="btn btn-secondary"
        >
          <ResetIcon />
          Reset
        </button>
      </div>

      <div className="viz-grid-horizontal">
        <div className="viz-card">
          <h3 className="viz-card-title">Distributions π and ρ</h3>
          <canvas ref={distCanvas} width="450" height="300" style={{width: '100%', height: 'auto'}}></canvas>
          <p className="viz-card-description">
            Initially ρ = π. Then ρ progressively deforms to assign greater weight to regions where f(x) is positive and large.
          </p>
        </div>

        <div className="viz-card">
          <h3 className="viz-card-title">Current Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-box metric-box-green">
              <div className="metric-label" style={{color: '#10b981'}}>Expected Value under ρ</div>
              <div className="metric-value" style={{color: '#10b981'}}>𝔼[f] = {currentExpRho.toFixed(3)}</div>
              <div className="metric-hint" style={{color: '#059669'}}>Objective: Maximize this value</div>
            </div>
            
            <div className="metric-box metric-box-red">
              <div className="metric-label" style={{color: '#ef4444'}}>KL Divergence</div>
              <div className="metric-value" style={{color: '#ef4444'}}>KL(ρ||π) = {currentKL.toFixed(3)}</div>
              <div className="metric-hint" style={{color: '#dc2626'}}>Cost: Penalty for deviating from π</div>
            </div>
            
            <div className="metric-box metric-box-blue">
              <div className="metric-label" style={{color: '#3b82f6'}}>Tradeoff</div>
              <div className="metric-value" style={{color: '#3b82f6'}}>𝔼[f] - KL = {tradeoff.toFixed(3)}</div>
              <div className="metric-hint" style={{color: '#2563eb'}}>Balance between gain and cost</div>
            </div>
          </div>
        </div>
      </div>

      <div className="viz-grid">
        <div className="viz-card viz-card-full">
          <h3 className="viz-card-title">Tradeoff Evolution</h3>
          <canvas ref={tradeoffCanvas} width="1100" height="350" style={{width: '100%', height: 'auto'}}></canvas>
          
          <div className="graph-explanation">
            <h4>How to read this graph:</h4>
            <ul>
              <li>
                <span className="bullet" style={{color: '#10b981'}}>●</span>
                <span><strong style={{color: '#10b981'}}>Green line (𝔼[f])</strong>: The benefit gained by deforming ρ. It increases as ρ better captures regions where f is large.</span>
              </li>
              <li>
                <span className="bullet" style={{color: '#ef4444'}}>●</span>
                <span><strong style={{color: '#ef4444'}}>Red line (KL)</strong>: The cost paid for deviating from π. It also increases as ρ becomes increasingly different from π.</span>
              </li>
              <li>
                <span className="bullet" style={{color: '#3b82f6'}}>●</span>
                <span><strong style={{color: '#3b82f6'}}>Thick blue line (E_ρ[f] - KL)</strong>: The NET benefit = benefit - cost. This represents the true added value!</span>
              </li>
            </ul>
            <p>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<DVVariationalViz />, document.getElementById('root'));