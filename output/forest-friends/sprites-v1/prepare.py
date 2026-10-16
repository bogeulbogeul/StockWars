"""Extract accepted design views, prepare canonical sprite-gen row runs."""
import copy
import json
import subprocess
import sys
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CLI = [sys.executable, '-m', 'sprite_gen.cli']
IDS = ['red-fox', 'siberian-chipmunk', 'raccoon-dog', 'european-badger', 'brown-bear', 'european-rabbit']
IDENTITIES = {
 'red-fox': 'Red fox: russet orange coat, cream muzzle chest belly, dark paws and lower legs, pointed dark-backed ears, ONE long bushy orange tail with white tip.',
 'siberian-chipmunk': 'Siberian chipmunk: golden tan coat, cream cheeks belly paws, small rounded ears, brown facial stripes and longitudinal back stripes, ONE upward curving moderately bushy striped tail. Copy accepted design markings.',
 'raccoon-dog': 'Raccoon DOG: taupe gray-brown coat, dark eye patches, buff muzzle chest belly, dark paws, small rounded triangular ears, ONE short bushy unringed tail with dark tip. NOT American raccoon.',
 'european-badger': 'European badger: ivory head with TWO black longitudinal eye-to-ear bands and white central forehead stripe, silver gray body, dark lower chest paws legs, short gray tail. NOT horizontal raccoon eye mask.',
 'brown-bear': 'Brown bear: warm chocolate brown coat, tan oval muzzle, small ROUND ears, broad round head, wider sturdy compact torso, short round brown tail. No white chest or belly markings.',
 'european-rabbit': 'European rabbit: warm gray-brown coat, cream muzzle chest belly paws, long upright rounded ears dusty pink inside, short white fluffy tail. Rounded rabbit cheek/jaw silhouette, short blunt muzzle, gentle rounded eyes; never feline pointed cheek tufts or sharp cat-eye shape. Keep approved nose color. Preserve rabbit ears and head size in every frame; never replace with dog ears.'
}
ACTIONS = {
 'down_idle': (1, 'Straight FRONT neutral standing, both feet planted, relaxed arms.'),
 'down_walk': (3, 'Straight FRONT fixed view. EXACTLY THREE poses left to right: A own LEFT foot forward and own RIGHT arm forward; NEUTRAL both soles planted arms down; B own RIGHT foot forward and own LEFT arm forward. A/B opposite feet and arms, not duplicates. Walk in place, no hopping. Neutral is the standing idle.'),
 'right_idle': (1, 'Front-right THREE QUARTER standing, BOTH eyes and chest visible.'),
 'right_walk': (3, 'Front-right THREE QUARTER fixed view matching DOG motion reference, BOTH eyes and chest visible. THREE poses: A near leg forward far leg back and near arm BACK; NEUTRAL both soles planted arms down; B far leg forward near leg back and near arm FORWARD. Near arm counter-swings back/down/forward, far arm partly occluded. Low grounded steps with knees and ankles. NO pure profile, no hopping. Neutral is standing idle.'),
 'up_idle': (1, 'Straight BACK standing, no face. Rear heels and ankles visible, toes point away.'),
 'up_walk': (3, 'Straight BACK fixed view. THREE poses: A own LEFT foot forward right arm forward; NEUTRAL both feet planted arms down; B own RIGHT foot forward left arm forward. Alternate feet clearly, show REAR heels/ankles. Raised feet are smooth fur-covered shapes: NO sole plane, NO paw pads, NO toe beans, NO internal oval/circular pad marks. No front-facing toes. Tail attached to rear pelvis. No face or chest markings on back.'),
 'right_carry': (4, 'Front-right three-quarter facing RIGHT, BOTH eyes visible. FOUR alternating gait poses: near leg forward contact; near support far knee passing; FAR leg forward contact near leg BACK; far support near knee passing. Both arms forward elbows bent and palms UP, hands side-by-side at stable waist height supporting an imaginary separate parcel. Use CAT motion reference for hand support. Draw NO BOX or furniture. Constant hand/torso position, feet alternate; tail never replaces arm.'),
 'down_sit': (1, 'ONE FRONT CHAIR-seated pose. Upright torso, pelvis elevated on imaginary seat, thighs project forward, knees bent 90 degrees, lower legs down, paws rest on thighs. NO chair, NO floor sitting, no haunch crouch. Tail behind hips.'),
 'right_sit': (1, 'ONE held CHAIR-seated pose elevated isometric FRONT-RIGHT three-quarter with BOTH eyes visible, not pure profile. Upright torso, pelvis elevated, thighs forward along room diagonal, knees bent 90 degrees lower legs down, paws on thighs. NO chair, NO floor sitting. Tail behind hips.'),
 'face_portrait': (1, 'ONE straight front-facing head portrait including entire ears and tiny neck tuft, no body. Match front identity exactly.')
}

def write(path, data):
 path.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def call(*args):
 p = subprocess.run(CLI+list(args), capture_output=True, text=True, encoding='utf-8')
 if p.returncode: raise RuntimeError(p.stdout+p.stderr)

def main():
 jobs=[]
 for cid in IDS:
  folder=HERE/cid
  refs=folder/'design-views'
  refs.mkdir(parents=True,exist_ok=True)
  source=HERE.parent/(cid+'-design-v1')/'design-sheet.png'
  im=Image.open(source).convert('RGB')
  w,h=im.size
  boxes={'down':(0,75,w//3,668), 'right':(w//3,75,2*w//3,668), 'up':(2*w//3,75,w,668), 'face':(480,680,910,1070)}
  for direction,box in boxes.items():
   crop=refs/(direction+'-source.png')
   im.crop(box).save(crop)
   call('cutout',str(crop),'--out',str(refs/(direction+'.png')),'--key','white','--erode','0')
  req={'version':1,'kind':'sprite-gen-request','engine':'component-row',
   'character':{'id':cid+'-forest-v1','description':IDENTITIES[cid]},
   'cell':{'shape':'rect','width':320,'height':400,'safe_margin_x':28,'safe_margin_y':28},
   'chroma_key':{'name':'cyan','hex':'#00FFFF','rgb':[0,255,255],'selection':'manual'},
   'states':{s:{'frames':n,'fps':6.25 if n>1 else 1,'loop':n>1,'action':a+' '+IDENTITIES[cid]} for s,(n,a) in ACTIONS.items()},
   'style':'Copy accepted identity image exactly: head/body proportions, coat markings, brown eyes, ear shapes, clean dark outline and restrained cel shading. Two-legged compact SD animal, short arms legs, rounded paws with small digit lines. NO paw pads, NO toe beans, NO circular/oval sole or palm markings on any animal. All lifted feet retain surrounding fur color, never a distinct sole plane. No clothes shoes props shadows lettering grids or environment. Reference motion image is POSE ONLY, never copy its species or colors or forbidden pads. '+IDENTITIES[cid],
   'fit':{'resample':'lanczos','align_x':'bbox-center','align_y':'bottom','ground_frames':True,'pixel_unfake':False},
   'chroma':{'mode':'rgb','unmix_reach':4,'spill_max_fraction':0.005}}
  recipe=folder/'request.json'
  write(recipe,req)
  run=folder/'run'
  call('prepare','--out-dir',str(run),'--character-id',cid+'-forest-v1','--base-image',str(refs/'down.png'),'--request',str(recipe),'--chroma-key','#00FFFF')
  write(run/'sprite-request.json',req | {'character':req['character'] | {'base_image':'base-source.png'}})
  notes='Generation uses the built-in image_gen tool per state row (native tool adapter in this chat), instead of a second Codex CLI session. Canonical sprite-gen prepare/extract/compose/inspect remain unchanged. Direction identity inputs are single accepted poses cropped deterministically from the approved design sheet and cut out with sprite-gen cutout. Motion refs: dog unified-v2 walking; cat unified-v2 carry and sitting. These own pose only. Runtime idle is byte-identical walk neutral. No game integration in this run.\n'
  (run/'qa-notes.md').write_text(notes,encoding='utf-8')
  for state,(n,action) in ACTIONS.items():
   if state.endswith('_idle') or state=='face_portrait':
    view='face' if state=='face_portrait' else state.split('_')[0]
    import shutil
    shutil.copy2(refs/(view+'.png'),run/'raw'/(state+'.png'))
    continue
   direction=state.split('_')[0]
   animal='cat' if state in ['right_carry','down_sit','right_sit'] else 'dog'
   motion=ROOT/'output/npc-style-animals/unified-v2'/animal/'run/raw'/(state+'.png')
   prompt=(run/'prompts'/(state+'.txt')).read_text(encoding='utf-8')
   prompt+='\nInput roles: image 1 is this exact character identity in requested direction; image 2 is the existing '+animal+' row for POSE, anatomy and camera ONLY, never appearance; image 3 is empty spacing geometry ONLY. Preserve identity from image 1. '+action+'\nDraw a single horizontal row of EXACTLY '+str(n)+' complete separated figures, with wide cyan gutters. Background solid #00FFFF. No text or props. Match limb phases from image 2. Outdoors RPG top-down and indoor isometric are project directions; keep specified character camera.\n'
   (run/'prompts'/(state+'.txt')).write_text(prompt,encoding='utf-8')
   jobs.append({'id':cid,'state':state,'prompt':prompt,'refs':[str(refs/(direction+'.png')),str(motion),str(run/'references/layout-guides'/(state+'.png'))],'out':str(run/'raw'/(state+'.png'))})
  print(cid,'prepared',flush=True)
 write(HERE/'jobs.json',jobs)

if __name__=='__main__': main()
