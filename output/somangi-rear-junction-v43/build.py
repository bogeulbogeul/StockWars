"""Fair the rear junction normals without moving or reweighting any vertex."""
import bpy,json,sys,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.kdtree import KDTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from merge_clip import merge_clip
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-local-shoulder-v42/somangi-eat.blend'))
bpy.context.scene.frame_set(136)
b=bpy.data.objects['Somangi_SmoothBody'];m=b.data
coords=np.array([v.co[:] for v in m.vertices]);original=coords.copy()
arms=set(sum(json.loads((P/'arm-vertices.json').read_text()).values(),[]))
normals=np.array([n.vector[:] for n in m.corner_normals]);vertex=np.zeros_like(coords);counts=np.zeros(len(coords))
for loop,n in zip(m.loops,normals):vertex[loop.vertex_index]+=n;counts[loop.vertex_index]+=1
vertex/=np.maximum(counts[:,None],1);vertex/=np.maximum(np.linalg.norm(vertex,axis=1,keepdims=True),1e-9)
valid=[i for i,(x,y,z) in enumerate(coords) if i not in arms and -.33<z<.16 and y>-.05 and abs(x)<.4]
tree=KDTree(len(valid))
for i in valid:tree.insert(Vector(coords[i]),i)
tree.balance()
def ease(t):
 t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)
weights={i:ease((coords[i,1]-.015)/.06)*ease((coords[i,2]+.27)/.05)*ease((.10-coords[i,2])/.06) for i in valid}
smoothed=vertex.copy()
for iteration in range(5):
 updated=smoothed.copy()
 for i in valid:
  if weights[i]==0:continue
  neighbours=tree.find_range(Vector(coords[i]),.06)
  ids=np.array([j for _,j,d in neighbours],dtype=int);ids=ids[vertex[ids]@vertex[i]>.55]
  if len(ids)<3:continue
  delta=coords[ids]-coords[i];w=np.exp(-np.sum(delta*delta,axis=1)/(.032**2))
  n=np.sum(smoothed[ids]*w[:,None],axis=0);n/=max(np.linalg.norm(n),1e-9)
  updated[i]=smoothed[i]*(1-.65*weights[i])+n*(.65*weights[i])
  updated[i]/=max(np.linalg.norm(updated[i]),1e-9)
 smoothed=updated
for j,loop in enumerate(m.loops):
 i=loop.vertex_index
 if weights.get(i,0)>0:normals[j]=smoothed[i]
m.normals_split_custom_set(normals.tolist())
assert np.array_equal(original,np.array([v.co[:] for v in m.vertices]))
(P/'normal-edit.json').write_text(json.dumps(dict(affectedVertices=int(sum(weights[i]>0 for i in valid)),maximumPositionChange=0,weightChanges=0,armChanges=0),indent=2))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','RearJunction_RigidArms')
