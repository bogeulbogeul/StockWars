import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'scene-base.blend'))
info=json.loads((P/'seat.json').read_text());s=bpy.context.scene
mesh=bpy.data.objects['Somangi_Body'];rig=bpy.data.objects['Somangi_Rig'];bench=bpy.data.objects['Bench']
def smooth(a,b,t):
    v=max(0,min(1,(t-a)/(b-a)));return v*v*(3-2*v)
def rot(name,axis,deg):
    p=rig.pose.bones[name];q=p.bone.matrix_local.to_quaternion()
    p.rotation_quaternion=q.inverted()@Quaternion(axis,math.radians(deg))@q
def pose(t):
    for p in rig.pose.bones:
        p.rotation_mode='QUATERNION';p.rotation_quaternion=(1,0,0,0);p.location=(0,0,0)
    amount=smooth(.15,.60,t)
    for side in ['L','R']:rot('Leg.'+side,(1,0,0),-76*amount)
    arm=-9*amount+12*math.sin(math.pi*t)
    rot('Arm.L',(1,0,0),arm);rot('Arm.R',(1,0,0),arm)
    y=-.80+(info['seated_root_world'][1]+.80)*smooth(.30,.85,t)
    peak=.65
    z=peak*smooth(0,.40,t)-(peak-info['seated_root_world'][2])*smooth(.60,1,t)
    rig.pose.bones['Root'].location=rig.data.bones['Root'].matrix_local.to_3x3().inverted()@Vector((0,y,z))
def create(name,n,fn):
    rig.animation_data_create();rig.animation_data.action=None
    a=bpy.data.actions.new(name);rig.animation_data.action=a
    for f in range(1,n+1):
        fn((f-1)/(n-1))
        for p in rig.pose.bones:
            p.keyframe_insert('rotation_quaternion',frame=f,group=p.name)
            p.keyframe_insert('location',frame=f,group=p.name)
    a.use_fake_user=True
    return a
sit=create('Bench_SitDown',25,pose)
idle=create('Bench_Seated',25,lambda t:pose(1))
stand=create('Bench_StandUp',25,lambda t:pose(1-t))
demo=create('Bench_Sit_Demo',73,lambda t:pose(t*3 if t<1/3 else (1 if t<=2/3 else 3-3*t)))
rig.animation_data.action=demo;s.render.fps=24;s.frame_start=1;s.frame_end=72;s.frame_set(25)
cam=s.camera;target=Vector((0,0,.10));cam.location=(3,-5,2.0)
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=4
s.render.resolution_x=640;s.render.resolution_y=600;s.cycles.samples=12
for img in bpy.data.images:
    if img.source=='FILE' or img.packed_file:
        try:img.pack()
        except RuntimeError:pass
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-bench-sit.blend'))
def export(path,include_bench):
    bench.select_set(include_bench)
    bpy.ops.export_scene.gltf(filepath=str(P/path),use_selection=True,export_format='GLB',export_skins=True,
      export_animations=True,export_animation_mode='ACTIONS',export_materials='EXPORT',export_cameras=False,export_lights=False)
export('somangi-sit-character.glb',False)
export('somangi-bench-scene.glb',True)
(P/'frames').mkdir(exist_ok=True)
for f in range(1,73,2):
    s.frame_set(f);s.render.filepath=str(P/'frames'/f'{f:03}.png');bpy.ops.render.render(write_still=True)
print('BENCH_ANIMATION_COMPLETE')
