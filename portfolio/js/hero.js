(function() {
  'use strict';

  const hero = document.getElementById('hero');
  const canvas = document.getElementById('hero-canvas');
  if (!hero || !canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width, height, dpr;
  let animationId = null;
  let isVisible = false;
  let isTabVisible = true;
  let prefersReducedMotion = false;
  let particleCount = 50;
  let isMobile = false;

  const particles = [];
  const mouse = { x: -1000, y: -1000, active: false };
  const gridOffset = { x: 0, y: 0 };

  function isMobileViewport() {
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  }

  function initMotionPreference() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion = mediaQuery.matches;
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', function(e) {
        prefersReducedMotion = e.matches;
        if (prefersReducedMotion && animationId) {
          drawStatic();
          pause();
        } else if (isVisible && isTabVisible) {
          play();
        }
      });
    }
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function updateParticleCount() {
    isMobile = isMobileViewport();
    particleCount = isMobile ? 20 : 50;
  }

  function createParticles() {
    particles.length = 0;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.8,
        alpha: Math.random() * 0.4 + 0.3
      });
    }
  }

  function updateParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x += width;
      if (p.x > width) p.x -= width;
      if (p.y < 0) p.y += height;
      if (p.y > height) p.y -= height;

      // Subtle mouse influence (gentle repulsion)
      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140 && dist > 0) {
          const force = (140 - dist) / 140;
          const angle = Math.atan2(dy, dx);
          p.x += Math.cos(angle) * force * 0.5;
          p.y += Math.sin(angle) * force * 0.5;
        }
      }
    }
  }

  function drawGrid(time) {
    const gridSize = 60;
    const alpha = isMobile ? 0.03 : 0.04;
    ctx.strokeStyle = 'rgba(0, 229, 255, ' + alpha + ')';
    ctx.lineWidth = 1;

    const shiftX = Math.sin(time * 0.0001) * 8 + gridOffset.x;
    const shiftY = Math.cos(time * 0.00012) * 6 + gridOffset.y;

    ctx.beginPath();
    for (let x = shiftX % gridSize; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = shiftY % gridSize; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 229, 255, ' + p.alpha + ')';
      ctx.fill();
    }
  }

  function drawConnections() {
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
    ctx.lineWidth = 0.5;
    const maxDist = 100;

    for (let i = 0; i < particles.length; i++) {
      let connections = 0;
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          connections++;
          if (connections >= 3) break;
        }
      }
    }
  }

  function drawGlow() {
    if (!mouse.active) return;
    const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 220);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0.08)');
    gradient.addColorStop(0.5, 'rgba(0, 229, 255, 0.03)');
    gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, width, height);
    drawGrid(0);
    drawParticles();
  }

  function animate(time) {
    if (!isVisible || !isTabVisible || prefersReducedMotion) return;

    ctx.clearRect(0, 0, width, height);
    drawGrid(time);
    updateParticles();
    drawConnections();
    drawParticles();
    drawGlow();

    animationId = requestAnimationFrame(animate);
  }

  function play() {
    if (animationId) return;
    if (prefersReducedMotion) {
      drawStatic();
      return;
    }
    animationId = requestAnimationFrame(animate);
  }

  function pause() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  // Visibility observers
  if ('IntersectionObserver' in window) {
    const visibilityObserver = new IntersectionObserver(function(entries) {
      isVisible = entries[0].isIntersecting;
      if (isVisible && isTabVisible) {
        play();
      } else {
        pause();
      }
    }, { threshold: 0.05 });

    visibilityObserver.observe(hero);
  } else {
    isVisible = true;
  }

  document.addEventListener('visibilitychange', function() {
    isTabVisible = document.visibilityState === 'visible';
    if (isTabVisible && isVisible) {
      play();
    } else {
      pause();
    }
  });

  // Mouse interaction
  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;

    // Subtle perspective shift of grid (1-3px)
    const centerX = width / 2;
    const centerY = height / 2;
    gridOffset.x = ((mouse.x - centerX) / centerX) * 2;
    gridOffset.y = ((mouse.y - centerY) / centerY) * 2;
  }

  function handleMouseLeave() {
    mouse.active = false;
    gridOffset.x = 0;
    gridOffset.y = 0;
  }

  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  hero.addEventListener('mouseleave', handleMouseLeave);

  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      resize();
      updateParticleCount();
      createParticles();
    }, 150);
  });

  // Init
  initMotionPreference();
  updateParticleCount();
  resize();
  createParticles();

  // CZB Identity Terminal
  const hudFrames = document.querySelectorAll('.hud-frame');
  hudFrames.forEach(function(frame) {
    const portrait = frame.querySelector('.hud-portrait img');
    if (!portrait) return;

    frame.addEventListener('mousemove', function(e) {
      const rect = frame.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const moveX = x * 3;
      const moveY = y * 3;
      portrait.style.transform = 'translate(' + moveX.toFixed(2) + 'px, ' + moveY.toFixed(2) + 'px)';
    });

    frame.addEventListener('mouseleave', function() {
      portrait.style.transform = '';
    });
  });
})();
