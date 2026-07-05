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

// Services deck: sticky-pinned, driven by real page scroll position rather
// than "is the mouse hovering the box." The stage wrapper is tall enough
// for one card's worth of scroll per card; while scrolled inside it, the
// deck pins at the same offset the #services anchor link lands on, and the
// active card is a direct function of scroll position, so it's always
// anchored consistently and there's nothing to "get stuck" mid-gesture.
// Once you scroll past the stage, it just un-pins and the page continues.
const stage = document.getElementById('services-stage');
const accordion = document.getElementById('accordion');

if (stage && accordion) {
  const panels = Array.from(accordion.querySelectorAll('.acc-panel'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Longer than the CSS flip transition so a fast scroll fling can't queue
  // up several flips at once, each flip gets its own cooldown, and any
  // remaining distance is caught up one step at a time afterward.
  const COOLDOWN_MS = reduceMotion ? 0 : 950;
  let current = 0;
  let cooling = false;
  let cooldownTimer = null;
  let rafPending = false;

  function render() {
    panels.forEach((panel, i) => {
      const slot = i - current;
      panel.classList.toggle('is-open', slot === 0);
      panel.dataset.slot = slot < 0 ? 'passed' : String(Math.min(slot, 4));
    });
  }

  function headerHeight() {
    const parsed = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function syncHeaderOffset() {
    const header = document.querySelector('.site-header');
    if (header) {
      document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
    }
  }

  function targetIndex() {
    const step = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--acc-step')) || 300;
    const stageTop = stage.getBoundingClientRect().top + window.scrollY;
    const progress = window.scrollY - (stageTop - headerHeight());
    const maxProgress = (panels.length - 1) * step;
    const clamped = Math.max(0, Math.min(maxProgress, progress));
    return Math.round(clamped / step);
  }

  function step() {
    const target = targetIndex();
    if (target === current || cooling) return;
    current += target > current ? 1 : -1;
    render();
    cooling = true;
    clearTimeout(cooldownTimer);
    cooldownTimer = setTimeout(() => {
      cooling = false;
      step();
    }, COOLDOWN_MS);
  }

  function onScroll() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      step();
    });
  }

  render();
  syncHeaderOffset();
  window.addEventListener('resize', () => { syncHeaderOffset(); step(); });
  window.addEventListener('scroll', onScroll, { passive: true });
}
