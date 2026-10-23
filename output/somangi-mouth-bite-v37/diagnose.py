import bpy,json,sys,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-soft-connections-v36/somangi-eat.blend'))
old=bpy.data.objects['Somangi_SmoothBody'];source=np.array([v.co[:] for v in old.data.vertices]);topology=[tuple(f.vertices) for f in old.data.polygons]
source_arms=set()
for name in ['Arm.L','Arm.R']:
    index=old.vertex_groups[name].index
    source_arms.update(v.index for v in old.data.vertices if v.co.z<-.155 and any(g.group==index and g.weight>.999 for g in v.groups))
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));s=bpy.context.scene;body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_WholeArmRig'];food=bpy.data.objects['bread_Prop']
raw=np.array([v.co[:] for v in body.data.vertices]);groups={}
for name in ['Body','Arm.L','Arm.R','Head']:
    group=body.vertex_groups[name].index;groups[name]=set(v.index for v in body.data.vertices if any(g.group==group and g.weight>1-1e-7 for g in v.groups))
edges={};lengths={}
for name in ['Arm.L','Arm.R','Head']:
    a=np.array([e.vertices[:] for e in body.data.edges if all(i in groups[name] for i in e.vertices)]);d=np.linalg.norm(raw[a[:,0]]-raw[a[:,1]],axis=1);valid=d>.001;edges[name]=a[valid];lengths[name]=d[valid]
headfaces=[list(f.vertices) for f in body.data.polygons if all(i in groups['Head'] for i in f.vertices)]
bodyfaces=[list(f.vertices) for f in body.data.polygons if all(i in groups['Body'] for i in f.vertices)]
armfaces=[]
for name,sign in [('Arm.L',1),('Arm.R',-1)]:
    distal={i for i in groups[name] if np.linalg.norm(raw[i]-[sign*.245,0,-.045])>.22}
    armfaces.extend([list(f.vertices) for f in body.data.polygons if all(i in distal for i in f.vertices)])
fixed=list(groups['Body']);static_max=0.;rigidity={name:0. for name in edges};arm_head=0;food_head=0;food_body=0

for f in [35,42,45,49,50,55,65,68,70,80,82,85,90]:
 s.frame_set(f);coords=points(body);verts=[Vector(p) for p in coords];head=BVHTree.FromPolygons(verts,headfaces);arms=BVHTree.FromPolygons(verts,armfaces);hits=head.overlap(arms)
 print('FRAME',f,'HITS',len(hits))
 for a,b in hits[::max(1,len(hits)//3)]:print('CONTACT',np.mean(coords[headfaces[a]],axis=0).tolist(),np.mean(coords[armfaces[b]],axis=0).tolist())
