/* 종료 목표까지 남은 일수 계산. 정본은 masthead 의 [data-deadline] 값 하나다. */

/* 종료 목표까지 남은 일수 계산.
   정본은 masthead의 [data-deadline] 값 하나이며, 그 날짜만 고치면 문서 전체가 따라간다.
   스크립트가 막히거나 실패해도 마크업에 적힌 정적 값이 그대로 보인다. */
(function () {
  var src = document.querySelector('[data-deadline]');
  if (!src) return;

  var deadline = src.textContent.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return;

  /* 열람자의 기기 시간대와 무관하게 KST 날짜를 기준으로 센다.
     en-CA 로캘은 YYYY-MM-DD 형식을 준다. */
  function todayKST() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
  }
  /* 일수 차이는 DST가 없는 UTC 자정 기준으로 계산해야 어긋나지 않는다. */
  function utc(ymd) {
    var p = ymd.split('-');
    return Date.UTC(+p[0], p[1] - 1, +p[2]);
  }
  /* 주말만 제외한다. 공휴일은 반영하지 않는다. 양 끝 날짜를 모두 포함한다. */
  function businessDays(from, to) {
    var d = utc(from), end = utc(to), n = 0;
    while (d <= end) {
      var w = new Date(d).getUTCDay();
      if (w !== 0 && w !== 6) n++;
      d += 86400000;
    }
    return n;
  }
  function mmdd(ymd) { return ymd.slice(5); }

  var today = todayKST();
  var left = Math.round((utc(deadline) - utc(today)) / 86400000);
  var over = left < 0 ? -left : 0;

  var text = {
    days:      left > 0 ? left + '일' : left === 0 ? '오늘' : '경과 ' + over + '일',
    'days-num': left > 0 ? String(left) : '0',
    dday:      left > 0 ? 'D-' + left : left === 0 ? 'D-DAY' : 'D+' + over,
    biz:       left >= 0 ? String(businessDays(today, deadline)) : '0',
    range:     left >= 0 ? mmdd(today) + ' ~ ' + mmdd(deadline) : '마감 경과 ' + over + '일'
  };

  Object.keys(text).forEach(function (key) {
    document.querySelectorAll('[data-cd="' + key + '"]').forEach(function (el) {
      el.textContent = text[key];
    });
  });
})();
