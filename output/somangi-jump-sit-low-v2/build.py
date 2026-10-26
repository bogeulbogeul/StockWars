import bpy,math,json,sys
from pathlib import Path
P=Path(__file__).resolve().parent
sys.path.insert(0,str(P))
from rig_utils import reset,rotate,translate,key,evaluated_points,surface_hash
from preserve_walk import preserve_walk
SOURCE=P.parent/'somangi-sit-v1/somangi-sit.blend'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
rig=bpy.data.objects['Somangi_OriginalRig'];body=bpy.data.objects['Somangi_SmoothBody']
original_hash=surface_hash(body)
for a in bpy.data.actions:a.use_fake_user=True
rig.animation_data_clear();reset(rig);bpy.context.view_layer.update()
for a in list(bpy.data.actions):
    if a.name in {'Sit_Down','Sit_Idle','Stand_Up','Sit_Cycle'}:
        bpy.data.actions.remove(a)
floor=min(p.z for p in evaluated_points(body))
fit=json.loads((P.parent/'somangi-town-bench-check-v1/validation.json').read_text())
final_z=-.105+fit['requiredSeatHeightOffsetNative']+.001
scene=bpy.context.scene;scene.render.fps=30;scene.frame_start=1;scene.frame_end=70

def ease(t):
    t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)

def pose(seconds):
    reset(rig)
    if seconds<.20:
        q=ease(seconds/.20)
        y=0;z=-.055*q;lean=6*q
        leg_pitch=-lean;leg_lift=.055*q;arm=20*q
    elif seconds<.75:
        s=(seconds-.20)/.55
        land=ease((s-.72)/.28)
        tuck=ease(s/.48)
        y=.28*ease((s-.12)/.78)
        z=(1-s)*(-.055)+s*(final_z+.025)+1.05*s*(1-s)
        lean=6*(1-s)
        leg_pitch=-(82*tuck-10*land)-lean
        leg_lift=.055+(.19-.055)*tuck-.03*land
        arm=20*(1-ease(s/.35))-35*ease(s/.35)+23*land
    else:
        q=ease((seconds-.75)/.20)
        y=.28;z=final_z+.025*(1-q);lean=0
        leg_pitch=-72;leg_lift=.16;arm=-12
    rotate(rig,'Root',lean);rotate(rig,'Head',-lean*.65)
    for side in ['L','R']:
        rotate(rig,'Leg.'+side,leg_pitch);translate(rig,'Leg.'+side,(0,0,leg_lift))
        rotate(rig,'Arm.'+side,arm)
    translate(rig,'Root',(0,y,z));bpy.context.view_layer.update()
    if seconds<=.20:
        low=min(p.z for p in evaluated_points(body))
        translate(rig,'Root',(0,y,z+max(0,floor-low)))
        bpy.context.view_layer.update()

def make_action(name,duration,sampler):
    a=bpy.data.actions.new(name);a.use_fake_user=True
    rig.animation_data_create();rig.animation_data.action=a
    count=round(duration*30)
    for i in range(count+1):pose(sampler(i/30));key(rig,i+1)
    return a

jump=make_action('Jump_Sit',1.2,lambda t:t)
idle=make_action('Town_Bench_Idle',1,lambda t:1.2)
preview=make_action('Jump_Sit_Preview',2.3,lambda t:max(0,t-.15))
rig.animation_data.action=preview;scene.frame_set(1)
assert surface_hash(body)==original_hash
meta={'source':str(SOURCE),'meshAndUvUnchanged':True,'meshHash':original_hash,
    'floorZ':floor,'seatZ':fit['actualSeatZ'],'benchScale':fit['relativeBenchScale'],
    'benchCenterY':.28+.229*fit['relativeBenchScale'],'seatedRootZ':final_z,
    'clips':{'Jump_Sit':1.2,'Town_Bench_Idle':1,'Jump_Sit_Preview':2.3},
    'launchSeconds':.20,'flightEndSeconds':.75,'settleEndSeconds':.95,'jumpArcCoefficient':1.05,'gameInstalled':False}
(P/'metadata.json').write_text(json.dumps(meta,indent=2))
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);rig.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-jump-sit.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-jump-sit.glb'),export_format='GLB',use_selection=True,
    export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
preserve_walk(P/'somangi-jump-sit.glb',P.parent/'somangi-joint-polish-v1/somangi-walk.glb')
print('JUMP_SIT_BUILD',meta)
