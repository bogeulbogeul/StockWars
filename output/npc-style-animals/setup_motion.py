import json
from pathlib import Path
root=Path(__file__).parent
common='Match the supplied NPC-style animal base exactly: clean dark outlines, restrained cel shading, detailed chibi biped anatomy, same head/body proportions. No clothes shoes props halos haze or shadows. One anatomically attached tail in every pose. No grids or text. Flat uniform cyan key background outside character, including between limbs. Keep ample gaps between poses, identical scale and head size across row.'
actions={
 'down_idle':(1,'Straight FRONT neutral standing, both soles planted, relaxed arms.'),
 'down_walk':(3,'Straight FRONT view fixed throughout. Exactly THREE poses: A character own left foot steps forward and right arm forward; neutral both feet planted; B own right foot steps forward and left arm forward. Opposite feet alternate, no duplicate A/B.'),
 'right_idle':(1,'Facing RIGHT neutral standing, mild three-quarter view consistent with base, both soles planted.'),
 'right_walk':(3,'Facing RIGHT throughout. Exactly THREE poses: A foreground near leg forward and far leg back, near arm back and far arm forward; neutral both feet planted under hips; B foreground near leg BACK and far leg forward, near arm forward and far arm back. Keep limb identity and overlap, do not repeat A in B. Low gentle steps, no kicks.'),
 'up_idle':(1,'Straight BACK neutral standing. Rear of head and body, no face or chest patch. Feet are rounded HEELS, toes point away, no front toe crease lines. Tail connected to rear pelvis.'),
 'up_walk':(3,'Straight BACK view throughout: own left foot contact, neutral both feet planted, own right foot contact. Arms counter-swing. Feet show rear heels and ankles, toes point AWAY, no front-facing toes. Tail emerges from pelvis not thigh.'),
 'right_carry':(4,'Facing RIGHT throughout, FOUR alternating gait poses: near leg forward contact, near leg vertical support far knee passing, far leg forward contact near leg BACK, far leg vertical support near knee passing. Both forearms extend forward with palms UP beneath a separate parcel stack, hands at constant waist height and position, stable torso. NO box drawn. Tail behind rump, never replaces an arm.'),
 'down_sit':(1,'ONE held CHAIR seated pose straight FRONT: upright torso, pelvis raised at seat height, thighs forward, knees bent90degrees and lower legs down, paws on thighs. Chair is separate: NO chair drawn. Not floor sitting or animal haunch crouching. Tail moved sideways behind hips.'),
 'right_sit':(1,'ONE held CHAIR seated pose, elevated isometric FRONT-RIGHT THREE-QUARTER view, BOTH eyes visible, NOT pure profile. Thighs project forward along room diagonal, knees bent90degrees lower legs down, upright torso, pelvis elevated for chair seat. Paws on thighs. NO chair. Tail bends aside behind hips, no floor sitting.')
}
for name,base,identity in [('dog','village-mutt','Wheat-tan Korean countryside MIXED-BREED dog, small semi-folded triangular ears, cream muzzle chest paw tips as base, brown eyes, one loosely upward curled furry tan tail. Not retriever.'),('cat','black-cat','Charcoal BLACK CAT, amber eyes, upright triangular ears pink inside, ALL limbs paws muzzle chest same black fur, one long curved black tail. No cream or brown limb patches.')]:
 request={'cell':{'width':320,'height':400,'safe_margin':28},'style':common+' '+identity,'fit':{'resample':'lanczos','align_x':'bbox-center','align_y':'bottom','ground_frames':True,'pixel_unfake':False},'chroma_key':'cyan','states':{k:{'frames':n,'fps':6 if n>1 else 1,'loop':n>1,'action':a+' '+identity} for k,(n,a) in actions.items()}}
 out=root/'motions-v1'/name
 out.mkdir(parents=True,exist_ok=True)
 (out/'request.json').write_text(json.dumps(request,indent=2),encoding='utf-8')
