import bpy,numpy as np,json,sys,math
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P));from motion_utils import points;from merge_clip import merge_clip
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));b=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_WholeArmRig'];scene=bpy.context.scene
raw=np.array([v.co[:] for v in b.data.vertices]);arms=set(sum(json.loads((P/'arm-vertices.json').read_text()).values(),[]));scene.frame_set(50);posed=points(b);delta=np.zeros_like(raw);terms=[(a,c) for a in range(4) for c in range(4-a)]
for sign in [-1,1]:
 ix=np.array([i for i,p in enumerate(raw) if i not in arms and .15<p[0]*sign and abs(p[1]-.015)<.17 and -.27<p[2]<-.04])
 y=raw[ix,1]/.17;z=(raw[ix,2]+.15)/.15;A=np.column_stack([y**a*z**c for a,c in terms]);coef=np.linalg.lstsq(A,posed[ix],rcond=1e-6)[0];target=A@coef
 for j,i in enumerate(ix):
  x,y,z=raw[i];fade=lambda t:np.clip(t,0,1)**2*(3-2*np.clip(t,0,1))
  weight=fade((z+.26)/.06)*fade((-.045-z)/.035)*fade((.165-abs(y-.015))/.07)*fade((abs(x)-.15)/.035)
  shift=np.clip(target[j]-posed[i],-.012,.012)*weight
  M=np.zeros((4,4))
  for g in b.data.vertices[i].groups:
   name=b.vertex_groups[g.group].name
   if name in rig.pose.bones:M+=g.weight*np.array(rig.pose.bones[name].matrix@rig.data.bones[name].matrix_local.inverted())
  delta[i]=np.linalg.inv(M[:3,:3])@shift
b.shape_key_add(name='Basis');key=b.shape_key_add(name='ShoulderSurfaceOnly');key.data.foreach_set('co',(raw+delta).astype(np.float32).ravel())
for f in range(1,137):
 t=(f-1)/30;u=np.clip((t-3.3)/.975,0,1);holding=1-u*u*u*(u*(u*6-15)+10);bite=max(math.exp(-((t-c)/.18)**2) for c in [1.635,2.235,2.685]);key.value=float(holding*(.7+.3*bite));key.keyframe_insert('value',frame=f)
for layer in b.data.shape_keys.animation_data.action.layers:
 for strip in layer.strips:
  for bag in strip.channelbags:
   for curve in bag.fcurves:
    for k in curve.keyframe_points:k.interpolation='LINEAR'
scene.frame_set(136);(P/'corrective.json').write_text(json.dumps(dict(affectedVertices=int(np.count_nonzero(np.max(np.abs(delta),axis=1)>1e-8)),maxLocalShift=float(np.max(np.abs(delta))),armCorrectionMax=float(np.max(np.abs(delta[list(arms)])))),indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True);merge_clip(P/'somangi-eat.glb','SmoothBodyShoulder_RigidArms')
