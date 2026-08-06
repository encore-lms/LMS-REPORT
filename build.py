#!/usr/bin/env python3
"""보고서 조립기.

sections/NN-제목.html 조각을 파일명 순서대로 sections/00-shell.html 의
<!--SECTIONS--> 자리에 끼워 발행 HTML 을 다시 만든다.

- 섹션 추가: sections/ 에 다음 번호로 파일을 만들고 이 스크립트를 실행.
- 중간 삽입·순서 변경: 파일명 번호만 바꾸면 된다 — 조각 안의 <!--NUM-->
  토큰이 조립 순서대로 01, 02… 로 채워지므로 본문은 손대지 않는다.
- 발행 HTML 은 생성물이다. 직접 수정하면 다음 조립 때 사라진다.

사용법:  python3 build.py
"""
from pathlib import Path

ROOT = Path(__file__).parent
SECTIONS = ROOT / 'sections'
OUT = ROOT / '2026-08-05_임원보고_진행현황.html'
# Jekyll(Liquid)이 {{ }} 를 템플릿으로 해석해 Pages 빌드를 깨뜨리므로 주석 토큰을 쓴다.
MARKER = '<!--SECTIONS-->'

def main():
    shell = (SECTIONS / '00-shell.html').read_text(encoding='utf-8')
    assert MARKER in shell, f'_shell.html 에 {MARKER} 가 없다'

    files = sorted(p for p in SECTIONS.glob('[0-9]*.html') if p.name != '00-shell.html')
    assert files, 'sections/ 에 번호 붙은 조각이 없다'

    parts = []
    for i, p in enumerate(files, 1):
        frag = p.read_text(encoding='utf-8').rstrip('\n')
        assert '<!--NUM-->' in frag, f'{p.name} 에 <!--NUM--> 토큰이 없다'
        parts.append(f'  <!-- ══ {i} ══ -->\n' + frag.replace('<!--NUM-->', f'{i:02d}'))

    # 마커 줄 자체의 개행이 마지막 </section> 뒤 개행 역할을 한다 — 여기서 덧붙이면 빈 줄이 늘어난다.
    out = shell.replace(MARKER, '\n\n'.join(parts), 1)
    OUT.write_text(out, encoding='utf-8')
    print(f'{OUT.name}  ←  조각 {len(files)}개, {len(out.encode()):,} bytes')
    for i, p in enumerate(files, 1):
        print(f'  {i:02d}  {p.name}')

if __name__ == '__main__':
    main()
