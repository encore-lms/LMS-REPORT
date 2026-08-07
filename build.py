#!/usr/bin/env python3
"""보고서 조립기.

보고서 하나가 폴더 하나다.

    reports/<보고서>/sections/00-shell.html   머리·꼬리 틀
    reports/<보고서>/sections/01-….html       섹션 조각 (번호 순으로 조립)
    reports/<보고서>/index.html               조립 결과 (생성물)

조각을 파일명 순서대로 `00-shell.html` 의 <!--SECTIONS--> 자리에 끼워
각 폴더의 index.html 을 만든다. 폴더가 여러 개면 전부 조립한다.

- 섹션 추가: 그 보고서 폴더의 sections/ 에 다음 번호로 파일을 만들고 실행.
- 중간 삽입·순서 변경: 파일명 번호만 바꾸면 된다 — 조각 안의 <!--NUM-->
  토큰이 조립 순서대로 01, 02… 로 채워지므로 본문은 손대지 않는다.
- 새 보고서: 기존 폴더를 통째로 복사한 뒤 조각을 고친다.
- index.html 은 생성물이다. 직접 수정하면 다음 조립 때 사라진다.

사용법:  python3 build.py            # 전체 조립
        python3 build.py <폴더명>    # 하나만 조립
"""
import sys
from pathlib import Path

ROOT = Path(__file__).parent
REPORTS = ROOT / 'reports'
# Jekyll 등 정적 호스팅이 {{ }} 를 템플릿으로 해석해 빌드를 깨뜨린 적이 있어 주석 토큰을 쓴다.
MARKER = '<!--SECTIONS-->'
NUM = '<!--NUM-->'

def build(doc_dir: Path) -> None:
    sections = doc_dir / 'sections'
    shell_path = sections / '00-shell.html'
    if not shell_path.exists():
        raise SystemExit(f'{doc_dir.name}: sections/00-shell.html 이 없다')

    shell = shell_path.read_text(encoding='utf-8')
    if MARKER not in shell:
        raise SystemExit(f'{doc_dir.name}: 00-shell.html 에 {MARKER} 가 없다')

    files = sorted(p for p in sections.glob('[0-9]*.html') if p.name != '00-shell.html')
    if not files:
        raise SystemExit(f'{doc_dir.name}: sections/ 에 번호 붙은 조각이 없다')

    parts = []
    for i, p in enumerate(files, 1):
        frag = p.read_text(encoding='utf-8').rstrip('\n')
        if NUM not in frag:
            raise SystemExit(f'{doc_dir.name}/{p.name}: {NUM} 토큰이 없다')
        parts.append(f'  <!-- ══ {i} ══ -->\n' + frag.replace(NUM, f'{i:02d}'))

    # 마커 줄 자체의 개행이 마지막 </section> 뒤 개행 역할을 한다 — 덧붙이면 빈 줄이 늘어난다.
    out = shell.replace(MARKER, '\n\n'.join(parts), 1)
    (doc_dir / 'index.html').write_text(out, encoding='utf-8')
    print(f'{doc_dir.name}/index.html  ←  조각 {len(files)}개, {len(out.encode()):,} bytes')

def main() -> None:
    if not REPORTS.is_dir():
        raise SystemExit('reports/ 디렉터리가 없다')

    targets = sorted(p for p in REPORTS.iterdir() if (p / 'sections').is_dir())
    if len(sys.argv) > 1:
        want = sys.argv[1].rstrip('/').split('/')[-1]
        targets = [p for p in targets if p.name == want]
        if not targets:
            raise SystemExit(f'reports/{want} 를 찾지 못했다')
    if not targets:
        raise SystemExit('reports/ 안에 조립할 보고서가 없다')

    for doc in targets:
        build(doc)

if __name__ == '__main__':
    main()
