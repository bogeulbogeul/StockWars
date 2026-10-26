from pathlib import Path
import hashlib
import json
import shutil

root = Path(__file__).resolve().parents[1]
script = (root / 'scratch/check-authored-quiz.cjs').read_text(encoding='utf-8')
script = script.replace('output/authored-quiz-rollout-2026-10-25', 'output/analysis-five-levels-2026-10-25')
script = script.replace('slice(0, 6)', 'slice(0, 20)').replace('index < 6', 'index < 20')
script = script.replace('progress.required, 6', 'progress.required, 30').replace('/2\\/10/', '/4\\/10/')
(root / 'scratch/check-five-levels.cjs').write_text(script, encoding='utf-8')
files = ['js/engine/AnalysisGrowth.js', 'js/engine/AnalysisGrowthMigration.js',
         'js/engine/RumorInterpretation.js', 'js/engine/ItemEngine.js', 'js/components/inventory/RumorQuizCard.js']
output = root / 'output/analysis-five-levels-2026-10-25'
records = []
for relative in files:
    source = root / 'web' / relative
    target = root / 'electron-app/dist/win-unpacked/resources/web' / relative
    assert target.parent.is_dir()
    shutil.copy2(source, target)
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    assert hashlib.sha256(target.read_bytes()).hexdigest() == digest
    records.append({'path': relative, 'sha256': digest})
(output / 'sync-manifest.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
print('Synchronized 5 runtime files; prepared 20-answer browser promotion check.')
