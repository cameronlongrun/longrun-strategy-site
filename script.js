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

// Services accordion: auto-cycles when idle, follows the mouse on hover
const accordion = document.getElementById('accordion');

if (accordion) {
  const panels = Array.from(accordion.querySelectorAll('.acc-panel'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  let timer = null;
  const INTERVAL = 2400;

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
    if (reduceMotion || timer) return;
    timer = setInterval(advance, INTERVAL);
  }

  function stopAuto() {
    clearInterval(timer);
    timer = null;
  }

  open(0);

  panels.forEach((panel, i) => {
    panel.addEventListener('mouseenter', () => open(i));
    panel.addEventListener('click', () => open(i));
  });

  accordion.addEventListener('mouseenter', stopAuto);
  accordion.addEventListener('mouseleave', startAuto);

  // Only auto-cycle while the section is in view
  const accObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { startAuto(); } else { stopAuto(); }
    });
  }, { threshold: 0.25 });

  accObserver.observe(accordion);
}
