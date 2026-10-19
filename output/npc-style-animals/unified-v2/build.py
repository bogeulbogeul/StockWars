"""Native image edits -> canonical sprite-gen extraction -> shared idle/neutral."""
import copy
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CLI = Path(r'C:\Users\bogeu\.codex\skills\sprite-gen\.venv\Scripts\sprite-gen.exe')

def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def build(animal):
    source = ROOT / 'output/npc-style-animals/portraits-v1' / animal / 'run'
    run = HERE / animal / 'run'
    run.mkdir(parents=True, exist_ok=True)
    jobs = [j for j in read(HERE / 'generation.json') if j['animal'] == animal]
    req = read(source / 'sprite-request.json')
    for state, info in req['states'].items():
        if info['frames'] > 1:
            info['fps'] = 6.25
    recipe = run.parent / 'request.json'
    write(recipe, req)
    def call(verb, *args):
        p = subprocess.run([str(CLI), verb, *args], capture_output=True, text=True, encoding='utf-8')
        (run / (verb + '.log')).write_text(p.stdout + '\n' + p.stderr, encoding='utf-8')
        if p.returncode:
            raise RuntimeError(p.stdout + p.stderr)
        print(animal, verb, 'OK', flush=True)
    call('prepare', '--out-dir', str(run), '--character-id', f'{animal}-unified-v2',
         '--base-image', str(source / 'frames/down_idle/frame-0.png'), '--request', str(recipe), '--chroma-key', '#00FFFF')
    prepared = read(run / 'sprite-request.json')
    prepared['chroma'] = req['chroma']
    write(run / 'sprite-request.json', prepared)
    for job in jobs:
        shutil.copy2(job['path'], run / 'raw' / (job['state'] + '.png'))
    call('extract', '--run-dir', str(run), '--states', ','.join(j['state'] for j in jobs))
    fm_path = run / 'frames/frames-manifest.json'
    fm = read(fm_path)
    rows = {r['state']: r for r in fm['rows']}
    checks = []
    for direction in ('down', 'right', 'up'):
        idle, walk = direction + '_idle', direction + '_walk'
        dst = run / 'frames' / idle / 'frame-0.png'
        dst.parent.mkdir(exist_ok=True)
        src = run / 'frames' / walk / 'frame-1.png'
        shutil.copy2(src, dst)
        row = copy.deepcopy(rows[walk])
        row.update(state=idle, frames=1, files=[f'frames/{idle}/frame-0.png'])
        row['frame_records'] = [copy.deepcopy(row['frame_records'][1])]
        row['frame_records'][0]['index'] = 0
        row['source'] = f'{walk}/frame-1.png (byte-identical neutral pose)'
        rows[idle] = row
        checks.append({'state': idle, 'source': walk + '/frame-1.png',
                       'byte_identical': src.read_bytes() == dst.read_bytes(),
                       'sha256': hashlib.sha256(dst.read_bytes()).hexdigest()})
    fm['rows'] = [rows[s] for s in req['states']]
    fm['shared_idle_neutral'] = checks
    write(fm_path, fm)
    call('compose-atlas', '--run-dir', str(run))
    call('inspect', '--run-dir', str(run))
    call('preview', '--run-dir', str(run))
    write(run / 'transition-verification.json', checks)

if __name__ == '__main__':
    for animal in ('dog', 'cat'):
        build(animal)
