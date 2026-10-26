import bpy,math,json,sys
from pathlib import Path
P=Path(__file__).resolve().parent
sys.path.insert(0,str(P))
from rig_utils import reset,rotate,translate,key,evaluated_points,surface_hash
from preserve_walk import preserve_walk

SOURCE=P.parent/'somangi-joint-polish-v1/somangi-motion-ready.blend'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
rig=bpy.data.objects['Somangi_OriginalRig']
body=bpy.data.objects['Somangi_SmoothBody']
original_hash=surface_hash(body)
rig.data.pose_position='POSE'
for existing in bpy.data.actions:
    existing.use_fake_user=True
    if existing.name=='Walk_InPlace':
        for layer in existing.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in bag.fcurves:
                        for point in curve.keyframe_points:
                            for co in [point.co,point.handle_left,point.handle_right]:co.x=1+(co.x-1)*30/32
rig.animation_data_clear()
reset(rig)
bpy.context.view_layer.update()
floor=min(p.z for p in evaluated_points(body))
scene=bpy.context.scene;scene.render.fps=30
scene.frame_start=1;scene.frame_end=85
actions=[]

def ease(t):
    t=max(0,min(1,t))
    return t*t*t*(t*(t*6-15)+10)

def pose(progress):
    q=ease(progress)
    reset(rig)
    lean=7*math.sin(math.pi*q)
    rotate(rig,'Root',lean)
    rotate(rig,'Head',-lean*.65)
    for side in ['L','R']:
        rotate(rig,'Leg.'+side,-72*q)
        translate(rig,'Leg.'+side,(0,0,.16*q))
        rotate(rig,'Arm.'+side,-12*q-7*math.sin(math.pi*q))
    translate(rig,'Root',(0,.28*q,-.105*q))
    bpy.context.view_layer.update()
    points=evaluated_points(body)
    low=min(p.z for p in points)
    correction=max(0,floor-low)
    if correction:
        translate(rig,'Root',(0,.28*q,-.105*q+correction))
        bpy.context.view_layer.update()

def action(name,frames,progress):
    a=bpy.data.actions.new(name);a.use_fake_user=True
    rig.animation_data_create();rig.animation_data.action=a
    for frame in range(1,frames+1):
        pose(progress((frame-1)/(frames-1)))
        key(rig,frame)
    actions.append(a)
    return a

down=action('Sit_Down',28,lambda t:t)
idle=action('Sit_Idle',31,lambda t:1)
up=action('Stand_Up',28,lambda t:1-t)
def cycle_progress(t):
    seconds=t*2.8
    if seconds<.9:return seconds/.9
    if seconds<1.9:return 1
    return 1-(seconds-1.9)/.9
cycle=action('Sit_Cycle',85,cycle_progress)

rig.animation_data.action=idle
scene.frame_set(1)
bpy.context.view_layer.update()
points=evaluated_points(body)
part=body.vertex_groups['Part.Root'].index
butt=[v.index for v in body.data.vertices if any(g.group==part for g in v.groups)
    and v.co.y>.02 and v.co.z<-.45 and abs(v.co.x)<.23]
seat_height=min(points[i].z for i in butt if points[i].y>.30)
assert surface_hash(body)==original_hash
metadata={'source':str(SOURCE),'kind':'chair/bench','sameMeshHash':original_hash,
    'meshGeometryUvUnchanged':True,'seatSurfaceZ':seat_height,'floorZ':floor,
    'seatFrontY':.28,'seatBackY':.68,'rootBackwardShift':.28,
    'clips':{'Sit_Down':.9,'Sit_Idle':1,'Stand_Up':.9,'Sit_Cycle':2.8},
    'walkPreserved':True,'walkDurationSeconds':.75,'seatedLegLift':.16,'gameInstalled':False}
(P/'sit-metadata.json').write_text(json.dumps(metadata,indent=2))
rig.animation_data.action=cycle;scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);rig.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-sit.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-sit.glb'),export_format='GLB',use_selection=True,
    export_skins=True,export_animations=True,export_animation_mode='ACTIONS',
    export_cameras=False,export_lights=False)
preserve_walk(P/'somangi-sit.glb',P.parent/'somangi-joint-polish-v1/somangi-walk.glb')
print('SIT_BUILD_COMPLETE',metadata)
