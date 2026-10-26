from pathlib import Path
import json
import shutil
import hashlib

root = Path(__file__).resolve().parents[1]
output = root / 'output/rumor-letter-ui-2026-10-25'
script = (root / 'scratch/check-rumor-letter.cjs').read_text(encoding='utf-8')
marker = '        await mount(page);\n'
script = script.replace(marker, marker + "        await page.screenshot({ path: path.join(output, prefix + '-reading.png') });\n", 1)
(root / 'scratch/check-rumor-letter.cjs').write_text(script, encoding='utf-8')
files = ['css/style.css', 'css/modules/rumor-letter.css', 'js/components/inventory/RumorPopup.js',
         'js/components/inventory/RumorQuizCard.js']
records = []
for relative in files:
    source = root / 'web' / relative
    target = root / 'electron-app/dist/win-unpacked/resources/web' / relative
    shutil.copy2(source, target)
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    assert hashlib.sha256(target.read_bytes()).hexdigest() == digest
    records.append({'path': relative, 'sha256': digest})
(output / 'sync-manifest.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
print('Synced 4 UI files; existing envelope art reused.')
