"""Prepare canonical row extraction with explicit cat identity/dog pose references."""
from pathlib import Path
import json
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent.parent
CLI = Path('C:/Users/bogeu/.codex/skills/sprite-gen/.venv/Scripts/sprite-gen.exe')
ROOT.mkdir(exist_ok=True)
refs = ROOT / 'references'
refs.mkdir(exist_ok=True)
design = PROJECT / 'output/cat-design-2026-10-18-v1/design-sheet.png'
# Identity crop only, not sprite frame extraction or fixed grid segmentation.
Image.open(design).crop((25, 130, 350, 630)).save(refs / 'cat-front.png')
dogroot = PROJECT / 'output/dog-rgb-motion-v1'
dog = Image.open(dogroot / 'sprite-sheet-alpha.png').convert('RGBA')
manifest = json.loads((dogroot / 'manifest.json').read_text(encoding='utf-8'))
states = dict(right_walk=3, down_walk=3, up_walk=3, right_carry=4,
              down_sit=1, right_sit=1, face_portrait=1)
for state, count in states.items():
    board = Image.new('RGBA', (512 * count, 512), (255, 255, 255, 255))
    for index, cell in enumerate(manifest['frame_layout']['rows'][state][:count]):
        x, y, w, h = (cell[k] for k in ('x', 'y', 'w', 'h'))
        board.alpha_composite(dog.crop((x, y, x+w, y+h)), (index*512, 0))
    board.convert('RGB').save(refs / f'dog-{state}.png')
request = dict(version=1, kind='sprite-gen-request', engine='component-row',
    character=dict(id='black-cat-design-motion-v1', base_image=str(refs/'cat-front.png')),
    cell=dict(shape='square', width=512, height=512, safe_margin_x=24, safe_margin_y=24),
    chroma_key=dict(name='cyan', hex='#00FFFF', rgb=[0,255,255], selection='manual'),
    states={s:dict(frames=n, fps=6.25, loop=n>1, action=s) for s,n in states.items()},
    style='Clean outlined SD animal illustration, charcoal black cat, amber eyes, pink inner ears, design-sheet identity. No paw pads.',
    fit=dict(resample='lanczos', align_x='bbox-center', align_y='bottom',
             ground_frames=False, pixel_unfake=False),
    chroma=dict(mode='rgb', unmix_reach=4, spill_max_fraction=0.005))
(ROOT/'request.json').write_text(json.dumps(request,indent=2),encoding='utf-8')
subprocess.run([str(CLI),'prepare','--out-dir',str(ROOT/'run'),'--character-id',
    'black-cat-design-motion-v1','--base-image',str(refs/'cat-front.png'),
    '--request',str(ROOT/'request.json'),'--chroma-key','#00FFFF','--force'],check=True)
special = {
    'right_walk':'TRUE RIGHT PROFILE, one visible eye. Match each dog stride, low lifted foot, alternating opposite arm and leg. Frames A, neutral, opposite B.',
    'down_walk':'FRONT view. Match dog opposite arm and leg, low lifted feet, three poses A, neutral, opposite B.',
    'up_walk':'REAR view. Back of ears NOT pink inner ears; back of head NO face. Heels toward viewer, toes away. Match dog A, neutral, opposite B; feline tail rooted behind pelvis.',
    'right_carry':'TRUE RIGHT PROFILE. Four EXACT dog leg poses in reference order, including different second and fourth bent legs. Both hands held steadily forward to support a separate box. Draw NO box. Far arm correctly occluded. Do not duplicate frame 2 as frame 4.',
    'down_sit':'FRONT seated hold, short legs bent like reference, hands on knees, same head size as standing. Draw NO chair.',
    'right_sit':'ISOMETRIC right-front three-quarter seated hold, NOT profile. Short bent legs and hands like reference, same head size as standing. Draw NO chair.',
    'face_portrait':'FACE AND EARS ONLY, front neutral confident expression. No neck, chest or body.'}
palette = json.loads((design.parent/'colors-detailed.json').read_text(encoding='utf-8'))
colors = ', '.join(dict.fromkeys(r['hex'] for r in palette['colors']))
for state in states:
    path = ROOT/'run/prompts'/f'{state}.txt'
    original = path.read_text(encoding='utf-8')
    added = ('\nUSER PRIORITY: Reference 1 is accepted cat identity, reference 2 its full design sheet; '
      'reference 3 is DOG POSES ONLY, reference 4 empty layout guide. Replace dog with this EXACT cat '
      'one-to-one, preserving camera, torso tilt, limb pose/order, arm occlusion and body rhythm. '
      'Keep cat upright triangular ears, dark charcoal fur, amber eyes, feline muzzle and long slender '
      'curved tail; no dog ears, cream markings, fluffy dog tail, clothes, shoes, paw pads. '
      'Match cat design head/body proportions and clean outlines across frames. '
      'Render separated full characters on perfectly flat cyan #00FFFF with generous empty gaps, '
      'NO ground shadows, text, labels, guide lines or other objects. '+special[state]+
      '\nCat source RGB palette (use matching material colors, not dog colors): '+colors+'\n')
    path.write_text(original+added,encoding='utf-8')
(ROOT/'qa-notes.md').write_text('# Cat motion production\n\n'
    'Identity/colors: ../cat-design-2026-10-18-v1/design-sheet.png and colors-detailed.json.\n'
    'Extra motion references: references/dog-<state>.png, cropped using latest dog manifest; pose only.\n'
    'Generated rows use canonical prepare prompts and layout guides, with explicit cat/dog reference roles.\n'
    'Game installation is outside this production request. Motion verdict pending extraction/review.\n',encoding='utf-8')
print('Prepared', ROOT/'run')
