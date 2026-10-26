from pathlib import Path
import json
import hashlib
import shutil

root = Path(__file__).resolve().parents[1]
output = root / 'output/rumor-olive-ui-2026-10-25'
output.mkdir(parents=True, exist_ok=True)
script = (root / 'scratch/check-rumor-letter.cjs').read_text(encoding='utf-8')
script = script.replace('output/rumor-letter-ui-2026-10-25', 'output/rumor-olive-ui-2026-10-25')
script = script.replace("'.js': 'text/javascript'", "'.svg': 'image/svg+xml', '.js': 'text/javascript'")
marker = "        await page.screenshot({ path: path.join(output, prefix + '-reading.png') });"
checks = '''        const appearance = await page.evaluate(async () => {
            const { getItemArtwork } = await import('/js/data/itemArtwork.js');
            const art = document.querySelector('.rumor-envelope-art');
            await art.decode();
            return { actual: art.getAttribute('src'), expected: getItemArtwork('item_premium_rumor'),
                header: getComputedStyle(document.querySelector('.rumor-header')).backgroundColor,
                action: getComputedStyle(document.querySelector('.rumor-confirm-btn')).backgroundColor };
        });
        assert.equal(appearance.actual, appearance.expected);
        assert.equal(appearance.actual, 'assets/items/paper-v4/sealed-news.svg');
        assert.equal(appearance.header, 'rgb(76, 98, 55)');
        assert.equal(appearance.action, 'rgb(101, 127, 67)');
'''
script = script.replace(marker, checks + marker, 1)
(root / 'scratch/check-rumor-olive.cjs').write_text(script, encoding='utf-8')
files = ['css/modules/rumor-letter.css', 'js/components/inventory/RumorPopup.js',
         'js/data/itemArtwork.js', 'assets/items/paper-v4/sealed-news.svg']
records = []
for relative in files:
    source = root / 'web' / relative
    target = root / 'electron-app/dist/win-unpacked/resources/web' / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    assert hashlib.sha256(target.read_bytes()).hexdigest() == digest
    records.append({'path': relative, 'sha256': digest})
(output / 'sync-manifest.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
print('Synced UI and shared current shop artwork; 4 hashes match.')
