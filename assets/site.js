// DailyX — small page behaviours: scroll reveal, tabs, gentle parallax.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reveal on scroll
  var items = document.querySelectorAll('.reveal');
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

  // screenshot tabs
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

  // stickers in the hero lean a little toward the pointer
  var scene = document.querySelector('[data-parallax]');
  if (scene && !reduce && window.matchMedia('(pointer: fine)').matches) {
    var layers = scene.querySelectorAll('[data-depth]');
    window.addEventListener('pointermove', function (e) {
      var x = e.clientX / window.innerWidth - 0.5;
      var y = e.clientY / window.innerHeight - 0.5;
      layers.forEach(function (el) {
        var d = parseFloat(el.getAttribute('data-depth'));
        el.style.translate = (x * d * -40).toFixed(1) + 'px ' + (y * d * -30).toFixed(1) + 'px';
      });
    }, { passive: true });
  }
})();
