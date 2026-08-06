/* 구성도 확대·이동. viewBox 만 바꾸므로 문서 레이아웃은 움직이지 않는다. */

/* 구성도 확대·이동 — viewBox만 바꾸므로 문서 레이아웃은 움직이지 않는다. */
(function () {
  var wrap = document.querySelector('.isowrap');
  var svg = wrap && wrap.querySelector('.iso');
  if (!svg) return;

  var vb0 = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  var vb = vb0.slice();

  function apply() {
    svg.setAttribute('viewBox', vb.join(' '));
    svg.classList.toggle('is-zoomed', vb[2] < vb0[2] - 0.5);
  }
  function clampPan() {
    vb[0] = Math.min(Math.max(vb[0], vb0[0]), vb0[0] + vb0[2] - vb[2]);
    vb[1] = Math.min(Math.max(vb[1], vb0[1]), vb0[1] + vb0[3] - vb[3]);
  }
  /* (cx,cy)를 화면상 같은 자리에 고정한 채 배율만 바꾼다. 최대 8배, 최소 원본. */
  function zoomAt(f, cx, cy) {
    var w = Math.min(Math.max(vb[2] / f, vb0[2] / 8), vb0[2]);
    var real = vb[2] / w;
    vb[0] = cx - (cx - vb[0]) / real;
    vb[1] = cy - (cy - vb[1]) / real;
    vb[2] = w;
    vb[3] = vb[3] / real;
    clampPan();
    apply();
  }
  function pointToUser(e) {
    var r = svg.getBoundingClientRect();
    return [vb[0] + (e.clientX - r.left) / r.width * vb[2],
            vb[1] + (e.clientY - r.top) / r.height * vb[3]];
  }

  wrap.querySelectorAll('.iso-controls [data-zoom]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.dataset.zoom === 'reset') { vb = vb0.slice(); apply(); return; }
      zoomAt(b.dataset.zoom === 'in' ? 1.35 : 1 / 1.35,
             vb[0] + vb[2] / 2, vb[1] + vb[3] / 2);
    });
  });

  svg.addEventListener('dblclick', function (e) {
    var p = pointToUser(e);
    zoomAt(1.6, p[0], p[1]);
  });

  /* 트랙패드 핀치는 브라우저에서 ctrl+휠로 들어온다. 일반 휠 스크롤은 건드리지 않는다. */
  wrap.addEventListener('wheel', function (e) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    var p = pointToUser(e);
    zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, p[0], p[1]);
  }, { passive: false });

  var drag = null;
  svg.addEventListener('pointerdown', function (e) {
    if (vb[2] >= vb0[2] - 0.5) return;   /* 확대 전에는 이동할 것이 없다 */
    drag = { x: e.clientX, y: e.clientY, vx: vb[0], vy: vb[1] };
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  svg.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var r = svg.getBoundingClientRect();
    vb[0] = drag.vx - (e.clientX - drag.x) * vb[2] / r.width;
    vb[1] = drag.vy - (e.clientY - drag.y) * vb[3] / r.height;
    clampPan();
    apply();
  });
  ['pointerup', 'pointercancel'].forEach(function (t) {
    svg.addEventListener(t, function () { drag = null; });
  });
})();
