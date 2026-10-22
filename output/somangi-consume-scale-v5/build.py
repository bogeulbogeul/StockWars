import bpy,sys,json,numpy as np
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from merge_clip import merge_clip
sys.path.insert(0,str(P.parent/'somangi-bench-down-v1'))
from rig_utils import surface_hash
SOURCE=P.parent/'somangi-eat-drink-grip-v3'
def ease(t):
    t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)
def ratio(t):
    return 1-sum(.18*ease((t-at)/.10) for at in [1.07,1.47,1.77])
def points(body):
    ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh()
    arr=np.empty(len(m.vertices)*3,dtype=np.float32);m.vertices.foreach_get('co',arr);ev.to_mesh_clear()
    return arr.reshape(-1,3)
# Preserve the proven palm contact and prop orientation from the held bread.
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'somangi-bread.blend'))
old=bpy.data.objects['bread_Prop'];body=bpy.data.objects['Somangi_SmoothBody']
meta=json.loads((SOURCE/'bread-metadata.json').read_text());ids=meta['palmVertexIds']['R']
bpy.context.scene.frame_set(41)
anchor=old.matrix_world.inverted()@Vector(points(body)[ids].mean(0))
base_scale=old.scale.copy();orientations=[]
for frame in range(1,92):
    bpy.context.scene.frame_set(frame);orientations.append(old.rotation_quaternion.copy())
names=['bread_Prop']+[o.name for o in old.children]
# Use the existing relaxed free arm; the character's rest geometry is unchanged.
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'somangi-drink.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_OriginalRig']
original=surface_hash(body)
cup=bpy.data.objects['drink_Prop']
for o in [*cup.children,cup]:bpy.data.objects.remove(o,do_unlink=True)
with bpy.data.libraries.load(str(SOURCE/'somangi-bread.blend'),link=False) as (src,dst):
    dst.objects=names
for o in dst.objects:bpy.context.collection.objects.link(o)
root=bpy.data.objects['bread_Prop'];root.animation_data_clear();root.rotation_mode='QUATERNION'
scene=bpy.context.scene;scene.name='Eat_Bread';scene.frame_start=1;scene.frame_end=91
report=[]
for frame in range(1,92):
    scene.frame_set(frame);t=(frame-1)/30;s=ratio(t)
    palm=Vector(points(body)[ids].mean(0));q=orientations[frame-1];scale=base_scale*s
    local=Vector((anchor.x*scale.x,anchor.y*scale.y,anchor.z*scale.z))
    root.rotation_quaternion=q;root.scale=scale;root.location=palm-q@local
    for path in ['location','rotation_quaternion','scale']:root.keyframe_insert(path,frame=frame)
    report.append({'frame':frame,'relativeScale':s})
assert surface_hash(body)==original
scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT')
for o in [body,rig,root,*root.children]:o.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,
    export_skins=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
    export_cameras=False,export_lights=False,export_morph=True)
merge_clip(P/'somangi-eat.glb','Eat_Bread')
(P/'metadata.json').write_text(json.dumps({'durationSeconds':3,'restMeshAndUvUnchanged':True,'meshHash':original,
    'foodScaleStages':[1,.82,.64,.46],'gripAnchor':list(anchor),'palmVertexIds':ids,'sourceBody':str(SOURCE/'somangi-drink.blend'),
    'singleEatingClip':True,'beverageIncluded':False,'gameInstalled':False,'scaleSamples':report},indent=2))
