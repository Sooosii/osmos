/*
  OSMOS intro overlay — drop-in, framework agnostic.

  Usage:
    1. Include intro.css and this file on the page that already renders
       your live particle map (no changes needed to that code).
    2. Best result: before this script runs, set

         window.OSMOS_INTRO_POINTS = [
           { x: 42, y: 38, color: '#e0a15c' },   // x/y in % of a 280x280 box
           { x: 55, y: 44, color: '#d98fc0' },
           // ... one entry per real perfume dot, using its real color
         ];

       using the SAME positions/colors your live cluster already computes,
       so the intro hands off to the real map with zero visual jump.
       If you skip this, a procedurally generated cluster is used instead —
       still looks good, just won't perfectly match the live layout.
    3. To disable the intro entirely (e.g. on repeat visits), set
       window.OSMOS_INTRO_DISABLE = true before this script runs.
    4. Listen for document event 'osmos:intro:done' if you want your app
       to react once the intro has finished.
*/
(function () {
  function mount(points) {
    if (document.querySelector('.osmos-intro')) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pts = points && points.length ? points : generatePoints(56);

    var overlay = document.createElement('div');
    overlay.className = 'osmos-intro';

    var field = document.createElement('div');
    field.className = 'osmos-intro__field';
    overlay.appendChild(field);

    var dots = pts.map(function (p) {
      var d = document.createElement('div');
      d.className = 'osmos-intro__dot';
      var size = p.size || 4 + Math.random() * 10;
      var color = p.color || pickColor();
      d.style.width = size + 'px';
      d.style.height = size + 'px';
      d.style.left = p.x + '%';
      d.style.top = p.y + '%';
      d.style.background = color;
      d.style.boxShadow = '0 0 ' + size * 1.6 + 'px ' + size * 0.5 + 'px ' + color + '55';

      var startTransform = 'translate(-50%,-50%) scale(1)';
      if (!reduce) {
        var angle = Math.random() * Math.PI * 2;
        var dist = 220 + Math.random() * 260;
        var sx = Math.cos(angle) * dist;
        var sy = Math.sin(angle) * dist;
        startTransform = 'translate(-50%,-50%) translate(' + sx + 'px,' + sy + 'px) scale(.3)';
      }
      d.style.transform = startTransform;
      field.appendChild(d);
      return d;
    });

    var word = document.createElement('div');
    word.className = 'osmos-intro__word';
    word.textContent = 'osmos';
    overlay.appendChild(word);

    var tag = document.createElement('div');
    tag.className = 'osmos-intro__tag';
    // Sayı gömülü değil, noktalardan sayılıyor: parfüm eklenince perde de sayar.
    tag.textContent = pts.length + ' parfüm, nota akrabalığından doğan bir harita';
    overlay.appendChild(tag);

    var hint = document.createElement('div');
    hint.className = 'osmos-intro__hint';
    /*
     * Perde kalkınca sırada sürükleme değil YAKLAŞMA var (`space-approach.ts`):
     * uzay çok uzakta başlıyor ve tekerlekle geliniyor. Sürüklemek işe yarayan
     * bir hamle, ama sıradaki hamle değil.
     */
    hint.textContent = 'yaklaşmak için kaydır';
    overlay.appendChild(hint);

    document.body.appendChild(overlay);

    var timers = [];
    function schedule(fn, delay) {
      timers.push(setTimeout(fn, delay));
    }

    function leave() {
      timers.forEach(clearTimeout);
      overlay.classList.add('is-leaving');
      overlay.addEventListener('transitionend', function handler(e) {
        if (e.target !== overlay) return;
        overlay.remove();
        document.dispatchEvent(new CustomEvent('osmos:intro:done'));
        overlay.removeEventListener('transitionend', handler);
      });
    }

    overlay.addEventListener('click', leave);
    window.addEventListener('scroll', leave, { once: true, passive: true });
    window.addEventListener('wheel', leave, { once: true, passive: true });

    if (reduce) {
      requestAnimationFrame(function () {
        dots.forEach(function (d) { d.classList.add('is-in'); });
        word.classList.add('is-in');
        tag.classList.add('is-in');
        hint.classList.add('is-in');
      });
      schedule(leave, 1200);
      return;
    }

    requestAnimationFrame(function () {
      dots.forEach(function (d, i) {
        schedule(function () {
          d.style.transform = 'translate(-50%,-50%) scale(1)';
          d.classList.add('is-in');
        }, i * 10);
      });
    });

    schedule(function () { word.classList.add('is-in'); }, 1000);
    schedule(function () { tag.classList.add('is-in'); }, 1300);
    schedule(function () { hint.classList.add('is-in'); }, 1650);
    schedule(leave, 2600);
  }

  function pickColor() {
    var palette = ['#7fb3d9', '#e0a15c', '#d98fc0', '#8fc98a', '#b98fd9', '#e0c15c'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  function generatePoints(n) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var r = Math.pow(Math.random(), 0.5) * 42;
      pts.push({ x: 50 + Math.cos(a) * r, y: 50 + Math.sin(a) * r });
    }
    return pts;
  }

  window.OsmosIntro = { init: mount };
  document.addEventListener('DOMContentLoaded', function () {
    if (!window.OSMOS_INTRO_DISABLE) mount(window.OSMOS_INTRO_POINTS);
  });
})();
