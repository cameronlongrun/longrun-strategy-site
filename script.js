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

// Services accordion: a stacked deck of cards, at every screen size.
// Scrolling or swiping over it flips the front card back to reveal the next
// one, like flipping through a hand of cards, instead of scrolling text.
// Once you flip past the first or last card, the gesture passes through and
// the page scrolls normally.
const accordion = document.getElementById('accordion');

if (accordion) {
  const panels = Array.from(accordion.querySelectorAll('.acc-panel'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ANIM_MS = reduceMotion ? 0 : 600;
  let current = 0;
  let animating = false;
  let animLock = null;

  function render() {
    panels.forEach((panel, i) => {
      const slot = i - current;
      panel.classList.toggle('is-open', slot === 0);
      panel.dataset.slot = slot < 0 ? 'passed' : String(Math.min(slot, 4));
    });
  }

  function goTo(index) {
    const clamped = Math.max(0, Math.min(panels.length - 1, index));
    if (clamped === current) return;
    current = clamped;
    render();
    animating = true;
    clearTimeout(animLock);
    animLock = setTimeout(() => { animating = false; }, ANIM_MS);
  }

  render();

  panels.forEach((panel, i) => {
    panel.addEventListener('click', () => goTo(i));
  });

  accordion.addEventListener('wheel', (e) => {
    if (animating) { e.preventDefault(); return; }
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

  accordion.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchAction = null;
  }, { passive: true });

  accordion.addEventListener('touchmove', (e) => {
    if (touchStartY === null) return;
    const dy = touchStartY - e.touches[0].clientY;
    if (touchAction === null && Math.abs(dy) > 6) {
      const goingNext = dy > 0;
      if (goingNext && current < panels.length - 1) touchAction = 'next';
      else if (!goingNext && current > 0) touchAction = 'prev';
      else touchAction = 'pass';
    }
    if (touchAction === 'next' || touchAction === 'prev') e.preventDefault();
  }, { passive: false });

  accordion.addEventListener('touchend', (e) => {
    if (touchStartY === null) return;
    const dy = touchStartY - (e.changedTouches[0] ? e.changedTouches[0].clientY : touchStartY);
    if (Math.abs(dy) > 28) {
      if (dy > 0 && current < panels.length - 1) goTo(current + 1);
      else if (dy < 0 && current > 0) goTo(current - 1);
    }
    touchStartY = null;
    touchAction = null;
  }, { passive: true });
}
