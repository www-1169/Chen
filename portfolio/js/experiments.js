(function () {
  const canvas = document.getElementById('field-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const section = document.getElementById('experiment');
  let width, height, dpr;
  let particles = [];
  let gridPoints = [];
  let mouse = { x: -1000, y: -1000, active: false };
  let rafId;
  let isVisible = false;

  const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  const particleCount = isMobile ? 35 : 80;
  const gridSpacing = isMobile ? 50 : 36;

  const countEl = document.getElementById('field-particles');
  if (countEl) countEl.textContent = String(particleCount);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.floor(rect.width);
    height = Math.floor(rect.height);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initGrid();
  }

  function initGrid() {
    gridPoints = [];
    const cols = Math.floor(width / gridSpacing) + 1;
    const rows = Math.floor(height / gridSpacing) + 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        gridPoints.push({
          ox: c * gridSpacing,
          oy: r * gridSpacing,
          x: c * gridSpacing,
          y: r * gridSpacing
        });
      }
    }
  }

  function getGridPoint(c, r) {
    const cols = Math.floor(width / gridSpacing) + 1;
    return gridPoints[r * cols + c];
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.8,
        alpha: Math.random() * 0.35 + 0.2
      });
    }
  }

  function updateGrid(time) {
    for (let i = 0; i < gridPoints.length; i++) {
      const p = gridPoints[i];
      let dx = 0;
      let dy = 0;

      if (mouse.active) {
        const mx = mouse.x - p.ox;
        const my = mouse.y - p.oy;
        const dist = Math.sqrt(mx * mx + my * my);
        const forceRadius = 140;
        if (dist < forceRadius && dist > 0) {
          const force = (1 - dist / forceRadius) * 12;
          dx = -(mx / dist) * force;
          dy = -(my / dist) * force;
        }
      }

      p.x = p.ox + dx + Math.sin(time * 0.001 + p.oy * 0.02) * 1.5;
      p.y = p.oy + dy + Math.cos(time * 0.001 + p.ox * 0.02) * 1.5;
    }
  }

  function drawGrid() {
    const gridColor = getComputedStyle(canvas).getPropertyValue('--grid-color').trim() || 'rgba(0,229,255,0.08)';
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    const cols = Math.floor(width / gridSpacing) + 1;
    const rows = Math.floor(height / gridSpacing) + 1;

    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const p = getGridPoint(c, r);
        if (!p) continue;
        if (c === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();

    ctx.beginPath();
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const p = getGridPoint(c, r);
        if (!p) continue;
        if (r === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
  }

  function drawParticles(time) {
    ctx.fillStyle = '#00e5ff';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      if (mouse.active) {
        const mx = mouse.x - p.x;
        const my = mouse.y - p.y;
        const dist = Math.sqrt(mx * mx + my * my);
        if (dist < 120 && dist > 0) {
          const force = (1 - dist / 120) * 0.08;
          p.vx += (mx / dist) * force;
          p.vy += (my / dist) * force;
        }
      }

      p.vx *= 0.99;
      p.vy *= 0.99;

      const pulse = Math.sin(time * 0.002 + i) * 0.15 + 0.85;
      ctx.globalAlpha = p.alpha * pulse;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawMouseLight() {
    if (!mouse.active) return;
    const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0.12)');
    gradient.addColorStop(0.5, 'rgba(0, 229, 255, 0.03)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawConnections() {
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 0.6;
    const maxDist = 90;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          ctx.globalAlpha = (1 - dist / maxDist) * 0.25;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function render(time) {
    if (!isVisible) return;
    ctx.clearRect(0, 0, width, height);
    updateGrid(time);
    drawGrid();
    drawConnections();
    drawParticles(time);
    drawMouseLight();
    rafId = requestAnimationFrame(render);
  }

  function start() {
    if (rafId) return;
    isVisible = true;
    rafId = requestAnimationFrame(render);
  }

  function stop() {
    isVisible = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  }

  function onMouseLeave() {
    mouse.active = false;
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resize();
      initParticles();
    }, 150);
  });

  if (!isMobile) {
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) {
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) start();
      else stop();
    });
  }, { threshold: 0.1 });

  resize();
  initParticles();
  observer.observe(section);
})();
