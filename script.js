document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.getElementById('nav-toggle');
const siteNav = document.getElementById('site-nav');

navToggle.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

// Set while a nav link's anchor jump is under way (plus a short buffer for
// the smooth-scroll animation and any trailing trackpad momentum), so the
// services deck below doesn't mistake that motion for a user trying to flip
// through cards.
let suppressDeckInput = false;
let suppressDeckTimer = null;

siteNav.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    suppressDeckInput = true;
    clearTimeout(suppressDeckTimer);
    suppressDeckTimer = setTimeout(() => { suppressDeckInput = false; }, 1200);
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

// Services deck: sticky-pinned for a deterministic anchor point (it locks at
// the same offset the #services anchor link lands on, see --header-h), and
// gated by real wheel/touch interception so the page genuinely cannot
// scroll past until all five cards have been flipped through, in either
// direction. Native scroll speed can't outrun this the way a pure
// scroll-position mapping could, every step is consumed and rate-limited
// here before the browser ever sees it.
const stage = document.getElementById('services-stage');
const accordion = document.getElementById('accordion');

if (stage && accordion) {
  const panels = Array.from(accordion.querySelectorAll('.acc-panel'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Longer than the CSS flip transition so a fast scroll fling can't queue
  // up several flips at once, each flip gets its own full cooldown.
  const COOLDOWN_MS = reduceMotion ? 0 : 950;
  let current = 0;
  let cooling = false;
  let cooldownTimer = null;

  function render() {
    panels.forEach((panel, i) => {
      const slot = i - current;
      panel.classList.toggle('is-open', slot === 0);
      panel.dataset.slot = slot < 0 ? 'passed' : String(Math.min(slot, 4));
    });
  }

  function goTo(index) {
    if (cooling) return;
    const clamped = Math.max(0, Math.min(panels.length - 1, index));
    if (clamped === current) return;
    current = clamped;
    render();
    cooling = true;
    clearTimeout(cooldownTimer);
    cooldownTimer = setTimeout(() => { cooling = false; }, COOLDOWN_MS);
  }

  function syncHeaderOffset() {
    const header = document.querySelector('.site-header');
    if (header) {
      document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
    }
  }

  render();
  syncHeaderOffset();
  window.addEventListener('resize', syncHeaderOffset);

  stage.addEventListener('wheel', (e) => {
    if (suppressDeckInput) return;
    if (cooling) { e.preventDefault(); return; }
    const goingNext = e.deltaY > 0;
    if (goingNext && current < panels.length - 1) {
      e.preventDefault();
      goTo(current + 1);
    } else if (!goingNext && current > 0) {
      e.preventDefault();
      goTo(current - 1);
    }
    // At the first or last card, do nothing: the page scrolls through as usual.
  }, { passive: false });

  let touchStartY = null;
  let touchAction = null; // 'next' | 'prev' | 'pass'

  stage.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchAction = null;
  }, { passive: true });

  stage.addEventListener('touchmove', (e) => {
    if (touchStartY === null) return;
    if (suppressDeckInput) return;
    if (cooling) { e.preventDefault(); return; }
    const dy = touchStartY - e.touches[0].clientY;
    if (touchAction === null && Math.abs(dy) > 6) {
      const goingNext = dy > 0;
      if (goingNext && current < panels.length - 1) touchAction = 'next';
      else if (!goingNext && current > 0) touchAction = 'prev';
      else touchAction = 'pass';
    }
    if (touchAction === 'next' || touchAction === 'prev') e.preventDefault();
  }, { passive: false });

  stage.addEventListener('touchend', (e) => {
    if (touchStartY === null) return;
    const dy = touchStartY - (e.changedTouches[0] ? e.changedTouches[0].clientY : touchStartY);
    if (!suppressDeckInput && Math.abs(dy) > 28) {
      if (dy > 0 && current < panels.length - 1) goTo(current + 1);
      else if (dy < 0 && current > 0) goTo(current - 1);
    }
    touchStartY = null;
    touchAction = null;
  }, { passive: true });
}
