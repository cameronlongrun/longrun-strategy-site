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
// the same offset the #services anchor link lands on, see --header-h).
// Scroll is only intercepted for the FIRST pass through the five cards, so
// the visitor sees the whole deck once without accidentally scrolling past
// it. The instant that first forward pass finishes (reaching the last card
// and trying to continue), the lock releases permanently for the rest of
// the page's life, the deck stops touching wheel/touch input entirely, and
// the page scrolls normally from then on. After that, the only way to
// revisit an earlier card is the Prev/Next buttons, which always work
// regardless of lock state.
const stage = document.getElementById('services-stage');
const accordion = document.getElementById('accordion');

if (stage && accordion) {
  const panels = Array.from(accordion.querySelectorAll('.acc-panel'));
  const prevBtn = document.getElementById('acc-prev');
  const nextBtn = document.getElementById('acc-next');
  const counterEl = document.getElementById('acc-counter');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Longer than the CSS flip transition so a fast scroll fling can't queue
  // up several flips at once, each flip gets its own full cooldown.
  const COOLDOWN_MS = reduceMotion ? 0 : 950;
  let current = 0;
  let cooling = false;
  let cooldownTimer = null;
  let lockReleased = false;

  function render() {
    panels.forEach((panel, i) => {
      const slot = i - current;
      panel.classList.toggle('is-open', slot === 0);
      panel.dataset.slot = slot < 0 ? 'passed' : String(Math.min(slot, 4));
    });
    if (counterEl) {
      counterEl.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(panels.length).padStart(2, '0');
    }
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === panels.length - 1;
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

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  stage.addEventListener('wheel', (e) => {
    if (lockReleased || suppressDeckInput) return;
    if (cooling) { e.preventDefault(); return; }
    const goingNext = e.deltaY > 0;
    if (goingNext && current < panels.length - 1) {
      e.preventDefault();
      goTo(current + 1);
    } else if (!goingNext && current > 0) {
      e.preventDefault();
      goTo(current - 1);
    } else if (goingNext && current === panels.length - 1) {
      // First full pass just finished: release the lock for good and let
      // this scroll (and every one after it) move the page as normal.
      lockReleased = true;
    }
  }, { passive: false });

  let touchStartY = null;
  let touchAction = null; // 'next' | 'prev' | 'pass'

  stage.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchAction = null;
  }, { passive: true });

  stage.addEventListener('touchmove', (e) => {
    if (touchStartY === null) return;
    if (lockReleased || suppressDeckInput) return;
    if (cooling) { e.preventDefault(); return; }
    const dy = touchStartY - e.touches[0].clientY;
    if (touchAction === null && Math.abs(dy) > 6) {
      const goingNext = dy > 0;
      if (goingNext && current < panels.length - 1) touchAction = 'next';
      else if (!goingNext && current > 0) touchAction = 'prev';
      else {
        touchAction = 'pass';
        if (goingNext && current === panels.length - 1) lockReleased = true;
      }
    }
    if (touchAction === 'next' || touchAction === 'prev') e.preventDefault();
  }, { passive: false });

  stage.addEventListener('touchend', (e) => {
    if (touchStartY === null) return;
    if (!lockReleased && !suppressDeckInput) {
      const dy = touchStartY - (e.changedTouches[0] ? e.changedTouches[0].clientY : touchStartY);
      if (Math.abs(dy) > 28) {
        if (dy > 0 && current < panels.length - 1) goTo(current + 1);
        else if (dy < 0 && current > 0) goTo(current - 1);
      }
    }
    touchStartY = null;
    touchAction = null;
  }, { passive: true });
}
