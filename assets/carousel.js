/* 캐러셀 — 부트스트랩 5.3 carousel 의 동작(이전/다음·인디케이터·키보드)만 가져온 최소 구현.
   자동 재생은 없다. 보고서에서 화면이 저 혼자 넘어가면 읽는 흐름을 끊는다.
   이미지를 누르면 새 탭 대신 모달(<dialog>)로 크게 띄운다. */
(function () {
  'use strict';

  var SVG = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var box = null;

  /* 모달은 페이지마다 하나만 만들어 돌려 쓴다. */
  function lightbox() {
    if (box) return box;

    box = document.createElement('dialog');
    box.className = 'lb';
    box.innerHTML =
      '<button class="lb__x" type="button" aria-label="닫기">' +
        '<svg ' + SVG + '><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
      '<div class="lb__frame">' +
        '<button class="lb__nav lb__nav--prev" type="button" aria-label="이전 화면">' +
          '<svg ' + SVG + '><path d="M15 18l-6-6 6-6"/></svg></button>' +
        '<img class="lb__img" alt="">' +
        '<button class="lb__nav lb__nav--next" type="button" aria-label="다음 화면">' +
          '<svg ' + SVG + '><path d="M9 18l6-6-6-6"/></svg></button>' +
      '</div>' +
      '<p class="lb__cap"></p>';
    document.body.appendChild(box);

    box.querySelector('.lb__x').addEventListener('click', function () { box.close(); });
    /* 이미지 바깥(어두워진 배경)을 누르면 닫는다. */
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });

    return box;
  }

  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('[data-cs-track]');
    var items = Array.prototype.slice.call(root.querySelectorAll('.cs__item'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-cs-to]'));
    if (!track || items.length < 2) return;

    var at = 0;

    function caption(i) {
      var t = dots[i] && dots[i].querySelector('.cs__dot-t');
      return t ? t.textContent.trim() : '';
    }

    function show(n) {
      at = (n + items.length) % items.length;
      track.style.transform = 'translateX(' + (-at * 100) + '%)';

      items.forEach(function (el, i) {
        var on = i === at;
        el.setAttribute('aria-hidden', on ? 'false' : 'true');
        /* 화면 밖 슬라이드의 링크로 탭이 빠지지 않게 한다. */
        var link = el.querySelector('a');
        if (link) link.tabIndex = on ? 0 : -1;
      });

      dots.forEach(function (el, i) {
        el.classList.toggle('is-on', i === at);
        el.setAttribute('aria-current', i === at ? 'true' : 'false');
      });

      if (box && box.open) paint();
    }

    function paint() {
      var img = items[at].querySelector('img');
      var big = box.querySelector('.lb__img');
      big.src = img.getAttribute('src');
      big.alt = img.getAttribute('alt') || '';
      box.querySelector('.lb__cap').textContent = caption(at);
    }

    function open(i) {
      var b = lightbox();
      show(i);
      paint();
      b.querySelector('.lb__nav--prev').onclick = function () { show(at - 1); };
      b.querySelector('.lb__nav--next').onclick = function () { show(at + 1); };
      b.onkeydown = function (e) {
        if (e.key === 'ArrowRight') { show(at + 1); e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { show(at - 1); e.preventDefault(); }
      };
      if (!b.open) b.showModal();
    }

    /* 링크의 href 는 그대로 둔다 — 스크립트가 죽어도 원본은 열려야 한다. */
    items.forEach(function (el, i) {
      var link = el.querySelector('a');
      if (!link) return;
      link.addEventListener('click', function (e) {
        e.preventDefault();
        open(i);
      });
    });

    root.querySelectorAll('[data-cs]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        show(btn.dataset.cs === 'next' ? at + 1 : at - 1);
      });
    });

    dots.forEach(function (btn) {
      btn.addEventListener('click', function () { show(Number(btn.dataset.csTo)); });
    });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { show(at + 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { show(at - 1); e.preventDefault(); }
    });

    show(0);
  });
})();
