import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'blank-buddy-walk-v2/somangi-walk.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];mesh=bpy.data.objects['Somangi_Body']
rig.animation_data_clear()
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
groups={g.name:g for g in mesh.vertex_groups};names={g.index:g.name for g in mesh.vertex_groups}
# Rigid short legs below the small hip blend; keep the torso stable.
for v in mesh.data.vertices:
    if v.co.z>=-.63:continue
    strength=1-smooth(-.71,-.63,v.co.z)
    weights={names[g.group]:g.weight*(1-strength) for g in v.groups}
    leg='Leg.L' if v.co.x>0 else 'Leg.R';weights[leg]=weights.get(leg,0)+strength
    for g in mesh.vertex_groups:g.remove([v.index])
    for n,w in weights.items():
        if w>1e-8:groups[n].add([v.index],w,'REPLACE')
sole={side:[v.index for v in mesh.data.vertices if v.co.z<-.88 and (v.co.x>0 if side=='L' else v.co.x<0)] for side in ['L','R']}
ground=min(v.co.z for v in mesh.data.vertices)
def rotate(name,q):
    p=rig.pose.bones[name];basis=p.bone.matrix_local.to_quaternion()
    p.rotation_quaternion=basis.inverted()@q@basis
def set_leg(side,pitch,spread=0):
    q=Quaternion((1,0,0),math.radians(pitch))@Quaternion((0,1,0),math.radians(spread*(-1 if side=='L' else 1)))
    rotate('Leg.'+side,q)
def minimum(side):
    bpy.context.view_layer.update()
    bone=rig.pose.bones['Leg.'+side]
    transform=bone.matrix@bone.bone.matrix_local.inverted()
    return min((transform@mesh.data.vertices[i].co).z for i in sole[side])
rig.animation_data_create();action=bpy.data.actions.new('Walk_InPlace');rig.animation_data.action=action
rows=[]
for f in range(1,26):
    t=(f-1)/24
    for p in rig.pose.bones:
        p.rotation_mode='QUATERNION';p.rotation_quaternion=(1,0,0,0);p.location=(0,0,0);p.scale=(1,1,1)
    phases={'L':t%1,'R':(t+.5)%1}
    pitches={};spreads={}
    for side,phase in phases.items():
        if phase<.5:pitch=-6+24*phase
        else:
            u=(phase-.5)*2;pitch=6-12*(u*u*(3-2*u))
        pitches[side]=pitch;set_leg(side,pitch)
    # Rounded feet naturally rock along the sole during a small hip swing.
    # Ground the lower sole; no foot/leg translation or wide lateral splay.
    sole_heights={side:minimum(side) for side in phases}
    support=min(sole_heights,key=sole_heights.get)
    support_min=sole_heights[support]
    spreads={side:0 for side in phases}
    # Only the whole character moves to maintain sole contact; legs never translate.
    rig.pose.bones['Root'].location=rig.data.bones['Root'].matrix_local.to_3x3().inverted()@Vector((0,0,ground-support_min))
    rotate('Arm.L',Quaternion((1,0,0),math.radians(5*math.cos(t*math.tau))))
    rotate('Arm.R',Quaternion((1,0,0),math.radians(-5*math.cos(t*math.tau))))
    for p in rig.pose.bones:
        p.keyframe_insert('location',frame=f,group=p.name)
        p.keyframe_insert('rotation_quaternion',frame=f,group=p.name)
    rows.append({'frame':f,'support':support,'pitch':pitches,'spread':spreads,'root_world_z':ground-support_min})
s.frame_start=1;s.frame_end=24;s.render.fps=24;s.frame_set(1)
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-walk.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-walk.glb'),use_selection=True,export_format='GLB',export_skins=True,
 export_animations=True,export_animation_mode='ACTIONS',export_materials='EXPORT',export_cameras=False,export_lights=False)
(P/'motion.json').write_text(json.dumps(rows,indent=2))
s.cycles.samples=12;s.render.resolution_x=480;s.render.resolution_y=480;cam=s.camera
for name,pos in [('front',(0,-6,0)),('side',(6,0,0))]:
    folder=P/(name+'-frames');folder.mkdir(exist_ok=True)
    cam.location=pos;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
    for f in range(1,25):
        s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
print('ROTATION_WALK_COMPLETE')
