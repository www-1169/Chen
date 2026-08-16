(function() {
  'use strict';

  // Disable on touch devices, mobile, or reduced motion
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const isMobile = window.matchMedia('(max-width: 1023px)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isTouch || isMobile || prefersReducedMotion) return;

  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');

  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden', 'true');

  document.body.appendChild(ring);
  document.body.appendChild(glow);

  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;
  let glowX = -100;
  let glowY = -100;
  let rafId = null;
  let isHovering = false;
  let isVisible = false;

  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!isVisible) {
      isVisible = true;
      ring.style.opacity = '1';
      glow.style.opacity = '1';
    }
  }

  function onMouseLeave() {
    isVisible = false;
    ring.style.opacity = '0';
    glow.style.opacity = '0';
  }

  function onMouseEnter() {
    isVisible = true;
    ring.style.opacity = '1';
    glow.style.opacity = '1';
  }

  function onMouseOver(e) {
    const target = e.target;
    const interactive = target.closest('a, button, [role="button"], input, textarea, select, .focus-card, .interest-card, .award-card, .project-card, .contact-box');
    if (interactive && !isHovering) {
      isHovering = true;
      ring.classList.add('cursor-hover');
      glow.classList.add('cursor-hover');
    } else if (!interactive && isHovering) {
      isHovering = false;
      ring.classList.remove('cursor-hover');
      glow.classList.remove('cursor-hover');
    }
  }

  function render() {
    // Smooth follow with different lags for ring and glow
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;

    ring.style.transform = 'translate(' + (ringX - 12) + 'px, ' + (ringY - 12) + 'px)';
    glow.style.transform = 'translate(' + (glowX - 60) + 'px, ' + (glowY - 60) + 'px)';

    rafId = requestAnimationFrame(render);
  }

  document.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave);
  document.addEventListener('mouseenter', onMouseEnter);
  document.addEventListener('mouseover', onMouseOver, { passive: true });

  rafId = requestAnimationFrame(render);

  // Cleanup on visibility change
  document.addEventListener('visibilitychange', function() {
    if (document.hidden && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!document.hidden && !rafId) {
      rafId = requestAnimationFrame(render);
    }
  });
})();
