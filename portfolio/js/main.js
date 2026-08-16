(function() {
  'use strict';

  // Theme toggle
  const html = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const sunPath = 'M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-13a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V5a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zM5.64 6.05a1 1 0 0 1 1.41 0 1 1 0 0 1 0 1.41l-1.41 1.42a1 1 0 0 1-1.41-1.41l1.41-1.42zm12.72 12.73a1 1 0 0 1 1.41 0 1 1 0 0 1 0 1.41l-1.41 1.42a1 1 0 0 1-1.41-1.41l1.41-1.42zM19 12a1 1 0 0 1-1 1h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zM8 12a1 1 0 0 1-1 1H5a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zM16.95 5.64a1 1 0 0 1 1.41-1.41l1.42 1.41a1 1 0 0 1-1.41 1.41l-1.42-1.41zM6.05 18.36a1 1 0 0 1-1.41 1.41l-1.42-1.41a1 1 0 0 1 1.41-1.41l1.42 1.41z';
  const moonPath = 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z';

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('czb-theme', theme);
    themeIcon.querySelector('path').setAttribute('d', theme === 'dark' ? sunPath : moonPath);
  }

  const savedTheme = localStorage.getItem('czb-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    setTheme(savedTheme);
  } else {
    setTheme('dark');
  }

  themeToggle.addEventListener('click', function() {
    const current = html.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Mobile menu
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  menuToggle.addEventListener('click', function() {
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      menuToggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    });
  });

  // Back to top
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', function() {
    backToTop.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  backToTop.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Modal
  const modal = document.getElementById('projectModal');
  const modalClose = document.getElementById('modalClose');
  const projectDetailBtn = document.getElementById('projectDetailBtn');
  let lastFocusedElement = null;

  function openModal() {
    lastFocusedElement = document.activeElement;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  projectDetailBtn.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);

  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
  });

  function getFocusableModalElements() {
    return Array.from(modal.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="email"], input[type="search"], select, [tabindex]:not([tabindex="-1"])'
    )).filter(function(el) {
      return !el.disabled && el.offsetParent !== null;
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (modal.classList.contains('active')) {
        closeModal();
        return;
      }
      if (navLinks.classList.contains('open')) {
        menuToggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('open');
        menuToggle.focus();
        return;
      }
    }

    if (e.key === 'Tab' && modal.classList.contains('active')) {
      const focusables = getFocusableModalElements();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();
})();
