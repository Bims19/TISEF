const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(pointer: fine)').matches;

/* ---------- Preloader ---------- */
const preloader = document.getElementById('preloader');
if (preloader) {
  if (prefersReducedMotion) {
    document.body.classList.add('is-loaded');
  } else {
    document.body.style.overflow = 'hidden';
    const finishLoading = () => {
      document.body.classList.add('is-loaded');
      document.body.style.overflow = '';
    };
    // Timed to let the full mark-drawing sequence (~2.25s) play out
    window.addEventListener('load', () => setTimeout(finishLoading, 2300));
    // Safety fallback in case the load event is delayed
    setTimeout(finishLoading, 4600);
  }
} else {
  document.body.classList.add('is-loaded');
}

/* ---------- Custom cursor ----------
   A precise dot tracks the pointer exactly; a trailing diamond "compass"
   ring eases behind it and rotates to face the direction of travel —
   a wayfinding mark rather than a generic circle. It settles into a
   plain ring over ordinary links/buttons, and morphs into a labeled
   pill over elements that benefit from a hint (open a stage, filter). */
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
const cursorLabel = document.getElementById('cursorLabel');

if (cursorDot && cursorRing && isFinePointer && !prefersReducedMotion) {
  document.body.classList.add('has-cursor');
  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0, lastAngle = 45;
  let isHovering = false;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.classList.add('is-visible');
    cursorRing.classList.add('is-visible');
    cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  });

  document.addEventListener('mouseleave', () => {
    cursorDot.classList.remove('is-visible');
    cursorRing.classList.remove('is-visible');
  });

  function cursorLoop() {
    const dx = mouseX - ringX;
    const dy = mouseY - ringY;
    ringX += dx * 0.16;
    ringY += dy * 0.16;
    const speed = Math.sqrt(dx * dx + dy * dy);

    if (isHovering) {
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    } else {
      if (speed > 0.6) lastAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%) rotate(${lastAngle + 45}deg)`;
    }
    requestAnimationFrame(cursorLoop);
  }
  cursorLoop();

  const genericTargets = 'a, button, input, textarea, .program-card';
  document.querySelectorAll(genericTargets).forEach((el) => {
    el.addEventListener('mouseenter', () => { isHovering = true; cursorRing.classList.add('is-hover'); });
    el.addEventListener('mouseleave', () => { isHovering = false; cursorRing.classList.remove('is-hover'); });
  });

  document.querySelectorAll('[data-cursor]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      isHovering = true;
      cursorRing.classList.add('is-hover-label');
      if (cursorLabel) cursorLabel.textContent = el.getAttribute('data-cursor');
    });
    el.addEventListener('mouseleave', () => {
      isHovering = false;
      cursorRing.classList.remove('is-hover-label');
      if (cursorLabel) cursorLabel.textContent = '';
    });
  });
}

/* ---------- Magnetic buttons ---------- */
if (isFinePointer && !prefersReducedMotion) {
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.22}px, ${y * 0.28}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

/* ---------- Scroll progress + header + back-to-top ---------- */
const scrollProgress = document.getElementById('scrollProgress');
const siteHeader = document.getElementById('siteHeader');
const backToTop = document.getElementById('backToTop');

function onScrollFrame() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (scrollProgress) scrollProgress.style.width = pct + '%';

  if (siteHeader) siteHeader.classList.toggle('is-scrolled', scrollTop > 12);
  if (backToTop) backToTop.classList.toggle('is-shown', scrollTop > 600);
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => { onScrollFrame(); ticking = false; });
    ticking = true;
  }
}, { passive: true });

if (backToTop) {
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------- Mobile nav toggle ---------- */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---------- Scroll-spy: nav links + side dot-nav share [data-nav] ---------- */
const navAnchors = document.querySelectorAll('[data-nav]');
const spySections = Array.from(navAnchors)
  .map((a) => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);
const uniqueSpySections = Array.from(new Set(spySections));

if (uniqueSpySections.length && navAnchors.length) {
  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = '#' + entry.target.id;
      navAnchors.forEach((a) => a.classList.remove('is-active'));
      document.querySelectorAll(`[data-nav][href="${id}"]`).forEach((link) => link.classList.add('is-active'));
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  uniqueSpySections.forEach((section) => spyObserver.observe(section));
}

/* ---------- Reveal-on-scroll for section heads ---------- */
const revealEls = document.querySelectorAll('.reveal-on-scroll');
if (revealEls.length) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  revealEls.forEach((el) => revealObserver.observe(el));
}

/* ---------- Kinetic manifesto reveal ---------- */
const manifestoText = document.getElementById('manifestoText');
if (manifestoText) {
  const manifestoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        manifestoText.classList.add('is-visible');
        manifestoObserver.unobserve(manifestoText);
      }
    });
  }, { threshold: 0.4 });
  manifestoObserver.observe(manifestoText);
}

/* ---------- Count-up numerals ---------- */
const countEls = document.querySelectorAll('[data-count-to]');
function animateCount(el) {
  const target = parseInt(el.getAttribute('data-count-to'), 10);
  if (isNaN(target)) return;
  const duration = 1000;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}
if (countEls.length) {
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  countEls.forEach((el) => countObserver.observe(el));
}

/* ---------- Interactive pillar accordion + timeline ---------- */
const pillars = document.querySelectorAll('[data-pillar]');
const timelineProgress = document.getElementById('timelineProgress');
const timelineNodes = document.querySelectorAll('.timeline-node');

function updateTimeline(openIndex) {
  if (timelineProgress) {
    const pct = openIndex === -1 ? 0 : ((openIndex + 1) / pillars.length) * 100;
    timelineProgress.style.width = pct + '%';
  }
  timelineNodes.forEach((node, i) => node.classList.toggle('is-active', openIndex !== -1 && i <= openIndex));
}

pillars.forEach((pillar, index) => {
  pillar.addEventListener('click', () => {
    const wasOpen = pillar.classList.contains('is-open');
    pillars.forEach((p) => p.classList.remove('is-open'));
    if (!wasOpen) {
      pillar.classList.add('is-open');
      updateTimeline(index);
    } else {
      updateTimeline(-1);
    }
  });
});

/* ---------- Filterable programs ---------- */
const filterPills = document.querySelectorAll('.filter-pill');
const programCards = document.querySelectorAll('.program-card');

function applyFilter(filter) {
  programCards.forEach((card) => {
    const match = filter === 'all' || card.getAttribute('data-pillar') === filter;
    if (match) {
      card.style.display = '';
      requestAnimationFrame(() => card.classList.remove('is-hidden'));
    } else {
      card.classList.add('is-hidden');
      setTimeout(() => {
        if (card.classList.contains('is-hidden')) card.style.display = 'none';
      }, 300);
    }
  });
}

filterPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    filterPills.forEach((p) => { p.classList.remove('is-active'); p.setAttribute('aria-selected', 'false'); });
    pill.classList.add('is-active');
    pill.setAttribute('aria-selected', 'true');
    applyFilter(pill.getAttribute('data-filter'));
  });
});

/* ---------- Hero art parallax on mouse move (desktop only) ---------- */
const heroArtSvg = document.querySelector('.hero-art svg');
if (heroArtSvg && isFinePointer && !prefersReducedMotion && window.matchMedia('(min-width: 981px)').matches) {
  const heroSection = document.querySelector('.hero');
  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    heroArtSvg.style.transform = `rotate(${x * 3}deg) translate(${x * 6}px, ${y * 6}px)`;
  });
  heroSection.addEventListener('mouseleave', () => { heroArtSvg.style.transform = ''; });
}

/* ---------- Footer year ---------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Contact form — inline success state ---------- */
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    contactForm.querySelectorAll('[required]').forEach((field) => {
      if (!field.value.trim()) {
        valid = false;
        field.style.borderColor = '#D85A30';
      } else {
        field.style.borderColor = '';
      }
    });
    if (!valid) return;
    if (formSuccess) formSuccess.classList.add('is-shown');
    contactForm.reset();
  });
}
