/* 라이트/다크 토글. 루트의 data-theme 을 바꾸고 선택을 localStorage 에 남긴다.
   첫 페인트 전 적용은 각 HTML <head> 의 인라인 스니펫이 담당한다(여기서 하면 색이 번쩍인다). */

(function () {
  var btn = document.getElementById('themeToggle');
  var label = btn.querySelector('.theme-toggle__label');
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  /* data-theme이 없으면 OS 설정을 따르므로, 실제 표시 중인 테마를 그쪽에서 읽는다. */
  function current() {
    return document.documentElement.dataset.theme || (media.matches ? 'dark' : 'light');
  }

  function sync() {
    var next = current() === 'dark' ? 'light' : 'dark';
    btn.dataset.next = next;
    label.textContent = next === 'dark' ? '다크' : '라이트';
    btn.setAttribute('aria-label', (next === 'dark' ? '다크' : '라이트') + ' 모드로 전환');
  }

  btn.addEventListener('click', function () {
    var next = btn.dataset.next;
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('lms-report-theme', next); } catch (e) {}
    sync();
  });

  media.addEventListener('change', sync);
  sync();
})();
