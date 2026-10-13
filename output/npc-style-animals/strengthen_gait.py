from pathlib import Path
import shutil
root=Path(__file__).parent/'motions-v1'
for species in ['dog','cat']:
 run=root/species/'run'
 for state in ['right_walk','right_carry']:
  (run/'rejected-v1').mkdir(exist_ok=True)
  shutil.copy2(run/'raw'/f'{state}.png',run/'rejected-v1'/f'{state}.png')
  p=run/'prompts'/f'{state}.txt'
  text=p.read_text(encoding='utf-8').replace('Flat uniform cyan key background outside character, including between limbs.','Use the key background specified below.')
  text+='\nCRITICAL ANATOMICAL CORRECTION: Prior output wrongly repeated the SAME NEAR LEG FORWARD in poses 1 and 3. In pose 3 the camera-near thigh is BEHIND the pelvis, extending DOWN-LEFT toward the tail, with its paw BEHIND. The camera-FAR thigh crosses OVER and OCCLUDES the near thigh at the pelvis and extends DOWN-RIGHT toward the nose, with its paw FORWARD. Its visible forward paw connects to the FAR hip, not the near hip. Swap WHICH LEG overlaps at the hip. Near arm in pose3 is forward for walk only. Pose1 NEAR LEG in front; pose3 FAR LEG in front. Render these as two opposite contacts, not duplicated silhouette artwork. Neutral pose2 for walk must stay both feet planted. Four gait phases for carry must alternate the SAME anatomical near leg forward then back.\n'
  p.write_text(text,encoding='utf-8')
