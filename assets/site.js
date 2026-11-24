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

  /* ---------- the app's own brush drawings ---------- */
  var BR = window.DX_BRUSH;
  function paths(list) {
    return list.map(function (s, i) { return '<path class="' + s.role + '" style="--i:' + i + '" d="' + s.d + '"/>'; }).join('');
  }
  function illustration(name, extra) {
    return '<svg class="bx ' + (extra || '') + '" viewBox="0 0 240 180" aria-hidden="true">' + paths(BR.ILLUSTRATIONS[name]) + '</svg>';
  }
  function check() {
    return '<svg class="chk" viewBox="0 0 48 48" aria-hidden="true"><path class="r" fill-rule="evenodd" d="' + BR.BRUSH_CHECK.ring + '"/><path class="k" d="' + BR.BRUSH_CHECK.tick + '"/></svg>';
  }
  function face(mood) {
    var f = BR.MOOD_FACES[mood];
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><path class="tint" d="' + f.tint + '"/><path class="ink" fill-rule="evenodd" d="' + f.ink + '"/></svg>';
  }
  function badge() {
    var b = BR.BRUSH_BADGE;
    return '<svg viewBox="0 0 64 76" aria-hidden="true"><path class="ribbon" d="' + b.ribbon + '"/><path class="ring" fill-rule="evenodd" d="' + b.ring + '"/><path class="sparks" d="' + b.sparks + '"/></svg>';
  }
  var MOODS = [['Happy', '#48BB78'], ['Neutral', '#718096'], ['Low', '#4299E1'], ['Frustrated', '#F56565'], ['Tired', '#9F7AEA']];
  if (BR) {
    document.querySelectorAll('[data-brush]').forEach(function (el) {
      el.innerHTML = illustration(el.getAttribute('data-brush'), 'paint-strokes');
      var svg = el.firstChild;
      if ('IntersectionObserver' in window && !reduce) {
        var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { svg.classList.add('in'); o.disconnect(); } }); }, { threshold: 0.35 });
        o.observe(el);
      } else { svg.classList.add('in'); }
    });
    document.querySelectorAll('[data-badge]').forEach(function (el) { el.insertAdjacentHTML('afterbegin', badge()); });
    document.querySelectorAll('[data-check]').forEach(function (el) { el.insertAdjacentHTML('afterbegin', check()); });
  }

  /* ---------- pick a mood ---------- */
  var pick = document.querySelector('.mood-pick');
  if (pick && BR) {
    var says = {
      Happy: 'Lovely. Write down what made it good, so you can find it again.',
      Neutral: 'An ordinary day counts too. One line is plenty.',
      Low: 'Noted, gently. Low days belong in the journal as much as good ones.',
      Frustrated: 'Fair enough. Put it on the page and let tomorrow start clean.',
      Tired: 'Rest is part of the plan. Your grove will wait for you.'
    };
    var sayEl = document.querySelector('.mood-say');
    MOODS.forEach(function (m, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.style.setProperty('--mc', m[1]); b.style.setProperty('--tilt', [-2, 1.5, -1, 2, -1.5][i] + 'deg');
      b.innerHTML = face(m[0]) + m[0];
      b.addEventListener('click', function (e) {
        pick.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
        if (sayEl) sayEl.textContent = says[m[0]];
        burst(e.clientX, e.clientY, ['sparkles'], 5);
      });
      pick.appendChild(b);
    });
  }

  /* ---------- missed tasks: keep or let go ---------- */
  var missed = document.querySelector('.missed');
  if (missed) {
    missed.querySelector('[data-keep]').addEventListener('click', function (e) { missed.classList.add('kept'); burst(e.clientX, e.clientY, ['sparkles'], 6); });
    missed.querySelector('[data-letgo]').addEventListener('click', function (e) { missed.classList.add('gone'); burst(e.clientX, e.clientY, ['butterfly', 'cloud'], 5); });
    missed.querySelectorAll('[data-again]').forEach(function (b) { b.addEventListener('click', function () { missed.classList.remove('kept', 'gone'); }); });
  }

  /* ---------- try it: a small working DailyX ---------- */
  var phone = document.querySelector('.phone');
  if (phone && BR) {
    var $ = function (s) { return phone.querySelector(s); };
    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var PROMPTS = ['What went well today?', 'Name three good things from today.', 'What are you grateful for right now?', 'What did you learn today?', 'What made you smile today?', 'What are you proud of today?', 'What small win did you have today?'];
    var fresh = function () {
      return { tasks: [
        { name: 'Read a page', when: 'Today', repeat: 'Daily', xp: 10, done: false },
        { name: 'Ten-minute walk', when: 'Today', repeat: '', xp: 10, done: false },
        { name: 'Call mum', when: 'Today', repeat: '', xp: 5, done: false },
        { name: 'Send the lab report', when: 'Friday', repeat: '', xp: 15, done: false }
      ], mood: '', note: '', planted: 0 };
    };
    var st;
    try { st = JSON.parse(store('dailyx-phone') || 'null'); } catch (e) { st = null; }
    if (!st || !Array.isArray(st.tasks)) st = fresh();
    var save = function () { store('dailyx-phone', JSON.stringify(st)); };
    var today = function () { return st.tasks.filter(function (t) { return t.when === 'Today'; }); };
    var doneCount = function () { return today().filter(function (t) { return t.done; }).length; };

    // header + tabs
    var TABS = [['today', 'Today'], ['tasks', 'Tasks'], ['journal', 'Journal'], ['grove', 'Grove'], ['me', 'Me']];
    var tabBar = $('.ph-tabs');
    TABS.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('data-go', t[0]);
      b.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><path class="w" d="' + BR.TAB_ICONS.wash + '"/><path class="i" fill-rule="evenodd" d="' + BR.TAB_ICONS[t[0]] + '"/></svg>' + t[1];
      tabBar.appendChild(b);
    });
    $('.ph-head .ul').innerHTML = '<svg viewBox="0 0 64 8" preserveAspectRatio="none" aria-hidden="true"><path fill-rule="evenodd" d="' + BR.BRUSH_UNDERLINE.d + '"/></svg>';
    function go(name) {
      TABS.forEach(function (t) {
        $('[data-pane="' + t[0] + '"]').classList.toggle('on', t[0] === name);
        tabBar.querySelector('[data-go="' + t[0] + '"]').classList.toggle('on', t[0] === name);
        if (t[0] === name) $('.ph-head b').textContent = t[1];
      });
      $('.ph-body').scrollTop = 0;
      if (name === 'grove') drawGrove(false);
    }
    phone.addEventListener('click', function (e) {
      var g = e.target.closest('[data-go]');
      if (g) go(g.getAttribute('data-go'));
    });

    // Today
    var ring = $('.ring');
    ring.insertAdjacentHTML('afterbegin',
      '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><mask id="ph-sweep"><circle class="sweep" cx="32" cy="32" r="24" pathLength="100" transform="rotate(-90 32 32)" stroke="#fff"/></mask></defs>' +
      '<path class="track" fill-rule="evenodd" d="' + BR.DAY_RING.ring + '"/><path class="paint" fill-rule="evenodd" mask="url(#ph-sweep)" d="' + BR.DAY_RING.ring + '"/><path class="tick" d="' + BR.DAY_RING.tick + '"/></svg>');
    ring.querySelector('.sweep').style.stroke = '#fff';
    var undoBar = $('.ph-undo'), undoTimer, lastDone = null;
    function row(t, withMeta) {
      var meta = [t.when !== 'Today' ? t.when : '', t.repeat].filter(Boolean).join(' · ');
      var li = document.createElement('div');
      li.className = 'ph-row' + (t.done ? ' done' : '');
      li.setAttribute('role', 'checkbox'); li.setAttribute('aria-checked', t.done ? 'true' : 'false'); li.setAttribute('tabindex', '0');
      li.innerHTML = check() + '<span class="nm"></span>' + (t.xp ? '<span class="xp">+' + t.xp + ' XP</span>' : '');
      var nm = li.querySelector('.nm'); nm.textContent = t.name;
      if (withMeta && meta) { var sm = document.createElement('small'); sm.textContent = meta; nm.appendChild(sm); }
      var act = function (x, y) { toggle(t, x, y); };
      li.addEventListener('click', function (e) { act(e.clientX, e.clientY); });
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); var r = li.getBoundingClientRect(); act(r.left + 24, r.top + 24); } });
      return li;
    }
    function renderLists() {
      var t = today(), d = doneCount();
      var list = $('[data-list="today"]'); list.innerHTML = '';
      t.forEach(function (x) { list.appendChild(row(x, false)); });
      list.style.display = t.length ? '' : 'none';
      var all = $('[data-list="all-today"]'), up = $('[data-list="upcoming"]');
      all.innerHTML = ''; up.innerHTML = '';
      st.tasks.forEach(function (x) { (x.when === 'Today' ? all : up).appendChild(row(x, true)); });
      $('[data-label="upcoming"]').style.display = up.children.length ? '' : 'none'; up.style.display = up.children.length ? '' : 'none';
      all.style.display = all.children.length ? '' : 'none';
      var pct = t.length ? Math.round(d / t.length * 100) : 0;
      ring.style.setProperty('--pct', pct); ring.classList.toggle('full', pct === 100 && t.length > 0);
      $('.ring .count').textContent = d + '/' + t.length;
      $('[data-ring-title]').textContent = !t.length ? 'Nothing planned yet' : pct === 100 ? 'All done for today' : (t.length - d) + ' left today';
      var xp = 0; t.forEach(function (x) { if (x.done) xp += x.xp; });
      $('[data-ring-sub]').textContent = pct === 100 && t.length ? 'Your forest is growing.' : xp ? xp + ' XP earned so far' : 'Tap a task to finish it.';
      var done = $('[data-alldone]');
      var show = pct === 100 && t.length > 0;
      if (show && done.style.display === 'none') { done.querySelector('.bx').classList.remove('in'); requestAnimationFrame(function () { requestAnimationFrame(function () { done.querySelector('.bx').classList.add('in'); }); }); }
      done.style.display = show ? '' : 'none';
      // Me
      var score = Math.min(100, 76 + d * 3 + (st.mood ? 3 : 0));
      $('[data-score]').textContent = score;
      $('[data-week]').textContent = (4 + (d || st.mood ? 1 : 0)) + '/7';
      var cell = $('.ph-heat .today'); if (cell) cell.setAttribute('data-l', d >= 3 ? 3 : d >= 1 ? 2 : st.mood ? 1 : 0);
      var dot = $('.ph-dots .now'); if (dot) dot.classList.toggle('on', !!st.mood);
      $('[data-flow]').textContent = Math.min(100, 62 + d * 6 + (st.mood ? 6 : 0)) + '%';
      $('[data-trees]').textContent = 9 + st.planted;
    }
    function toggle(t, x, y) {
      t.done = !t.done;
      if (t.done) { st.planted++; lastDone = t; } else { st.planted = Math.max(0, st.planted - 1); }
      save(); renderLists();
      if (t.done) {
        burst(x, y, ['sparkles'], 6);
        undoBar.querySelector('span').textContent = 'Done' + (t.xp ? ' · +' + t.xp + ' XP' : '');
        undoBar.classList.add('show'); clearTimeout(undoTimer);
        undoTimer = setTimeout(function () { undoBar.classList.remove('show'); }, 6000);
        if (doneCount() === today().length) {
          var r = phone.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + 180, ['sparkles', 'trees', 'butterfly', 'sun'], 14);
        }
      } else { undoBar.classList.remove('show'); }
    }
    undoBar.querySelector('button').addEventListener('click', function () {
      if (lastDone && lastDone.done) { lastDone.done = false; st.planted = Math.max(0, st.planted - 1); save(); renderLists(); }
      undoBar.classList.remove('show');
    });

    // Tasks: typed dates
    var input = $('[data-new]'), chips = $('.ph-chips');
    function parse(text) {
      var out = { name: text, when: 'Today', repeat: '' }, m;
      var cut = function (re) { out.name = out.name.replace(re, ' ').replace(/\s+/g, ' ').trim(); };
      if ((m = /\bevery ?day\b|\bdaily\b/i.exec(text))) { out.repeat = 'Daily'; cut(/\bevery ?day\b|\bdaily\b/i); }
      else if ((m = /\bevery week\b|\bweekly\b/i.exec(text))) { out.repeat = 'Weekly'; cut(/\bevery week\b|\bweekly\b/i); }
      else if ((m = /\bevery month\b|\bmonthly\b/i.exec(text))) { out.repeat = 'Monthly'; cut(/\bevery month\b|\bmonthly\b/i); }
      if (/\btomorrow\b/i.test(text)) { out.when = 'Tomorrow'; cut(/\btomorrow\b/i); }
      else if ((m = /\b(?:on |next )?(sun|mon|tues?|wed(?:nes)?|thu(?:rs)?|fri|sat(?:ur)?)(?:day)?\b/i.exec(text))) {
        var k = m[1].slice(0, 3).toLowerCase();
        out.when = DAYS.filter(function (d) { return d.slice(0, 3).toLowerCase() === k; })[0]; cut(new RegExp(m[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
      } else if ((m = /\bin (\d+) days?\b/i.exec(text))) { out.when = 'In ' + m[1] + ' days'; cut(/\bin \d+ days?\b/i); }
      else if (/\btoday\b/i.test(text)) { cut(/\btoday\b/i); }
      return out;
    }
    function showChips() {
      var v = input.value.trim();
      if (!v) { chips.innerHTML = '<span style="background:none;color:var(--t2);font-weight:400;padding-left:0">Try “call mum tomorrow” or “water plants every day”</span>'; return; }
      var p = parse(v);
      chips.innerHTML = '<span>When · ' + p.when + '</span>' + (p.repeat ? '<span>Repeat · ' + p.repeat + '</span>' : '');
    }
    input.addEventListener('input', showChips); showChips();
    $('[data-add]').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim(); if (!v) { input.focus(); return; }
      var p = parse(v);
      st.tasks.push({ name: (p.name || v).slice(0, 48).replace(/^./, function (c) { return c.toUpperCase(); }), when: p.when, repeat: p.repeat, xp: 10, done: false });
      input.value = ''; showChips(); save(); renderLists();
    });

    // Journal
    var moodsEl = $('.ph-moods'), noteEl = $('[data-note]');
    $('[data-prompt]').textContent = PROMPTS[Math.floor(Date.now() / 86400000) % PROMPTS.length];
    MOODS.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button'; b.style.setProperty('--mc', m[1]); b.innerHTML = face(m[0]) + m[0];
      b.classList.toggle('on', st.mood === m[0]);
      b.addEventListener('click', function () {
        st.mood = st.mood === m[0] ? '' : m[0]; save();
        moodsEl.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b && !!st.mood); });
        renderLists();
      });
      moodsEl.appendChild(b);
    });
    noteEl.value = st.note || '';
    noteEl.addEventListener('input', function () { st.note = noteEl.value.slice(0, 400); save(); });
    $('[data-save]').addEventListener('click', function (e) {
      if (!st.mood && !noteEl.value.trim()) { toast('Pick a mood or write a line first'); return; }
      toast('Saved to your journal'); burst(e.clientX, e.clientY, ['sparkles', 'journal'], 6);
    });

    // Grove: every completed task grows a tree
    var groveSvg = $('.ph-grove svg'), grovePop;
    function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
    function drawGrove() {
      var n = 9 + st.planted, d = doneCount();
      var flow = Math.min(100, 62 + d * 6 + (st.mood ? 6 : 0)), w = 7 + flow * 0.16;
      var h = '<path class="bird" d="M0 30q4-5 8 0q4-5 8 0"/><path class="bird b2" d="M0 52q3-4 6 0q3-4 6 0"/>';
      h += '<path class="river" d="M-5 ' + (150 - w) + 'C70 ' + (138 - w) + ' 120 ' + (170 - w) + ' 190 ' + (152 - w) + 'S290 ' + (140 - w) + ' 325 ' + (156 - w) + 'L325 ' + (156 + w) + 'C290 ' + (142 + w) + ' 250 ' + (166 + w) + ' 190 ' + (154 + w) + 'S70 ' + (140 + w) + ' -5 ' + (152 + w) + 'Z"/>';
      h += '<path class="ripple" d="M10 150C70 140 120 168 190 153S290 142 320 156"/>';
      for (var i = 0; i < Math.min(n, 48); i++) {
        var x = 16 + rnd(i) * 288, y = 78 + rnd(i + 50) * 44, s = 0.75 + rnd(i + 99) * 0.6, pine = rnd(i + 7) > 0.6;
        var leaf = pine ? '<path class="leaf" d="M0 -34L9 -12L-9 -12Z M0 -26L11 -4L-11 -4Z"/>' : '<path class="leaf" d="M-9 -20q-4 -9 4 -13q3 -7 10 -3q8 1 6 9q4 7 -4 10q-9 4 -16 -3z"/>';
        h += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s.toFixed(2) + ')"><g class="tree' + (i >= n - 1 && st.planted && i === n - 1 ? ' new' : '') + '" data-tree="' + i + '" style="animation-delay:' + (-rnd(i + 3) * 4).toFixed(1) + 's"><circle class="hit" cx="0" cy="-14" r="20"/><path class="trunk" d="M0 0q-1.5 -9 0 -17"/>' + leaf + '</g></g>';
      }
      groveSvg.innerHTML = h;
    }
    groveSvg.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tree]'); if (!t) return;
      var i = +t.getAttribute('data-tree'), n = 9 + st.planted;
      var ago = n - 1 - i, dt = new Date(Date.now() - Math.ceil(ago / 2) * 86400000);
      var label = ago < st.planted ? 'Today' : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      if (grovePop) grovePop.remove();
      grovePop = document.createElement('div'); grovePop.className = 'ph-pop';
      grovePop.textContent = label + ' · ' + MOODS[i % 5][0] + ' · a task finished';
      $('.ph-grove').appendChild(grovePop);
      var p = grovePop; setTimeout(function () { p.remove(); }, 2200);
    });

    // Me: a year in squares (sample history)
    var heat = $('.ph-heat'), cells = '';
    for (var c = 0; c < 119; c++) {
      var v = rnd(c + 11), l = c === 118 ? 0 : v > 0.82 ? 3 : v > 0.5 ? 2 : v > 0.22 ? 1 : 0;
      cells += '<i data-l="' + l + '"' + (c === 118 ? ' class="today"' : '') + '></i>';
    }
    heat.innerHTML = cells;
    phone.querySelectorAll('.ph-medals > div').forEach(function (m) { m.insertAdjacentHTML('afterbegin', badge()); });
    $('[data-alldone] [data-art]').innerHTML = illustration('allDone', 'paint-strokes in');

    var resetBtn = document.querySelector('[data-phone-reset]');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      st = fresh(); save(); noteEl.value = ''; moodsEl.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
      renderLists(); drawGrove(); go('today');
    });
    renderLists(); drawGrove(); go('today');
  }

  /* ---------- buttons throw a few sparkles ---------- */
  document.querySelectorAll('.btn').forEach(function (b) {
    b.addEventListener('pointerenter', function () {
      var r = b.getBoundingClientRect();
      burst(r.right - 8, r.top + 6, ['sparkles'], 3);
    });
  });
})();
