"""Export approved news manuscripts to small runtime modules and the existing desktop."""
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/news-rollout-2026-10-25'
OUT.mkdir(parents=True, exist_ok=True)
items = json.loads((ROOT / 'Docs/Data/CorporateNews_Current.json').read_text(encoding='utf-8'))
assert len(items) == len({item['id'] for item in items}) == 288
directory = ROOT / 'web/js/data/news'
directory.mkdir(exist_ok=True)
sectors = list(dict.fromkeys(item['sector'] for item in items))
files = []
for sector in sectors:
    selected = [item for item in items if item['sector'] == sector]
    assert len(selected) == 36
    text = '// Generated from Docs/Data/CorporateNews_Current.json; independent game scenarios.\n'
    text += f'export const {sector.upper()}_NEWS = [\n'
    for item in selected:
        text += '    ' + json.dumps(item, ensure_ascii=False, separators=(',', ':')) + ',\n'
    text += '];\n'
    path = directory / f'{sector}.js'
    path.write_text(text, encoding='utf-8')
    files.append(path.relative_to(ROOT / 'web'))
catalog = ROOT / 'web/js/data/newsCatalog.js'
text = ''.join(f"import {{ {sector.upper()}_NEWS }} from './news/{sector}.js';\n" for sector in sectors)
text += '''
// Category describes editorial direction, never a guaranteed price movement.
export const CURRENT_NEWS = [
'''
text += ''.join(f'    ...{sector.upper()}_NEWS,\n' for sector in sectors)
text += '''].map(article => ({
    ...article,
    body: [...article.body],
    type: '뉴스',
    time: '소식 모음',
    isPositive: article.category.endsWith('호재')
}));
'''
catalog.write_text(text, encoding='utf-8')
files.append(catalog.relative_to(ROOT / 'web'))
stocks_path = ROOT / 'web/js/data/stocksData.js'
stocks = stocks_path.read_text(encoding='utf-8')
marker = 'export const INITIAL_NEWS = ['
if marker in stocks:
    backup = OUT / 'previous-initial-news.js'
    if not backup.exists():
        backup.write_text(stocks[stocks.index(marker):], encoding='utf-8')
    stocks = stocks[:stocks.index(marker)] + "export { CURRENT_NEWS as INITIAL_NEWS } from './newsCatalog.js';\n"
    stocks_path.write_text(stocks, encoding='utf-8')
files.append(stocks_path.relative_to(ROOT / 'web'))
records = []
desktop = ROOT / 'electron-app/dist/win-unpacked/resources/web'
assert desktop.is_dir()
for relative in files:
    source = ROOT / 'web' / relative
    target = desktop / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    assert digest == hashlib.sha256(target.read_bytes()).hexdigest()
    records.append({'path': relative.as_posix(), 'sha256': digest})
(OUT / 'sync-manifest.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
print(f'Exported {len(items)} articles; synchronized {len(files)} files with SHA-256 verification.')
