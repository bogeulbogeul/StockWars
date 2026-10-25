"""Compile the approved company Markdown manuscripts without rewriting old saves."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SECTORS = {'IT': 'IT/기술', 'Entertainment': '엔터/미디어', 'Infrastructure': '인프라/통신',
           'Bio': '바이오/제약', 'Aerospace': '우주/항공', 'Retail': '유통/소비재',
           'Energy': '에너지/친환경', 'Finance': '금융/핀테크'}


def build():
    stocks = (ROOT / 'web/js/data/stocksData.js').read_text(encoding='utf-8')
    names = dict(re.findall(r"id: '([^']+)', name: '([^']+)', sector: '[^']+'", stocks))
    target = ROOT / 'web/js/data/rumors'
    sector_imports = []
    seen = set()
    for sector, label in SECTORS.items():
        folder = target / sector
        folder.mkdir(parents=True, exist_ok=True)
        imports = []
        for path in sorted((ROOT / 'Docs/Rumors' / sector).glob('*.md')):
            text = path.read_text(encoding='utf-8')
            events = []
            sections = re.split(r'^## (호재|악재) ([12]) (.+)\n', text, flags=re.M)
            assert len(sections) == 17, path
            for i in range(1, len(sections), 4):
                direction, slot, title, body = sections[i:i+4]
                event_id = re.search(r'^사건 ID: `([^`]+)`', body, re.M)[1]
                stages = re.findall(r'^> (.+)$', body, re.M)
                assert len(stages) == len(set(stages)) == 5, event_id
                assert event_id not in seen
                seen.add(event_id)
                events.append(dict(rumorId=event_id, targetStockId=path.stem,
                    targetStockName=names[path.stem], targetSector=label,
                    rumorDirection='positive' if direction == '호재' else 'negative',
                    name=title, rumorStages=stages, sourceDocument=f'Docs/Rumors/{sector}/{path.name}'))
            variable = 'R_' + path.stem
            payload = json.dumps(events, ensure_ascii=False, indent=2)
            (folder / path.name.replace('.md', '.js')).write_text(
                '// Generated from company manuscripts by scratch/build-rumor-runtime.py.\n'
                f'export const {variable} = {payload};\n', encoding='utf-8')
            imports.append((variable, f'./{sector}/{path.stem}.js'))
        index = '\n'.join(f"import {{ {v} }} from '{p}';" for v, p in imports)
        index += f'\nexport const {sector.upper()}_RUMORS = [' + ', '.join('...'+v for v,p in imports) + '];\n'
        (target / f'{sector}.js').write_text(index, encoding='utf-8')
        sector_imports.append((sector.upper()+'_RUMORS', f'./rumors/{sector}.js'))
    assert len(seen) == 288
    source = '\n'.join(f"import {{ {v} }} from '{p}';" for v,p in sector_imports)
    source += '\nexport const AUTHORED_RUMORS = [' + ', '.join('...'+v for v,p in sector_imports) + '];\n'
    (target.parent / 'authoredRumors.js').write_text(source, encoding='utf-8')
    print('Compiled 72 companies / 288 events / 1440 exact stage texts')


if __name__ == '__main__':
    build()
