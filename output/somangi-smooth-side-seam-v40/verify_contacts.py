import bpy,json,numpy as np,sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P));from motion_utils import points
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));b=bpy.data.objects['Somangi_SmoothBody'];scene=bpy.context.scene;food=bpy.data.objects['bread_Prop'];raw=np.array([v.co[:] for v in b.data.vertices]);mapping={int(k):v for k,v in json.loads((P/'vertex-map.json').read_text()).items()};head={mapping[i] for i in json.loads((P.parent/'somangi-eat-unbent-v35/metadata.json').read_text())['headIds']};arms=json.loads((P/'arm-vertices.json').read_text());distal=set()
for name,ids in arms.items():
 sign=1 if name.endswith('L') else -1;distal.update(i for i in ids if np.linalg.norm(raw[i]-[sign*.245,0,-.045])>.22)
bodygroup=b.vertex_groups['Body'].index;fixed={v.index for v in b.data.vertices if any(g.group==bodygroup and g.weight>.999999 for g in v.groups)}
hf=[list(f.vertices) for f in b.data.polygons if all(i in head for i in f.vertices)];af=[list(f.vertices) for f in b.data.polygons if all(i in distal for i in f.vertices)];bf=[list(f.vertices) for f in b.data.polygons if all(i in fixed for i in f.vertices)];hits=dict(distalArmHead=0,foodHead=0,foodBody=0)
for k in range(271):
 f=1+k*.5;scene.frame_set(int(f),subframe=f-int(f));verts=[Vector(p) for p in points(b)];ht=BVHTree.FromPolygons(verts,hf);at=BVHTree.FromPolygons(verts,af);bt=BVHTree.FromPolygons(verts,bf);hits['distalArmHead']+=bool(ht.overlap(at));hh=False;hb=False
 for ob in food.children_recursive:
  if ob.type!='MESH':continue
  v=[ob.matrix_world@p.co for p in ob.data.vertices]
  if max((p-v[0]).length for p in v)<1e-7:continue
  tree=BVHTree.FromPolygons(v,[list(f.vertices) for f in ob.data.polygons]);hh|=bool(ht.overlap(tree));hb|=bool(bt.overlap(tree))
 hits['foodHead']+=hh;hits['foodBody']+=hb
result=dict(samples=271,collisionSamples=hits);(P/'contacts.json').write_text(json.dumps(result,indent=2));print(result);assert not any(hits.values())
