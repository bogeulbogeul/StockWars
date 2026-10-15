import copy
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CLI = Path(r'C:\Users\bogeu\.codex\skills\sprite-gen\.venv\Scripts\sprite-gen.exe')
source = ROOT / 'output/npc-style-animals/unified-v2/dog/run'
run = HERE / 'dog/run'

def read(p):
    return json.loads(p.read_text(encoding='utf-8-sig'))

def write(p, data):
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def call(verb, *args):
    p = subprocess.run([str(CLI), verb, *args], capture_output=True, text=True, encoding='utf-8')
    (run / (verb + '.log')).write_text(p.stdout + '\n' + p.stderr, encoding='utf-8')
    if p.returncode:
        raise RuntimeError(p.stdout + p.stderr)
    print(verb, 'OK', flush=True)

run.mkdir(parents=True, exist_ok=True)
jobs = read(HERE / 'generation.json')
req = read(source / 'sprite-request.json')
portrait = req['states'].pop('face_portrait')
for j in jobs:
    req['states'][j['state']] = dict(frames=3, fps=6.25, loop=True,
        action='Identical held body/face/limbs; only tail swishes outward, neutral, inward. Full frame animation, no rig.')
req['states']['face_portrait'] = portrait
write(HERE / 'request.json', req)
if not (run / 'sprite-request.json').exists():
    call('prepare', '--out-dir', str(run), '--character-id', 'dog-tail-wag-v1', '--base-image',
         str(source / 'frames/down_idle/frame-0.png'), '--request', str(HERE / 'request.json'), '--chroma-key', '#00FFFF')
prepared = read(run / 'sprite-request.json')
prepared['states'] = req['states']
prepared['chroma'] = req['chroma']
write(run / 'sprite-request.json', prepared)
shutil.copytree(source / 'frames', run / 'frames', dirs_exist_ok=True)
for j in jobs:
    shutil.copy2(j['path'], run / 'raw' / (j['state'] + '.png'))
call('extract', '--run-dir', str(run), '--states', ','.join(j['state'] for j in jobs))
fm_path = run / 'frames/frames-manifest.json'
fm = read(fm_path)
rows = {r['state']: r for r in read(source / 'frames/frames-manifest.json')['rows']}
rows.update({r['state']: r for r in fm['rows']})
for j in jobs:
    # Retain an exact approved neutral drawing at the center of each wag loop.
    src = source / 'frames' / j['source'] / 'frame-0.png'
    shutil.copy2(src, run / 'frames' / j['state'] / 'frame-1.png')
    record = copy.deepcopy(rows[j['source']]['frame_records'][0])
    record['index'] = 1
    rows[j['state']]['frame_records'][1] = record
fm['rows'] = [rows[s] for s in req['states']]
fm['imports'] = {'source': str(source), 'preserved_original_frames': True}
write(fm_path, fm)
verification = []
for s in read(source / 'sprite-request.json')['states']:
    for f in (source / 'frames' / s).glob('frame-*.png'):
        dst = run / 'frames' / s / f.name
        assert f.read_bytes() == dst.read_bytes()
        verification.append({'frame': str(f.relative_to(source)), 'unchanged': True,
                             'sha256': hashlib.sha256(dst.read_bytes()).hexdigest()})
write(run / 'preservation.json', verification)
subprocess.run(['node', str(HERE / 'lock-body.cjs')], check=True)
# Refresh QA records after deterministic full-frame assembly.
from PIL import Image
for j in jobs:
    for index in (0, 2):
        with Image.open(run / 'frames' / j['state'] / f'frame-{index}.png') as im:
            alpha = im.getchannel('A')
            record = rows[j['state']]['frame_records'][index]
            record['bbox'] = list(alpha.getbbox())
            record['nontransparent_pixels'] = sum(v > 0 for v in alpha.getdata())
fm['rows'] = [rows[s] for s in req['states']]
write(fm_path, fm)
call('compose-atlas', '--run-dir', str(run))
call('inspect', '--run-dir', str(run))
call('preview', '--run-dir', str(run))
subprocess.run(['node', str(HERE / 'compact.cjs')], check=True)
