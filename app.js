/* ============================================================
   MoodChanger.AI — interactions  (v2 · calm premium)
   Theme · mobile sheet · gentle scroll reveal · counters ·
   nav shadow · horizontal carousels · newsletter
   ============================================================ */
(function () {
  const root = document.documentElement;

  /* ---- theme (persisted, light by default) ---- */
  const saved = localStorage.getItem('mc-theme');
  root.setAttribute('data-theme', saved || 'light');

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', root.getAttribute('data-theme') === 'dark');
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      localStorage.setItem('mc-theme', next);
      toggle.setAttribute('aria-pressed', next === 'dark');
    });
  }

  /* ---- mobile sheet ---- */
  const burger = document.getElementById('burger');
  const sheet = document.getElementById('sheet');
  if (burger && sheet) {
    burger.addEventListener('click', () => {
      const open = sheet.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      sheet.classList.remove('open'); document.body.style.overflow = '';
    }));
  }

  /* ---- gentle scroll reveal (runs on load + scroll) ---- */
  const reveals = [...document.querySelectorAll('.reveal')];
  function checkReveals() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    for (let i = reveals.length - 1; i >= 0; i--) {
      const el = reveals[i];
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) {
        el.classList.add('in');
        reveals.splice(i, 1);
      }
    }
  }
  checkReveals();
  requestAnimationFrame(checkReveals);
  window.addEventListener('scroll', checkReveals, { passive: true });
  window.addEventListener('load', checkReveals);
  window.addEventListener('resize', checkReveals);

  /* ---- stat counters ---- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const dur = 1400; const start = performance.now();
    const isInt = Number.isInteger(target);
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = target * eased;
      el.firstChild.textContent = isInt ? Math.round(v).toString() : v.toFixed(0);
      if (p < 1) requestAnimationFrame(step);
      else el.firstChild.textContent = isInt ? target.toString() : target.toFixed(0);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    const statIO = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); statIO.unobserve(e.target); } });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(el => statIO.observe(el));
  } else {
    document.querySelectorAll('[data-count]').forEach(animateCount);
  }

  /* ---- nav hairline shadow on scroll (theme-aware, subtle) ---- */
  const nav = document.querySelector('.nav');
  const onScroll = () => {
    if (!nav) return;
    const dark = root.getAttribute('data-theme') === 'dark';
    nav.style.boxShadow = window.scrollY > 8
      ? (dark ? '0 10px 30px -20px rgba(0,0,0,.7)' : '0 10px 30px -22px rgba(28,66,89,.28)')
      : 'none';
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---- transparent-nav pages: swap to a solid panel once scrolled past the hero ---- */
  if (nav) {
    const navSolid = () => nav.classList.toggle('nav-solid', window.scrollY > 60);
    window.addEventListener('scroll', navSolid, { passive: true }); navSolid();
  }

  /* ---- horizontal carousels (arrows + drag-to-scroll) ---- */
  document.querySelectorAll('.carousel').forEach((car) => {
    const track = car.querySelector('.car-track');
    const btns = car.querySelectorAll('.car-btn');
    if (!track) return;
    const stepW = () => {
      const c = track.querySelector('.card');
      return (c ? c.getBoundingClientRect().width + 24 : 300) * 1.4;
    };
    btns.forEach((b) => b.addEventListener('click', () => {
      track.scrollBy({ left: parseInt(b.dataset.dir, 10) * stepW(), behavior: 'smooth' });
    }));
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      const cnav = car.querySelector('.car-nav');
      const scrollable = track.scrollWidth > track.clientWidth + 4;
      if (cnav) cnav.style.display = scrollable ? '' : 'none';
      btns.forEach((b) => {
        const dir = parseInt(b.dataset.dir, 10);
        b.disabled = (dir < 0 && track.scrollLeft <= 2) || (dir > 0 && track.scrollLeft >= max);
      });
    };
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    // drag to scroll
    let down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('pointerdown', (e) => {
      down = true; moved = false; sx = e.clientX; sl = track.scrollLeft;
      track.classList.add('dragging'); track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = sl - dx;
    });
    const end = () => { down = false; track.classList.remove('dragging'); };
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);
    track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  /* ---- newsletter form ---- */
  const nForm = document.querySelector('.f-news-form');
  if (nForm) {
    nForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = nForm.querySelector('.f-news-input');
      const btn = nForm.querySelector('.f-news-btn');
      if (input && input.value.trim() && /\S+@\S+\.\S+/.test(input.value)) {
        btn.textContent = 'Subscribed ✓';
        input.value = '';
        input.placeholder = "You're on the list";
        setTimeout(() => { btn.textContent = 'Subscribe'; input.placeholder = 'Enter your email'; }, 2600);
      } else {
        input.focus();
      }
    });
  }
})();
