from pathlib import Path
import hashlib
import json
import shutil

root = Path(__file__).resolve().parents[1]
web = root / 'web'
desktop = root / 'electron-app/dist/win-unpacked/resources/web'
assert desktop.is_dir()
files = [Path('js/data/authoredRumorQuizzes.js'), Path('js/engine/RumorQuizQuestions.js'), Path('js/engine/AnalysisGrowth.js')]
files += [path.relative_to(web) for path in sorted((web / 'js/data/rumorQuizzes').rglob('*.js'))]
records = []
for relative in files:
    source, target = web / relative, desktop / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    assert hashlib.sha256(target.read_bytes()).hexdigest() == digest
    records.append({'path': relative.as_posix(), 'sha256': digest})
output = root / 'output/authored-quiz-rollout-2026-10-25'
output.mkdir(parents=True, exist_ok=True)
(output / 'sync-manifest.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
print(f'Synchronized and hash-verified {len(records)} files to existing unpacked runtime.')
