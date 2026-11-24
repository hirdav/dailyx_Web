// DailyX — page behaviours: theme, scroll reveal, paint trail, draggable stickers, the try-it demo.
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  // where the art lives, relative to this page
  var scriptSrc = (document.currentScript && document.currentScript.getAttribute('src')) || 'assets/site.js';
  var ART = scriptSrc.replace('site.js', 'art/');

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  /* ---------- day / night ---------- */
  var nav = document.querySelector('.site-nav ul');
  if (nav) {
    var li = document.createElement('li');
    li.innerHTML = '<button class="theme-toggle" type="button" aria-label="Switch between day and night">' +
      '<img class="to-night" src="' + ART + 'moon.webp" alt="" /><img class="to-day" src="' + ART + 'sun.webp" alt="" /></button>';
    nav.appendChild(li);
    li.firstChild.addEventListener('click', function (e) {
      var night = doc.getAttribute('data-theme') !== 'night';
      if (night) doc.setAttribute('data-theme', 'night'); else doc.removeAttribute('data-theme');
      store('dailyx-theme', night ? 'night' : 'day');
      burst(e.clientX, e.clientY, night ? ['moon', 'sparkles'] : ['sun', 'sparkles'], 7);
    });
  }

  /* ---------- sticker bursts ---------- */
  function burst(x, y, names, count) {
    if (reduce) return;
    for (var i = 0; i < count; i++) {
      (function (i) {
        var el = document.createElement('i');
        el.className = 'bit';
        el.style.backgroundImage = 'url(' + ART + names[i % names.length] + '.webp)';
        el.style.left = x + 'px'; el.style.top = y + 'px';
        document.body.appendChild(el);
        var a = (Math.PI * 2 * i) / count + Math.random() * 0.6;
        var dist = 70 + Math.random() * 90;
        var dx = Math.cos(a) * dist, dy = Math.sin(a) * dist - 30;
        var spin = (Math.random() - 0.5) * 240;
        var anim = el.animate([
          { transform: 'translate(0,0) scale(.2) rotate(0deg)', opacity: 1 },
          { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(1.1) rotate(' + spin + 'deg)', opacity: 1, offset: 0.6 },
          { transform: 'translate(' + dx * 1.15 + 'px,' + (dy + 70) + 'px) scale(.5) rotate(' + spin * 1.4 + 'deg)', opacity: 0 }
        ], { duration: 850 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' });
        anim.onfinish = function () { el.remove(); };
      })(i);
    }
  }

  /* ---------- toast ---------- */
  var toastEl, toastTimer;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast'; toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    requestAnimationFrame(function () { toastEl.classList.add('show'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  /* ---------- reveal on scroll ---------- */
  var items = document.querySelectorAll('.reveal, .paint');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- reading progress ---------- */
  var bar = document.createElement('div');
  bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  function progress() {
    var max = doc.scrollHeight - window.innerHeight;
    bar.style.setProperty('--p', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
  }
  window.addEventListener('scroll', progress, { passive: true });
  progress();

  /* ---------- screenshot tabs ---------- */
  var buttons = document.querySelectorAll('.tab-button');
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var tab = button.getAttribute('data-tab');
      buttons.forEach(function (b) {
        var on = b === button;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      document.querySelectorAll('.tab-image').forEach(function (img) {
        img.classList.toggle('active', img.getAttribute('data-tab') === tab);
      });
    });
  });

  /* ---------- hero: parallax + stickers you can drag ---------- */
  var scene = document.querySelector('[data-parallax]');
  if (scene) {
    var layers = [].slice.call(scene.querySelectorAll('[data-depth]'));
    var state = layers.map(function (el) { return { el: el, d: parseFloat(el.getAttribute('data-depth')), x: 0, y: 0, px: 0, py: 0, held: false }; });
    function place(s) { s.el.style.translate = (s.x + s.px).toFixed(1) + 'px ' + (s.y + s.py).toFixed(1) + 'px'; }
    if (!reduce && finePointer) {
      window.addEventListener('pointermove', function (e) {
        var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
        state.forEach(function (s) { if (!s.held) { s.px = x * s.d * -40; s.py = y * s.d * -30; place(s); } });
      }, { passive: true });
    }
    state.forEach(function (s) {
      if (!s.el.classList.contains('grab')) return;
      var sx, sy, ox, oy, moved;
      s.el.addEventListener('pointerdown', function (e) {
        s.held = true; moved = 0; sx = e.clientX; sy = e.clientY; ox = s.x; oy = s.y;
        s.el.classList.add('held'); s.el.setPointerCapture(e.pointerId); e.preventDefault();
      });
      s.el.addEventListener('pointermove', function (e) {
        if (!s.held) return;
        s.x = ox + e.clientX - sx; s.y = oy + e.clientY - sy; moved += Math.abs(e.movementX) + Math.abs(e.movementY); place(s);
      });
      function drop(e) {
        if (!s.held) return;
        s.held = false; s.el.classList.remove('held');
        if (moved < 6) burst(e.clientX, e.clientY, ['sparkles'], 6);
        var hint = scene.querySelector('.hint'); if (hint) hint.style.opacity = 0;
      }
      s.el.addEventListener('pointerup', drop);
      s.el.addEventListener('pointercancel', drop);
    });
  }

  /* ---------- pointer paint trail ---------- */
  if (!reduce && finePointer && document.body.hasAttribute('data-paint')) {
    var canvas = document.createElement('canvas');
    canvas.id = 'paint'; canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var colours = ['#fbbf24', '#8b5cf6', '#8fd0fb', '#8ed968'];
    var pts = [], colour = 0, last = null, raf = 0, lastMove = 0;
    function size() { canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); window.addEventListener('resize', size);
    window.addEventListener('pointermove', function (e) {
      var now = performance.now();
      if (now - lastMove > 500) { colour = (colour + 1) % colours.length; last = null; }
      lastMove = now;
      var p = { x: e.clientX, y: e.clientY, t: now, c: colour, from: last };
      if (last) {
        var d = Math.hypot(p.x - last.x, p.y - last.y);
        if (d < 3) return;
        p.w = Math.max(5, Math.min(22, 26 - d * 0.35));
      } else { p.w = 14; }
      pts.push(p); last = p;
      if (pts.length > 160) pts.shift();
      if (!raf) raf = requestAnimationFrame(draw);
    }, { passive: true });
    function draw(now) {
      raf = 0;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      var life = 650;
      pts = pts.filter(function (p) { return now - p.t < life; });
      ctx.lineCap = 'round';
      pts.forEach(function (p) {
        if (!p.from) return;
        var k = 1 - (now - p.t) / life;
        ctx.globalAlpha = 0.34 * k;
        ctx.strokeStyle = colours[p.c];
        ctx.lineWidth = p.w * (0.5 + 0.5 * k);
        ctx.beginPath(); ctx.moveTo(p.from.x, p.from.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      });
      if (pts.length) raf = requestAnimationFrame(draw);
    }
  }

  /* ---------- sticker wall ---------- */
  document.querySelectorAll('.wall figure').forEach(function (fig) {
    fig.setAttribute('tabindex', '0');
    function pop(x, y) {
      fig.classList.add('boing');
      setTimeout(function () { fig.classList.remove('boing'); }, 160);
      burst(x, y, [fig.getAttribute('data-art'), 'sparkles'], 8);
      var say = fig.getAttribute('data-say'); if (say) toast(say);
    }
    fig.addEventListener('click', function (e) { pop(e.clientX, e.clientY); });
    fig.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); var r = fig.getBoundingClientRect(); pop(r.left + r.width / 2, r.top + r.height / 2);
    });
  });

  /* ---------- try it: a tiny working DailyX ---------- */
  var demo = document.querySelector('[data-demo]');
  if (demo) {
    var list = demo.querySelector('.tasks'), pill = demo.querySelector('.xp-pill');
    var ring = document.querySelector('.ring'), label = document.querySelector('.ring-label');
    var note = document.querySelector('.note textarea');
    var defaults = [
      { name: 'Read a page daily', xp: 19, done: false },
      { name: 'Ten-minute walk', xp: 15, done: false },
      { name: 'Drink a glass of water', xp: 5, done: false }
    ];
    var tasks;
    try { tasks = JSON.parse(store('dailyx-demo') || 'null'); } catch (e) { tasks = null; }
    if (!Array.isArray(tasks)) tasks = JSON.parse(JSON.stringify(defaults));
    if (note) {
      note.value = store('dailyx-demo-note') || '';
      note.addEventListener('input', function () { store('dailyx-demo-note', note.value); });
    }
    function render(first) {
      list.innerHTML = '';
      tasks.forEach(function (t, i) {
        var li = document.createElement('li');
        li.className = 'task' + (t.done ? ' done' : '');
        li.setAttribute('role', 'checkbox'); li.setAttribute('aria-checked', t.done ? 'true' : 'false'); li.setAttribute('tabindex', '0');
        li.innerHTML = '<span class="box"><svg viewBox="0 0 24 24"><path d="M4 13l5 5L20 6"/></svg></span><span class="name"></span><span class="xp">+' + t.xp + ' XP</span><button class="del" type="button" aria-label="Remove task">✕</button>';
        li.querySelector('.name').textContent = t.name;
        if (!first) li.style.animation = 'none';
        li.addEventListener('click', function (e) {
          if (e.target.closest('.del')) { tasks.splice(i, 1); save(); render(); return; }
          toggle(i, e.clientX, e.clientY, li);
        });
        li.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault(); var r = li.getBoundingClientRect(); toggle(i, r.left + 30, r.top + r.height / 2, li);
        });
        list.appendChild(li);
      });
      totals();
    }
    function totals() {
      var earned = 0, done = 0;
      tasks.forEach(function (t) { if (t.done) { earned += t.xp; done++; } });
      pill.textContent = earned + ' XP';
      var pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
      if (ring) { ring.style.setProperty('--pct', pct); ring.classList.toggle('full', pct === 100 && tasks.length > 0); }
      if (label) {
        label.firstChild.textContent = !tasks.length ? 'Add your first task' : pct === 100 ? 'Day complete!' : done + ' of ' + tasks.length + ' done';
      }
      return pct;
    }
    function save() { store('dailyx-demo', JSON.stringify(tasks)); }
    function toggle(i, x, y, li) {
      var t = tasks[i]; t.done = !t.done; save();
      li.classList.toggle('done', t.done); li.setAttribute('aria-checked', t.done ? 'true' : 'false');
      var pct = totals();
      if (t.done) {
        pill.classList.add('bump'); setTimeout(function () { pill.classList.remove('bump'); }, 380);
        if (ring) { ring.classList.add('cheer'); setTimeout(function () { ring.classList.remove('cheer'); }, 500); }
        burst(x, y, ['sparkles'], 7);
        if (pct === 100) {
          toast('Day complete — all tasks done!');
          var r = ring ? ring.getBoundingClientRect() : { left: x, top: y, width: 0, height: 0 };
          burst(r.left + r.width / 2, r.top + r.height / 2, ['sparkles', 'rocket', 'butterfly', 'sun'], 14);
        } else {
          toast('Task completed! Earned ' + t.xp + ' XP');
        }
      }
    }
    var form = demo.querySelector('.add');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var xp = Math.max(1, Math.min(999, parseInt(form.elements.xp.value, 10) || 10));
      if (!name) { form.elements.name.focus(); return; }
      tasks.push({ name: name.slice(0, 60), xp: xp, done: false }); save(); render(true);
      form.elements.name.value = '';
    });
    demo.querySelector('[data-reset]').addEventListener('click', function () {
      tasks = JSON.parse(JSON.stringify(defaults)); save(); render(true);
    });
    render(true);
  }

  /* ---------- buttons throw a few sparkles ---------- */
  document.querySelectorAll('.btn').forEach(function (b) {
    b.addEventListener('pointerenter', function () {
      var r = b.getBoundingClientRect();
      burst(r.right - 8, r.top + 6, ['sparkles'], 3);
    });
  });
})();
