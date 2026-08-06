# LMS-REPORT

LMS 역량증명서 프로젝트의 **보고서 산출물** 저장소. 발행용 HTML 원본을 여기서 관리한다.

설계·결정 문서는 `LMS-DOCS`(Obsidian Vault, Markdown)가 정본이고, 이 저장소는
**대외/임원 보고용으로 렌더링되는 단일 HTML 문서**만 다룬다.

## 발행

GitHub Pages가 정본 발행처다. `main`에 push하면 `.github/workflows/pages.yml`이
저장소 루트를 아티팩트로 올려 배포한다.

- 사이트: <https://encore-lms.github.io/LMS-REPORT/>
- 배포 방식: **Settings → Pages → Source = `GitHub Actions`** (`build_type: workflow`)
- 빌드 단계가 없어 커밋한 HTML이 그대로 나간다. 파일명·경로가 URL이 된다.

### ⚠️ Pages 설정을 `Deploy from a branch`로 되돌리지 말 것

워크플로 파일과 Pages 설정이 어긋나면 배포가 통째로 막힌다. 2026-08-06에 실제로 겪었다.

- 설정이 `legacy`인데 워크플로가 있으면 → 내장 빌더와 워크플로가 같은 배포 슬롯을 두고 경합해
  `Multiple artifacts named "github-pages"` · `deployment_queued` 타임아웃으로 **양쪽 다 실패**한다.
- 설정이 `workflow`인데 워크플로가 없으면 → 배포 주체가 없어 **아무것도 올라가지 않는다.**
- 워크플로 안의 `actions/configure-pages`가 실행될 때마다 설정을 `workflow`로 되돌리므로,
  `legacy`로 고정하려면 워크플로 파일을 지워야 한다. 둘 중 하나만 남긴다.

막혔을 때 복구 순서 — **한 사람이, 다른 사람이 push하지 않는 동안** 실행한다.

```bash
gh run list --limit 10 --json databaseId,status \
  --jq '.[] | select(.status=="in_progress" or .status=="queued") | .databaseId' \
  | xargs -I{} gh run cancel {}
gh api -X POST repos/encore-lms/LMS-REPORT/pages/deployments/<막힌_sha>/cancel
gh api -X PUT repos/encore-lms/LMS-REPORT/pages -f build_type=workflow
gh workflow run pages.yml --ref main
```

배포 ID가 커밋 sha라, 같은 sha로 실패가 쌓이면 재시도가 계속 취소된다.
그때는 새 커밋을 만들어 sha를 바꾼 뒤 배포한다.

**저장소가 public이라 사이트도 공개다.** 링크를 아는 사람은 로그인 없이 열람할 수 있다.
검색엔진 색인만 `robots.txt`와 각 문서의 `<meta name="robots" content="noindex, nofollow">`로
막아 두었다 — 접근 제한이 아니라 색인 제한이다. 비공개가 필요하면 저장소를 private으로
돌려야 하고, 그 경우 Pages는 GitHub Team 이상 플랜이 필요하다.

## 문서 목록

| 파일 | 기준일 | 대상 | 발행 |
| --- | --- | --- | --- |
| [`2026-08-05_임원보고_진행현황.html`](./2026-08-05_임원보고_진행현황.html) | 2026-08-05 | 임원진 | [Pages](https://encore-lms.github.io/LMS-REPORT/2026-08-05_%EC%9E%84%EC%9B%90%EB%B3%B4%EA%B3%A0_%EC%A7%84%ED%96%89%ED%98%84%ED%99%A9.html) |

문서를 추가하면 `index.html`의 목록에도 카드를 넣는다. 루트 `index.html`이 목차 페이지다.

## 파일 구조 규칙

HTML은 내용만 담고, 스타일과 동작은 `assets/`에서 역할별로 나눠 관리한다.
문서가 늘어도 공통 파일은 한 벌만 고치면 된다.

```
index.html                          목차
2026-08-05_임원보고_진행현황.html    보고서 발행본 (build.py 생성물 — 직접 수정 금지)
build.py                            보고서 조립기
sections/
  _shell.html       머리(head·masthead)·꼬리(footer·스크립트) 틀
  01-요약.html       섹션 조각 — 번호 순으로 조립된다
  02-현재-진행-상황.html
  03-아키텍처.html   (구성도 SVG·패널 데이터 포함)
  04-남은-구현.html
  05-8월-일정.html
  06-리스크.html
  07-결정-요청.html
assets/
  tokens.css        색·서체 토큰            (공용, 가장 먼저 로드)
  base.css          리셋·body·링크          (공용)
  theme-toggle.css  토글 버튼 · 인쇄 규칙   (공용)
  theme-toggle.js   토글 동작               (공용)
  report.css        보고서 레이아웃·컴포넌트
  diagram.css       아이소메트릭 구성도
  diagram.js        구성도 확대·이동
  countdown.js      종료 목표까지 남은 일수
  index.css         목차 페이지
```

- **외부 호스트는 부르지 않는다.** CDN·웹폰트·외부 이미지 금지. 참조는 저장소 안 상대 경로만 쓴다.
- 폰트는 시스템 스택으로 처리한다. 웹폰트 URL을 링크하면 조용히 폴백되어 의도한 서체가 안 나온다.
- 색은 `tokens.css`의 CSS 변수로만 정의하고 컴포넌트는 변수를 참조한다.
  라이트/다크 값을 세 곳(`:root` · `prefers-color-scheme` · `[data-theme]`)에 각각 선언한다.
- CSS는 위 순서대로 링크한다. `base.css`의 `a`와 `theme-toggle.css`의 `@media print`가
  뒤 파일에 같은 명시도로 다시 선언되면 결과가 뒤집힌다. 페이지 전용 CSS에서 `a`·`body`를
  재정의하지 않는다.
- `report.css`와 `index.css`는 `.doc`·`.masthead` 등 같은 클래스를 다른 값으로 쓴다.
  **한 페이지에 둘을 같이 링크하면 안 된다.**
- 표·다이어그램처럼 넓은 요소는 자체 `overflow-x: auto` 컨테이너 안에 둔다.
  본문(`body`)이 가로로 스크롤되면 안 된다.

### 문서 골격

Pages는 파일을 가공 없이 서빙하므로 **각 HTML이 완전한 문서여야 한다.**
`<!doctype html>` → `<html lang="ko">` → `<head>` → `<body>` 순서를 지킨다.
`<!doctype>`이 빠지면 브라우저가 quirks mode로 렌더링해 박스 모델과 여백이 달라진다.

`<head>`에 들어가는 것:

| 태그 | 이유 |
| --- | --- |
| `<meta charset="utf-8">` | 한글 깨짐 방지 |
| `<meta name="viewport">` | 모바일 배율 |
| `<meta name="robots" content="noindex, nofollow">` | 검색엔진 색인 차단 |
| 테마 선적용 `<script>` | 저장된 `data-theme`을 첫 페인트 전에 적용 (색 번쩍임 방지) |
| `<link rel="stylesheet">` | `assets/`의 CSS를 순서대로 |

테마 선적용 스니펫만은 **인라인으로 남긴다.** 외부 파일로 빼면 내려받는 동안
이전 테마 색이 먼저 그려졌다가 바뀐다. 이것이 인라인을 허용하는 유일한 예외다.

`<script src>`는 `<body>` 끝에 둔다. 토글은 루트 요소에 `data-theme="dark|light"`를 찍고
`localStorage`에 남기므로, 해당 셀렉터가 `prefers-color-scheme` 미디어쿼리를
양방향으로 이겨야 한다.

### 섹션 추가·수정 (sections/ + build.py)

보고서 본문의 원본은 `sections/` 조각이다. 발행 HTML 은 조립 결과물이므로
직접 고치지 않는다 — 고쳐도 다음 조립 때 사라진다.

```bash
# 섹션 추가: 다음 번호로 조각을 만들고 조립
$EDITOR sections/08-새-섹션.html      # <section>…</section> 전체, 번호 자리는 {{NUM}}
python3 build.py

# 중간 삽입·순서 변경: 파일명 번호만 바꾸면 된다
# ({{NUM}} 토큰이 조립 순서대로 채워지므로 본문 수정 불필요)
```

조각 형식은 기존 파일을 따른다: `<section>` 바로 안에
`<div class="sec-num">{{NUM}}</div>` 과 `<h2>제목</h2>`.
구성도(SVG·패널 JSON)를 재생성할 때는 `sections/03-아키텍처.html` 을
대상으로 치환한 뒤 조립한다.

## 로컬 확인

```bash
python3 -m http.server 8000    # 그 뒤 http://127.0.0.1:8000/
```

빌드 단계가 없어 서빙한 화면이 곧 배포본이다.
`file://`로 직접 열어도 대개 보이지만, 브라우저 설정에 따라 `assets/` 로드가 막힐 수 있어
확인은 위처럼 HTTP로 한다. 다크 모드는 우상단 토글이나 OS 테마로 본다.

## 근거 표기 규칙

수치를 쓸 때는 출처를 구분한다. 문서 안 `.prov` 칩이 이 구분을 표시한다.

| 표기 | 뜻 |
| --- | --- |
| 실측 | 작성 시점에 저장소 코드·배포 환경에서 직접 측정한 값 |
| 문서 | 설계·회고 문서에 기재된 값 (기준일이 다를 수 있음) |
| 결정 | 기록으로 남은 합의 사항 |

추정치는 추정치라고 쓴다. 소요일·완료 예상은 확정값이 아니다.

## 커밋 규칙

- 파일 1개 단위로 커밋한다 (`git commit -- <파일>`, `git add -A` 금지).
- 메시지는 `type(scope): 한국어 요약` 형식.
- 자동 생성 도구 관련 트레일러(Co-Authored-By 등)는 넣지 않는다.
