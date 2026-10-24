import bpy,json,numpy as np,sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P));from motion_utils import points
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));b=bpy.data.objects['Somangi_SmoothBody'];scene=bpy.context.scene;food=bpy.data.objects['bread_Prop'];raw=np.array([v.co[:] for v in b.data.vertices]);head=set(json.loads((P/'head-indices.json').read_text()));arms=json.loads((P/'arm-vertices.json').read_text());distal=set()
for name,ids in arms.items():
 sign=1 if name.endswith('L') else -1;distal.update(i for i in ids if np.linalg.norm(raw[i]-[sign*.245,0,-.045])>.22)
bodygroup=b.vertex_groups['Body'].index;fixed={v.index for v in b.data.vertices if any(g.group==bodygroup and g.weight>.999999 for g in v.groups)}
def subset(ids):
 ids=sorted(ids);index={i:j for j,i in enumerate(ids)};faces=[[index[i] for i in f.vertices] for f in b.data.polygons if all(i in index for i in f.vertices)];return ids,faces
hi,hf=subset(head);ai,af=subset(distal);bi,bf=subset(fixed);bodytree=BVHTree.FromPolygons([Vector(p) for p in raw[bi]],bf);minimum=raw[bi].min(0);maximum=raw[bi].max(0);hits=dict(distalArmHead=0,foodHead=0,foodBody=0)
for k in range(271):
 f=1+k*.5;scene.frame_set(int(f),subframe=f-int(f));coords=points(b);ht=BVHTree.FromPolygons([Vector(p) for p in coords[hi]],hf);at=BVHTree.FromPolygons([Vector(p) for p in coords[ai]],af);hits['distalArmHead']+=bool(ht.overlap(at));hh=False;hb=False
 for ob in food.children_recursive:
  if ob.type!='MESH':continue
  v=[ob.matrix_world@p.co for p in ob.data.vertices]
  if max((p-v[0]).length for p in v)<1e-7:continue
  tree=BVHTree.FromPolygons(v,[list(f.vertices) for f in ob.data.polygons]);hh|=bool(ht.overlap(tree));a=np.array(v)
  if np.all(a.max(0)>=minimum) and np.all(a.min(0)<=maximum):hb|=bool(bodytree.overlap(tree))
 hits['foodHead']+=hh;hits['foodBody']+=hb
result=dict(samples=271,collisionSamples=hits);(P/'contacts.json').write_text(json.dumps(result,indent=2));print(result);assert not any(hits.values())
