/* 구성도 탐색 — 블록 선택 시 상세 패널, 흐름 단계 강조, 계층 필터.
   그림 안에는 이름·상태만 두고 나머지 사양은 여기서 패널로 보여준다.
   확대·이동은 diagram.js 가 맡는다. */
(function () {
  var svg = document.querySelector('.iso');
  var panel = document.getElementById('isoPanel');
  var raw = document.getElementById('isoData');
  if (!svg || !panel || !raw) return;

  var DATA;
  try { DATA = JSON.parse(raw.textContent); } catch (e) { return; }

  var HINT = panel.innerHTML;
  var pinned = null;      // 클릭으로 고정한 노드. 호버가 끝나도 유지된다.
  var flow = '';          // '' 면 전체
  var hidden = {};        // 꺼둔 계층

  /* ── 패널 ─────────────────────────────────── */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function render(id) {
    var d = id && DATA[id];
    if (!d) { panel.innerHTML = HINT; return; }
    var idle = /미기동|미사용/.test(d.status);
    var rows = d.rows.map(function (r) {
      return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>';
    }).join('');
    panel.innerHTML =
      '<div class="iso-panel__head">' +
        '<p class="iso-panel__name">' + esc(d.name) + '</p>' +
        '<span class="iso-panel__kind">' + esc(d.kind) + '</span>' +
        '<span class="iso-panel__state' + (idle ? ' is-idle' : '') + '">' + esc(d.status) + '</span>' +
      '</div><dl>' + rows + '</dl>';
  }

  /* ── 강조 ─────────────────────────────────── */
  function parts(id) {
    return svg.querySelectorAll('[data-id="' + id + '"]');
  }
  function mark(id, on) {
    parts(id).forEach(function (el) { el.classList.toggle('is-active', on); });
  }

  /* ── 흐름·계층 필터 ────────────────────────── */
  function matchesFlow(el) {
    if (!flow) return true;
    var v = el.getAttribute('data-flow');
    return !!v && v.split(' ').indexOf(flow) !== -1;
  }

  function applyFilters() {
    svg.querySelectorAll('.nd').forEach(function (nd) {
      var layer = nd.getAttribute('data-layer');
      var off = hidden[layer] || !matchesFlow(nd);
      nd.classList.toggle('is-dim', off);
      parts(nd.getAttribute('data-id')).forEach(function (el) {
        if (el !== nd) el.classList.toggle('is-dim', off);
      });
    });
    /* 선과 단계 배지는 흐름에만 반응한다. 계층을 꺼도 경로는 남겨 둔다. */
    svg.querySelectorAll('line[data-flow], .stb').forEach(function (el) {
      el.classList.toggle('is-dim', !matchesFlow(el));
    });
  }

  /* ── 이벤트 ───────────────────────────────── */
  function nodeOf(target) {
    return target.closest ? target.closest('.nd') : null;
  }

  svg.addEventListener('pointerover', function (e) {
    var nd = nodeOf(e.target);
    if (!nd || pinned) return;
    var id = nd.getAttribute('data-id');
    mark(id, true);
    render(id);
  });

  svg.addEventListener('pointerout', function (e) {
    var nd = nodeOf(e.target);
    if (!nd || pinned) return;
    mark(nd.getAttribute('data-id'), false);
    render(null);
  });

  svg.addEventListener('click', function (e) {
    var nd = nodeOf(e.target);
    if (!nd) return;
    var id = nd.getAttribute('data-id');
    if (pinned === id) {                 /* 같은 블록을 다시 누르면 고정 해제 */
      mark(id, false);
      pinned = null;
      render(null);
      return;
    }
    if (pinned) mark(pinned, false);
    pinned = id;
    mark(id, true);
    render(id);
  });

  /* 키보드로도 같은 동작이 되게 한다. 블록은 tabindex 를 가진 role="button" 이다. */
  svg.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var nd = nodeOf(e.target);
    if (!nd) return;
    e.preventDefault();
    nd.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  svg.addEventListener('focusin', function (e) {
    var nd = nodeOf(e.target);
    if (nd && !pinned) render(nd.getAttribute('data-id'));
  });

  document.querySelectorAll('.iso-seg [data-flow]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      flow = btn.getAttribute('data-flow');
      btn.parentNode.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('is-on', b === btn);
      });
      applyFilters();
    });
  });

  document.querySelectorAll('.iso-seg [data-layer]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var layer = btn.getAttribute('data-layer');
      hidden[layer] = !hidden[layer];
      btn.classList.toggle('is-on', !hidden[layer]);
      btn.setAttribute('aria-pressed', String(!hidden[layer]));
      applyFilters();
    });
  });
})();
