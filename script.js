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

// Services accordion: a scroll-snapped peek carousel at every screen size.
// No auto-advance. The "open" card just tracks whichever one is scrolled
// into view inside the accordion's own scroll window, so the user drives
// it by scrolling (or by clicking a peeking card to snap to it).
const accordion = document.getElementById('accordion');

if (accordion) {
  const panels = Array.from(accordion.querySelectorAll('.acc-panel'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const accIntersection = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-open', entry.intersectionRatio > 0.55);
    });
  }, { root: accordion, threshold: [0, 0.55, 1] });

  panels.forEach((panel, i) => {
    if (i === 0) panel.classList.add('is-open');
    accIntersection.observe(panel);
    panel.addEventListener('click', () => {
      panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });
}
