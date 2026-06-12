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
    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      if (header) header.classList.toggle('scrolled', y > 30);
      if (back) back.classList.toggle('show', y > window.innerHeight * 0.9);
      if (bar) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Tracking meter sync ---------- */
  function initMeter() {
    var steps = [].slice.call(document.querySelectorAll('.step'));
    var segs = [].slice.call(document.querySelectorAll('.meter span'));
    if (!steps.length || !segs.length) return;
    function update() {
      var vh = window.innerHeight;
      var active = -1;
      steps.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        if (r.top < vh * 0.6) active = i;
      });
      segs.forEach(function (seg, i) { seg.classList.toggle('on', i <= active); });
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
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

  /* ---------- Hero + closing video autoplay nudge ---------- */
  function initVideo() {
    var vids = [].slice.call(document.querySelectorAll('.hero-video, .closing-video, .how-video'));
    if (!vids.length) return;
    function nudge() {
      vids.forEach(function (v) { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function(){}); });
    }
    nudge();
    vids.forEach(function (v) { v.addEventListener('canplay', nudge, { once: true }); });
    document.addEventListener('click', nudge, { once: true });
    document.addEventListener('touchstart', nudge, { once: true });
  }

  /* ---------- How-it-works tabbed video ---------- */
  function initHowTabs() {
    var tabs = [].slice.call(document.querySelectorAll('.how-tab'));
    var panels = [].slice.call(document.querySelectorAll('.how-panel'));
    if (!tabs.length || !panels.length) return;
    function activate(key) {
      tabs.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-tab') === key); });
      panels.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-panel') === key); });
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function (e) {
        if (e.target.closest('.explore')) return; // let the Explore link navigate
        activate(t.getAttribute('data-tab'));
      });
    });
  }

  function init(){ initReveals(); initParallax(); initScrollChrome(); initMeter(); initNav(); initCarousel(); initVideo(); initHowTabs();
    var y = document.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
