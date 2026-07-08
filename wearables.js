/* ============================================================
   MoodChanger · Wearables — showcase + detail controller
   - Full-screen auto-advancing carousel (big image · name · intro)
   - Click a slide  -> opens the focused detail view for it
   - Detail view: prev / next between wearables, close to return
   - URL hash (#smart-ring) deep-links straight into a detail
   (header chrome / mobile nav come from athletes.js)
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  var slides   = [].slice.call(document.querySelectorAll('.show-slide'));
  var dots     = [].slice.call(document.querySelectorAll('.show-dots button'));
  var panels   = [].slice.call(document.querySelectorAll('.detail-panel'));
  var fill     = document.querySelector('.show-strip .fill');
  var curEl    = document.querySelector('.show-count .cur');
  var detail   = document.querySelector('.detail');
  var whereIx  = document.querySelector('.detail-where .ix');
  var whereNm  = document.querySelector('.detail-where .nm');
  if (!slides.length) return;

  var ids = slides.map(function (s) { return s.getAttribute('data-w'); });
  var N = slides.length;
  var i = 0;                 // active showcase slide
  var DUR = 5200;            // autoplay interval (ms)
  var t0 = 0, raf = 0, paused = false, detailOpen = false;

  function pad(n){ return (n + 1 < 10 ? '0' : '') + (n + 1); }

  /* ---------- showcase ---------- */
  function setSlide(n, resetTimer) {
    i = (n + N) % N;
    slides.forEach(function (s, k) { s.classList.toggle('active', k === i); });
    dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    if (curEl) curEl.textContent = pad(i);
    if (resetTimer !== false) t0 = performance.now();
  }
  function tick(now) {
    if (!paused && !detailOpen) {
      var p = (now - t0) / DUR;
      if (p >= 1) { setSlide(i + 1); p = 0; }
      if (fill) fill.style.width = (Math.min(p, 1) * 100) + '%';
    } else {
      t0 = now - 0; // hold
    }
    raf = requestAnimationFrame(tick);
  }

  var sc = document.querySelector('.showcase');
  if (sc) {
    sc.addEventListener('mouseenter', function () { paused = true; });
    sc.addEventListener('mouseleave', function () { paused = false; t0 = performance.now(); });
    // freeze autoplay the instant a press begins so the active slide can't
    // change between press and click (was causing detail to open the NEXT item)
    sc.addEventListener('pointerdown', function () { paused = true; });
  }
  var nextBtn = document.querySelector('.show-controls .next');
  var prevBtn = document.querySelector('.show-controls .prev');
  if (nextBtn) nextBtn.addEventListener('click', function () { setSlide(i + 1); });
  if (prevBtn) prevBtn.addEventListener('click', function () { setSlide(i - 1); });
  dots.forEach(function (d, k) { d.addEventListener('click', function () { setSlide(k); }); });

  // click a slide's content/image -> open the CURRENTLY active wearable's detail
  // (use the live active index `i`, not a stale closure, so a mid-fade slide
  //  stacked on top can never hijack the click to the next item)
  slides.forEach(function (s) {
    var open = function () { openDetail(i); };
    var content = s.querySelector('.show-content');
    var shot = s.querySelector('.shot');
    if (content) content.addEventListener('click', open);
    if (shot) shot.addEventListener('click', open);
  });

  setSlide(0);
  if (reduce) { if (fill) fill.style.display = 'none'; }
  else raf = requestAnimationFrame(tick);

  /* ---------- detail view ---------- */
  function showPanel(idx) {
    idx = (idx + N) % N;
    panels.forEach(function (p, k) { p.classList.toggle('active', k === idx); });
    if (whereIx) whereIx.textContent = pad(idx) + ' / ' + N;
    if (whereNm) whereNm.textContent = panels[idx].getAttribute('data-name') || '';
    detail.scrollTop = 0;
    return idx;
  }
  var dIdx = 0;
  function openDetail(idx) {
    dIdx = showPanel(idx);
    detailOpen = true;
    document.body.classList.add('detail-open');
    detail.classList.add('open');
    if (history.replaceState) history.replaceState(null, '', '#' + ids[dIdx]);
    else location.hash = ids[dIdx];
  }
  function closeDetail() {
    detailOpen = false;
    document.body.classList.remove('detail-open');
    detail.classList.remove('open');
    setSlide(dIdx);                       // sync showcase to where we were
    t0 = performance.now();
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    else location.hash = '';
  }
  function stepDetail(dir) { dIdx = showPanel(dIdx + dir);
    if (history.replaceState) history.replaceState(null, '', '#' + ids[dIdx]); }

  var closeBtn = document.querySelector('.detail-close');
  var dNext = document.querySelector('.detail-arrows .next');
  var dPrev = document.querySelector('.detail-arrows .prev');
  if (closeBtn) closeBtn.addEventListener('click', closeDetail);
  if (dNext) dNext.addEventListener('click', function () { stepDetail(1); });
  if (dPrev) dPrev.addEventListener('click', function () { stepDetail(-1); });

  // keyboard
  document.addEventListener('keydown', function (e) {
    if (detailOpen) {
      if (e.key === 'Escape') closeDetail();
      else if (e.key === 'ArrowRight') stepDetail(1);
      else if (e.key === 'ArrowLeft') stepDetail(-1);
    } else {
      if (e.key === 'ArrowRight') setSlide(i + 1);
      else if (e.key === 'ArrowLeft') setSlide(i - 1);
    }
  });

  // deep-link: open detail if the URL points at a wearable
  function fromHash() {
    var h = (location.hash || '').replace('#', '');
    var k = ids.indexOf(h);
    if (k !== -1) openDetail(k);
  }
  fromHash();
  // header dropdown links are in-page (#id) — intercept to open the detail view
  document.addEventListener('click', function (e) {
    // "Wearables" trigger -> go to the All Wearables showcase (close any detail, scroll to top)
    var trig = e.target.closest('[data-all-wearables]');
    if (trig) {
      e.preventDefault();
      if (detailOpen) closeDetail();
      document.body.classList.remove('nav-open');
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      return;
    }
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var k = ids.indexOf(id);
    if (k !== -1) { e.preventDefault(); openDetail(k); document.body.classList.remove('nav-open'); }
  });
})();
