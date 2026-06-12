/* ============================================================
   MoodChanger · Pets — interactive layers
   1) Our Vision: WHOOP-style vertical feature list — the active
      item expands its description; auto-advances; click to jump.
   2) Flomad Smart Pet Devices: WHOOP-style tabbed showcase —
      background image per device, tabs + progress bar, info
      below the product name; auto-advances; click a tab to jump.
   (Reveals / header / Pet's World carousel come from athletes.js)
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------------- 1) VISION FEATURE LIST ---------------- */
  (function vision() {
    var list = document.querySelector('[data-visionlist]');
    if (!list) return;
    var feats = [].slice.call(list.querySelectorAll('.vfeat'));
    var imgs = [].slice.call(document.querySelectorAll('.vision-media .vision-img'));
    var n = feats.length, cur = 0, timer = null;
    var DUR = 4200;

    function set(idx) {
      cur = (idx + n) % n;
      feats.forEach(function (f, k) { f.classList.toggle('on', k === cur); });
      imgs.forEach(function (im, k) { im.classList.toggle('on', k === cur); });
    }
    function play() {
      if (reduce) return;
      stop();
      timer = setInterval(function () { set(cur + 1); }, DUR);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    feats.forEach(function (f, k) {
      f.addEventListener('click', function () { set(k); play(); });
    });
    set(0);

    // start when section scrolls into view
    var sec = list.closest('section');
    if ('IntersectionObserver' in window && sec) {
      new IntersectionObserver(function (ents) {
        ents.forEach(function (e) { e.isIntersecting ? play() : stop(); });
      }, { threshold: 0.25 }).observe(sec);
    } else play();
  })();

  /* ---------------- 2) DEVICES SHOWCASE (2/3 image + 1/3 accordion) ---------------- */
  (function devices() {
    var show = document.querySelector('[data-devshow]');
    if (!show) return;
    var tabs = [].slice.call(show.querySelectorAll('.dev-tab'));
    var bgs = [].slice.call(show.querySelectorAll('.dev-bg'));
    var n = tabs.length, cur = 0, timer = null;
    var DUR = 4600;

    function set(idx) {
      cur = (idx + n) % n;
      tabs.forEach(function (t, k) { t.classList.toggle('on', k === cur); });
      bgs.forEach(function (b, k) { b.classList.toggle('on', k === cur); });
    }
    function play() { if (reduce) return; stop(); timer = setInterval(function () { set(cur + 1); }, DUR); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { set(k); });
    });
    set(0);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (ents) {
        ents.forEach(function (e) { e.isIntersecting ? play() : stop(); });
      }, { threshold: 0.2 }).observe(show);
    } else play();
  })();
})();
