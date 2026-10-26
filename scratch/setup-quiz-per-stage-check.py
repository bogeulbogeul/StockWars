from pathlib import Path
import json
import hashlib
import shutil

root = Path(__file__).resolve().parents[1]
output = root / 'output/quiz-per-stage-2026-10-25'
script = (root / 'scratch/check-rumor-five-stage.cjs').read_text(encoding='utf-8')
script = script.replace('output/rumor-five-stage-rollout-2026-10-25', 'output/quiz-per-stage-2026-10-25')
script = script.replace('q.minLevel === (level === 1 ? 1 : level <= 3 ? 2 : 4)', 'q.minLevel === level')
script = script.replace('        for (const level of [1, 2, 3, 4, 5]) {', '        const shownQuestions = [];\n        for (const level of [1, 2, 3, 4, 5]) {')
script = script.replace("            assert.equal(await page.locator('.rumor-quiz-question').count(), 1);",
    "            assert.equal(await page.locator('.rumor-quiz-question').count(), 1);\n            shownQuestions.push(expected.question);")
script = script.replace("        await page.screenshot({ path: path.join(output, prefix + '-authored-high.png') });",
    "        assert.equal(new Set(shownQuestions).size, 5);\n        await page.screenshot({ path: path.join(output, prefix + '-authored-high.png') });")
(root / 'scratch/check-quiz-per-stage.cjs').write_text(script, encoding='utf-8')
web = root / 'web'
files = [Path('js/data/authoredRumorQuizzes.js'), Path('js/engine/RumorQuizQuestions.js')]
files += [p.relative_to(web) for p in (web / 'js/data/rumorQuizzes').rglob('*.js')]
records = []
for relative in sorted(files):
    source = web / relative
    target = root / 'electron-app/dist/win-unpacked/resources/web' / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    assert hashlib.sha256(target.read_bytes()).hexdigest() == digest
    records.append({'path': relative.as_posix(), 'sha256': digest})
(output / 'sync-manifest.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
print(f'Synced {len(records)} modules; prepared browser check for five different questions.')
