import bpy,numpy as np,json,sys,math
from pathlib import Path
from mathutils import Vector,Matrix
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from merge_clip import merge_clip
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-rigid-whole-arms-v38/somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];scene=bpy.context.scene;rig=bpy.data.objects['Somangi_WholeArmRig'];scene.frame_set(136)
mesh=body.data;raw=np.array([v.co[:] for v in mesh.vertices]);normals=[n.vector.copy() for n in mesh.corner_normals]
incident=[set() for v in mesh.vertices];neighbors=[set() for v in mesh.vertices]
for f in mesh.polygons:
 for i in f.vertices:incident[i].add(f.material_index)
for e in mesh.edges:
 a,b=e.vertices;neighbors[a].add(b);neighbors[b].add(a)
arm_ids=json.loads((P.parent/'somangi-rigid-whole-arms-v38/arm-vertices.json').read_text());changed=[]
import heapq
meta=json.loads((P.parent/'somangi-whole-root-base-v35/metadata.json').read_text())
for name,ids in arm_ids.items():
 selected=set(ids);interior={i for i in ids if incident[i]=={2}};boundary=selected-interior
 distance={i:0. for i in boundary};queue=[(0.,i) for i in boundary];heapq.heapify(queue)
 while queue:
  d,i=heapq.heappop(queue)
  if d>distance[i]+1e-8:continue
  for j in neighbors[i]&selected:
   nd=d+float(np.linalg.norm(raw[j]-raw[i]))
   if nd<distance.get(j,1e10):distance[j]=nd;heapq.heappush(queue,(nd,j))
 key='1' if name.endswith('L') else '2';axis=Vector(meta['palms'][key])-Vector(meta['centers'][key]);axis.normalize()
 for i in interior:
  z=raw[i,2];height=np.clip((z+.29)/.12,0,1);d=distance.get(i,0.)
  amount=.09*math.sqrt(min(d/.065,1))*height
  if amount>0:mesh.vertices[i].co-=axis*amount;changed.append(i)
# Recess only the concealed upper torso socket: the old broad flat cap protruded beyond the arm.
head=set(json.loads((P.parent/'somangi-eat-unbent-v35/metadata.json').read_text())['headIds']);armset=set(sum(arm_ids.values(),[]));body_changed=[]
for v in mesh.vertices:
 if v.index in head or v.index in armset:continue
 x,y,z=v.co
 if z<=-.20 or abs(x)<=.16 or abs(y-.015)>=.15:continue
 fade=np.clip((z+.20)/.09,0,1);fade=fade*fade*(3-2*fade)
 rx=np.interp(z,[-.20,-.12,-.04,0],[.275,.25,.225,.22]);ry=np.interp(z,[-.20,0],[.205,.17])
 target=rx*math.sqrt(max(.05,1-((y-.015)/ry)**2))
 if abs(x)>target:
  v.co.x=math.copysign(abs(x)+(target-abs(x))*fade,x);body_changed.append(v.index)
mesh.update()
# Smooth normals across the repaired torso surface, retaining all remote original normals.
normal_ids=set(changed+body_changed)
for _ in range(3):normal_ids.update(j for i in list(normal_ids) for j in neighbors[i])
for f in mesh.polygons:
 for j in f.loop_indices:
  if mesh.loops[j].vertex_index in normal_ids:normals[j]=mesh.vertices[mesh.loops[j].vertex_index].normal.copy()
# Fit a smooth normal field on the hidden torso closure; no additional surface movement.
body_caps={i for f in mesh.polygons if f.material_index==2 and not any(j in armset for j in f.vertices) for i in f.vertices}
terms=[(a,b) for a in range(5) for b in range(5-a)]
for sign in [-1,1]:
 ids=[i for i in body_caps if mesh.vertices[i].co.x*sign>0 and mesh.vertices[i].co.z>-.28]
 xyz=np.array([mesh.vertices[i].co[:] for i in ids]);y=xyz[:,1]/.12;z=xyz[:,2]/.25
 A=np.column_stack([y**a*z**b for a,b in terms]);coef=np.linalg.lstsq(A,np.abs(xyz[:,0]),rcond=1e-6)[0]
 for f in mesh.polygons:
  if f.material_index!=2 or any(i in armset for i in f.vertices):continue
  for j in f.loop_indices:
   v=mesh.vertices[mesh.loops[j].vertex_index];x,y,z=v.co
   if x*sign<=0 or z<=-.26:continue
   Y=y/.12;Z=z/.25
   dy=sum(c*a*Y**(a-1)*Z**b/.12 for c,(a,b) in zip(coef,terms) if a)
   dz=sum(c*b*Y**a*Z**(b-1)/.25 for c,(a,b) in zip(coef,terms) if b)
   n=Vector((sign,-dy,-dz)).normalized();fade=np.clip((z+.26)/.05,0,1)
   normals[j]=normals[j].lerp(n,float(fade)).normalized()
mesh.normals_split_custom_set(normals)
# Rotate the whole arm around its fixed palm to tuck its root under the head.
# The hand/food position stays identical; the original arm surface remains rigid.
for f in range(1,137):
 scene.frame_set(f);t=(f-1)/30;u=np.clip((t-3.3)/.975,0,1);fade=1-u*u*u*(u*(u*6-15)+10)
 bite=max(math.exp(-((t-c)/.18)**2) for c in [1.635,2.235,2.685])
 for name in arm_ids:
  key='1' if name.endswith('L') else '2';pb=rig.pose.bones[name];transform=pb.matrix@pb.bone.matrix_local.inverted();palm=transform@Vector(meta['palms'][key])
  correction=Matrix.Translation(palm)@Matrix.Rotation(math.radians(2+8*bite)*fade,4,'X')@Matrix.Translation(-palm)
  m=correction@pb.matrix;m.translation.x+=(-1 if name.endswith("L") else 1)*.045*fade;pb.matrix=m
  pb.keyframe_insert('location',frame=f);pb.keyframe_insert('rotation_quaternion',frame=f)
scene.frame_set(136)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','RigidArms_HiddenShoulder');(P/'arm-vertices.json').write_text(json.dumps(arm_ids));(P/'changes.json').write_text(json.dumps(dict(hiddenCapVertices=changed,armOriginalPositionsUnchanged=True,torsoSocketVertices=body_changed)))

