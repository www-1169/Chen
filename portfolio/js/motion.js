(function() {
  'use strict';

  // Global scroll-driven state
  const ScrollState = {
    activeSection: null,
    sections: [],
    observers: [],
    prefersReducedMotion: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    isMobile: window.matchMedia && window.matchMedia('(max-width: 767px)').matches
  };

  const body = document.body;
  const sectionSelector = 'main section[id]';
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  // Section reveal with staggered delays
  function initReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    // Assign stagger index to grouped reveals (e.g. cards inside a grid)
    const staggerParents = new Map();
    revealElements.forEach(function(el) {
      const parent = el.parentElement;
      if (!parent) return;
      if (!staggerParents.has(parent)) {
        staggerParents.set(parent, 0);
      }
      const index = staggerParents.get(parent);
      el.style.transitionDelay = (index * 0.08) + 's';
      staggerParents.set(parent, index + 1);
    });

    if ('IntersectionObserver' in window && !ScrollState.prefersReducedMotion) {
      const revealObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      revealElements.forEach(function(el) { revealObserver.observe(el); });
    } else {
      revealElements.forEach(function(el) { el.classList.add('visible'); });
    }
  }

  // Active section tracking via IntersectionObserver
  function initSectionObserver() {
    const sections = document.querySelectorAll(sectionSelector);
    if (!sections.length) return;
    ScrollState.sections = Array.from(sections);

    if (!('IntersectionObserver' in window)) {
      // Fallback to scroll listener
      window.addEventListener('scroll', updateActiveSectionFallback, { passive: true });
      updateActiveSectionFallback();
      return;
    }

    const sectionObserver = new IntersectionObserver(function(entries) {
      // Pick the most visible section as active
      let bestEntry = null;
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
          bestEntry = entry;
        }
      });

      if (bestEntry) {
        setActiveSection(bestEntry.target);
      }
    }, { threshold: [0.25, 0.5, 0.75], rootMargin: '-68px 0px -25% 0px' });

    sections.forEach(function(section) { sectionObserver.observe(section); });
    ScrollState.observers.push(sectionObserver);

    // Initial state
    updateActiveSectionFallback();
  }

  function setActiveSection(section) {
    const id = section.getAttribute('id');
    if (ScrollState.activeSection === id) return;
    ScrollState.activeSection = id;

    // Update body class
    ScrollState.sections.forEach(function(s) {
      body.classList.remove('section-' + s.getAttribute('id'));
    });
    body.classList.add('section-' + id);

    // Update nav links
    navAnchors.forEach(function(a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + id);
    });

    // Dispatch custom event for other components
    try {
      window.dispatchEvent(new CustomEvent('sectionchange', { detail: { section: id } }));
    } catch (e) {}
  }

  function updateActiveSectionFallback() {
    let current = '';
    const scrollPos = window.scrollY + 120;
    ScrollState.sections.forEach(function(section) {
      const sectionTop = section.offsetTop;
      if (scrollPos >= sectionTop) {
        current = section.getAttribute('id');
      }
    });
    if (current) {
      const section = document.getElementById(current);
      if (section) setActiveSection(section);
    }
  }

  // Education timeline animation
  function initEducationTimeline() {
    const timeline = document.querySelector('.education-timeline');
    if (!timeline) return;

    timeline.classList.add('timeline-pending');

    if ('IntersectionObserver' in window && !ScrollState.prefersReducedMotion) {
      const eduObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            timeline.classList.remove('timeline-pending');
            timeline.classList.add('timeline-active');
            eduObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3, rootMargin: '0px 0px -10% 0px' });

      eduObserver.observe(timeline);
      ScrollState.observers.push(eduObserver);
    } else {
      timeline.classList.remove('timeline-pending');
      timeline.classList.add('timeline-active');
    }
  }

  // Skills terminal typing cursor animation
  function initSkillsTerminal() {
    const terminal = document.querySelector('.skills-terminal');
    if (!terminal) return;

    if ('IntersectionObserver' in window && !ScrollState.prefersReducedMotion) {
      const termObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            terminal.classList.add('terminal-active');
            termObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25, rootMargin: '0px 0px -10% 0px' });

      termObserver.observe(terminal);
      ScrollState.observers.push(termObserver);
    } else {
      terminal.classList.add('terminal-active');
    }
  }

  // About knowledge graph animation
  function initKnowledgeGraph() {
    const graph = document.querySelector('.knowledge-graph');
    if (!graph) return;

    if ('IntersectionObserver' in window && !ScrollState.prefersReducedMotion) {
      const graphObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            graph.classList.add('graph-active');
            graphObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

      graphObserver.observe(graph);
      ScrollState.observers.push(graphObserver);
    } else {
      graph.classList.add('graph-active');
    }
  }

  // Awards timeline animation
  function initAwardsTimeline() {
    const timeline = document.getElementById('awardsTimeline');
    if (!timeline) return;

    timeline.classList.add('timeline-pending');

    if ('IntersectionObserver' in window && !ScrollState.prefersReducedMotion) {
      const awardsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            timeline.classList.remove('timeline-pending');
            timeline.classList.add('active');
            awardsObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25, rootMargin: '0px 0px -10% 0px' });

      awardsObserver.observe(timeline);
      ScrollState.observers.push(awardsObserver);
    } else {
      timeline.classList.remove('timeline-pending');
      timeline.classList.add('active');
    }
  }

  // Focus bento hover interactions (sibling dimming via JS for robustness)
  function initFocusBento() {
    const grid = document.querySelector('.focus-grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('.focus-card');
    if (!cards.length) return;

    cards.forEach(function(card) {
      card.addEventListener('mouseenter', function() {
        if (ScrollState.prefersReducedMotion) return;
        cards.forEach(function(c) {
          if (c === card) {
            c.classList.add('focus-card-active');
            c.classList.remove('focus-card-dim');
          } else {
            c.classList.remove('focus-card-active');
            c.classList.add('focus-card-dim');
          }
        });
      });

      card.addEventListener('mouseleave', function() {
        cards.forEach(function(c) {
          c.classList.remove('focus-card-active', 'focus-card-dim');
        });
      });
    });
  }

  // Re-calculate mobile state on resize
  function handleResize() {
    ScrollState.isMobile = window.matchMedia('(max-width: 767px)').matches;
  }

  window.addEventListener('resize', handleResize, { passive: true });

  initReveal();
  initSectionObserver();
  initEducationTimeline();
  initSkillsTerminal();
  initKnowledgeGraph();
  initAwardsTimeline();
  initFocusBento();
})();
