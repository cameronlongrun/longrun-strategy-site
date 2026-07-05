document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.getElementById('nav-toggle');
const siteNav = document.getElementById('site-nav');

navToggle.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

siteNav.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

const sections = document.querySelectorAll('main .section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
      });
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });

sections.forEach(section => observer.observe(section));

const header = document.querySelector('.site-header');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 12);
}, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Services accordion.
// Desktop/tablet: auto-cycles when idle, follows the mouse on hover.
// Mobile: no auto-scroll. It becomes a scroll-snapped peek carousel (see
// style.css), and the "open" card just tracks whichever one is scrolled
// into view, so the user drives it by scrolling, not a timer.
const accordion = document.getElementById('accordion');

if (accordion) {
  const panels = Array.from(accordion.querySelectorAll('.acc-panel'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileQuery = window.matchMedia('(max-width: 760px)');
  let current = 0;
  let timer = null;
  let mobileObserver = null;
  const INTERVAL = 8000;

  function open(index) {
    current = index;
    panels.forEach((panel, i) => {
      panel.classList.toggle('is-open', i === index);
      panel.dataset.distance = Math.abs(i - index);
    });
  }

  function advance() {
    open((current + 1) % panels.length);
  }

  function startAuto() {
    if (reduceMotion || timer || mobileQuery.matches) return;
    timer = setInterval(advance, INTERVAL);
  }

  function stopAuto() {
    clearInterval(timer);
    timer = null;
  }

  function enableDesktopMode() {
    if (mobileObserver) { mobileObserver.disconnect(); mobileObserver = null; }
    open(0);
    startAuto();
  }

  function enableMobileMode() {
    stopAuto();
    panels.forEach(panel => panel.classList.remove('is-open'));
    mobileObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle('is-open', entry.intersectionRatio > 0.55);
      });
    }, { root: accordion, threshold: [0, 0.55, 1] });
    panels.forEach(panel => mobileObserver.observe(panel));
  }

  function applyMode() {
    stopAuto();
    if (mobileQuery.matches) { enableMobileMode(); } else { enableDesktopMode(); }
  }

  panels.forEach((panel, i) => {
    panel.addEventListener('mouseenter', () => { if (!mobileQuery.matches) open(i); });
    panel.addEventListener('click', () => {
      if (mobileQuery.matches) {
        panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      } else {
        open(i);
      }
    });
  });

  accordion.addEventListener('mouseenter', () => { if (!mobileQuery.matches) stopAuto(); });
  accordion.addEventListener('mouseleave', () => { if (!mobileQuery.matches) startAuto(); });

  // Only auto-cycle while the section is in view (desktop only)
  const accObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (mobileQuery.matches) return;
      if (entry.isIntersecting) { startAuto(); } else { stopAuto(); }
    });
  }, { threshold: 0.25 });

  accObserver.observe(accordion);

  applyMode();
  mobileQuery.addEventListener('change', applyMode);
}
