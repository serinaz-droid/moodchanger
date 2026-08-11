/* ============================================================
   MoodChanger · Athletes — motion layer
   Carv-style: smooth scroll reveals, parallax, header transition.
   Reveal logic is rect-based + rAF so content can never stay hidden.
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- Scroll reveals ---------- */
  function initReveals() {
    var els = [].slice.call(document.querySelectorAll('.reveal, .rule, .step'));
    if (!els.length) return;
    var done = [];
    function show(el) {
      if (done.indexOf(el) !== -1) return;
      done.push(el);
      var d = parseFloat(el.getAttribute('data-delay') || '0');
      if (reduce) d = 0;
      el.style.transitionDelay = d + 'ms';
      el.classList.add('in');
    }
    function check() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (done.indexOf(el) !== -1) continue;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.86 && r.bottom > 0) show(el);
      }
    }
    if (reduce) { els.forEach(show); return; }
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    var f = 0;
    (function loop(){ check(); if (done.length < els.length && f++ < 240) requestAnimationFrame(loop); })();
  }

  /* ---------- Parallax ---------- */
  function initParallax() {
    if (reduce) return;
    var nodes = [].slice.call(document.querySelectorAll('[data-parallax]'));
    if (!nodes.length) return;
    var ticking = false;
    function apply() {
      var vh = window.innerHeight;
      nodes.forEach(function (n) {
        var r = n.getBoundingClientRect();
        var rel = (r.top + r.height / 2 - vh / 2) / vh;
        var sp = parseFloat(n.getAttribute('data-parallax') || '0.12');
        n.style.transform = 'translate3d(0,' + (rel * sp * 100).toFixed(2) + 'px,0)';
      });
      ticking = false;
    }
    function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(apply); } }
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  /* ---------- Header + scroll progress + back-home ---------- */
  function initScrollChrome() {
    var header = document.querySelector('[data-header]');
    var bar = document.querySelector('.progress');
    var back = document.querySelector('.backhome');
    var topBtn = document.querySelector('.to-top');
    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      if (header) header.classList.toggle('scrolled', y > 30);
      if (back) back.classList.toggle('show', y > window.innerHeight * 0.9);
      if (topBtn) topBtn.classList.toggle('show', y > window.innerHeight * 0.6);
      if (bar) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    if (topBtn) topBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Tracking meter sync ---------- */
  function initMeter() {
    var groups = [].slice.call(document.querySelectorAll('.track-grid'));
    groups.forEach(function (grid) {
      var steps = [].slice.call(grid.querySelectorAll('.step'));
      var segs = [].slice.call(grid.querySelectorAll('.meter span'));
      if (!steps.length) return;
      function setActive(idx) {
        steps.forEach(function (s, i) { s.classList.toggle('active', i === idx); });
        segs.forEach(function (seg, i) { seg.classList.toggle('on', i <= idx); });
      }
      steps.forEach(function (s, i) {
        s.addEventListener('mouseenter', function () { if (window.matchMedia('(hover:hover)').matches) setActive(i); });
        s.addEventListener('click', function () { setActive(i); });
      });
      setActive(0);
    });
  }

  /* ---------- Mobile nav ---------- */
  function initNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-nav]');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    // mobile: tap trigger toggles its own submenu
    [].slice.call(nav.querySelectorAll('.trigger')).forEach(function (t) {
      t.addEventListener('click', function () {
        if (window.innerWidth <= 760) t.parentElement.classList.toggle('open');
      });
    });
  }

  /* ---------- Feature carousel ---------- */
  function initCarousel() {
    var track = document.querySelector('.feature-track');
    if (!track) return;
    var carousel = document.querySelector('.feature-carousel');
    var slides = track.children;
    var prev = document.querySelector('[data-carousel-prev]');
    var next = document.querySelector('[data-carousel-next]');
    var dots = [].slice.call(document.querySelectorAll('.carousel-dots button'));
    var i = 0, seen = false;
    function animatePoints(idx) {
      for (var k = 0; k < slides.length; k++) slides[k].classList.remove('show-points');
      void slides[idx].offsetWidth; // reflow so the stagger replays
      slides[idx].classList.add('show-points');
    }
    function go(n) {
      i = (n + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-i * 100) + '%)';
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
      if (seen) animatePoints(i);
    }
    if (next) next.addEventListener('click', function () { go(i + 1); });
    if (prev) prev.addEventListener('click', function () { go(i - 1); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
    go(0);
    // trigger the first stagger only once the carousel is on screen
    if (reduce) { seen = true; for (var k = 0; k < slides.length; k++) slides[k].classList.add('show-points'); return; }
    function check() {
      if (seen) return;
      var r = carousel.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.8 && r.bottom > 0) { seen = true; animatePoints(i); }
    }
    check();
    window.addEventListener('scroll', check, { passive: true });
    var f = 0;
    (function loop(){ check(); if (!seen && f++ < 240) requestAnimationFrame(loop); })();
  }

  /* ---------- Video: eager hero, lazy below-the-fold ---------- */
  function play(v){ if(!v) return; v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function(){}); }
  function initVideo() {
    // Above-the-fold hero videos: start immediately (poster paints for LCP).
    var heroes = [].slice.call(document.querySelectorAll('.hero-video'));
    heroes.forEach(function (v) { play(v); v.addEventListener('canplay', function(){ play(v); }, { once: true }); });
    if (heroes.length) {
      var kick = function(){ heroes.forEach(play); };
      document.addEventListener('click', kick, { once: true });
      document.addEventListener('touchstart', kick, { once: true });
    }
    // Below-the-fold closing videos: preload="none" in markup, so nothing
    // downloads until they near the viewport (huge initial-payload saving).
    var lazies = [].slice.call(document.querySelectorAll('.closing-video'));
    if (lazies.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) { if (e.isIntersecting) { play(e.target); io.unobserve(e.target); } });
      }, { rootMargin: '500px 0px' });
      lazies.forEach(function (v) { io.observe(v); });
    } else { lazies.forEach(play); }
  }

  /* ---------- How-it-works tabbed video (load only what is viewed) ---------- */
  function initHowTabs() {
    var tabs = [].slice.call(document.querySelectorAll('.how-tab'));
    var panels = [].slice.call(document.querySelectorAll('.how-panel'));
    if (!tabs.length || !panels.length) return;
    function loadPanel(p) { if (p) play(p.querySelector('video')); }
    function activate(key) {
      tabs.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-tab') === key); });
      panels.forEach(function (p) {
        var on = p.getAttribute('data-panel') === key;
        p.classList.toggle('active', on);
        if (on) loadPanel(p);
      });
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function (e) {
        if (e.target.closest('.explore')) return; // let the Explore link navigate
        activate(t.getAttribute('data-tab'));
      });
    });
    // Load the initially-active panel's video only when the module scrolls near.
    var active = document.querySelector('.how-panel.active');
    var screen = document.querySelector('.how-screen') || active;
    if (active && screen && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) { if (e.isIntersecting) { loadPanel(active); io.disconnect(); } });
      }, { rootMargin: '500px 0px' });
      io.observe(screen);
    } else { loadPanel(active); }
  }

  /* ---------- Theme toggle (light / dark, persisted) ---------- */
  function initTheme() {
    var root = document.documentElement;
    var KEY = 'mc-theme';
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved !== 'light' && saved !== 'dark') saved = 'light';
    apply(saved);
    function apply(t) {
      root.setAttribute('data-theme', t);
      [].slice.call(document.querySelectorAll('[data-theme-toggle]')).forEach(function (b) {
        b.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
        b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      });
    }
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-theme-toggle]');
      if (!btn) return;
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
    });
  }

  function init(){ initTheme(); initReveals(); initParallax(); initScrollChrome(); initMeter(); initNav(); initCarousel(); initVideo(); initHowTabs();
    var y = document.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
