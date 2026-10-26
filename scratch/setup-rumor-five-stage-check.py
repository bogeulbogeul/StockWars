from pathlib import Path
import shutil
import hashlib
import json

root = Path(__file__).resolve().parents[1]
output = root / 'output/rumor-five-stage-rollout-2026-10-25'
script = (root / 'scratch/check-five-levels.cjs').read_text(encoding='utf-8')
script = script.replace('output/analysis-five-levels-2026-10-25', 'output/rumor-five-stage-rollout-2026-10-25')
script = script.replace('[1, 3, 4, 6, 7, 10]', '[1, 2, 3, 4, 5]')
script = script.replace('level <= 3 ? 1 : level <= 6 ? 4 : 7', 'level === 1 ? 1 : level <= 3 ? 2 : 4')
script = script.replace('interpretationLevel: 10', 'interpretationLevel: 5').replace('/4\\/10/', '/2\\/5/')
(root / 'scratch/check-rumor-five-stage.cjs').write_text(script, encoding='utf-8')
web = root / 'web'
files = [p.relative_to(web) for folder in ['js/data/rumors', 'js/data/rumorQuizzes'] for p in (web / folder).rglob('*.js')]
files += [Path(p) for p in ['js/data/authoredRumors.js', 'js/data/rumorCatalog.js', 'js/data/authoredRumorQuizzes.js',
    'js/engine/RumorStageMigration.js', 'js/engine/RumorInterpretation.js', 'js/engine/RumorDecryption.js',
    'js/engine/RumorQuizQuestions.js', 'js/engine/AnalysisGrowth.js', 'js/engine/ItemEngine.js',
    'js/components/inventory/RumorPopup.js', 'js/components/inventory/RumorQuizCard.js']]
records = []
for relative in sorted(set(files)):
    source = web / relative
    target = root / 'electron-app/dist/win-unpacked/resources/web' / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    assert hashlib.sha256(target.read_bytes()).hexdigest() == digest
    records.append({'path': relative.as_posix(), 'sha256': digest})
(output / 'sync-manifest.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
print(f'Synchronized {len(records)} data/engine/UI modules; hashes match.')
