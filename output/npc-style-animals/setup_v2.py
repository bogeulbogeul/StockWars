import json,shutil
from pathlib import Path
root=Path(__file__).parent
for species in ['dog','cat']:
 old=root/'motions-v1'/species/'run'
 dest=root/'motions-v2'/species
 dest.mkdir(parents=True,exist_ok=True)
 req=json.loads((root/'motions-v1'/species/'request.json').read_text(encoding='utf-8'))
 req['style']=req['style'].replace('Flat uniform cyan key background outside character, including between limbs.','Use only the flat key background specified in the layout requirements.')
 req['states']['right_walk']['frames']=6
 req['states']['right_walk']['fps']=8
 req['states']['right_walk']['action']='ONE complete SIX-POSE biped walk cycle facing RIGHT, actual SIDE PROFILE. Image1 owns identity/style/colors, image2 layout only, image3 bear WALKING reference owns limb movement only. Transfer the SIX sequential bear walking poses to this animal, ignore all bear appearance colors costume hat scenery and text. Frames1-3 first step, frames4-6 opposite step. Pose1 near leg forward on ground far leg back; pose2 near leg supporting far heel lifts and knee bends; pose3 far leg passes near leg under pelvis; pose4 FAR leg forward on ground NEAR leg back; pose5 FAR leg supporting NEAR heel lifts and knee bends; pose6 NEAR leg passes under pelvis. Opposite arms counter swing. Near leg must be BEHIND in second half, not repeatedly ahead. Keep same head, torso and scale, low relaxed steps, tiny head bob, tail gentle controlled movement from fixed pelvis root. No neutral stop inserted in the cycle, no high kicks. Exactly6 complete figures with gaps.'
 if species=='cat':
  req['style']='Copy cat FRONT IDLE reference precisely: charcoal black fur #35343D base, subdued cool gray #4A4854 highlight planes, near-black outlines, amber eyes, pink inner ears, same head/body proportions and fur tuft shapes. ALL directions share these exact fur tones and clean restrained NPC cel shading; do not make rear lighter gray, brown or differently textured. No clothes props halo shadows. One integrated long curved black tail.'
  for state in ['up_idle','up_walk']:
   req['states'][state]['action']+=' Match FRONT reference coat values and NPC linework exactly, including same dark limbs and subdued highlight strength. Camera rotation does not change lighting or fur palette.'
 (dest/'request.json').write_text(json.dumps(req,indent=2),encoding='utf-8')
 dest.joinpath('old-raw').mkdir(exist_ok=True)
 for p in (old/'raw').glob('*.png'):
  if not p.name.endswith('.raw.png'):shutil.copy2(p,dest/'old-raw'/p.name)
