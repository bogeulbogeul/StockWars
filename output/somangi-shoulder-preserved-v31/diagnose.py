import bpy,numpy as np,json,sys
from pathlib import Path
from mathutils import Vector
from mathutils.kdtree import KDTree
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-black-eyes-v1/somangi-black-eyes.blend'))
original=np.array([v.co[:] for v in bpy.data.objects['Somangi_SmoothBody'].data.vertices])
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
scene=bpy.context.scene;body=bpy.data.objects['Somangi_SmoothBody'];food=bpy.data.objects['bread_Prop']
scene.frame_set(91);base=points(body);tree=KDTree(len(base))
for i,p in enumerate(base):tree.insert(p,i)
tree.balance();rest=max(tree.find(p)[2] for p in original)
root=body.vertex_groups['Body'].index;static=set(v.index for v in body.data.vertices if any(g.group==root and g.weight>.999 for g in v.groups))
body_tree=BVHTree.FromPolygons([Vector(p) for p in base],[list(p.vertices) for p in body.data.polygons if all(i in static for i in p.vertices)])
head=BVHTree.FromPolygons([Vector(p) for p in base],[list(p.vertices) for p in body.data.polygons if all(i in static and base[i,2]>-.025 for i in p.vertices)])
faces=[];edges={};lengths={};palms={}
for side,sign in [('L',1),('R',-1)]:
    group=body.vertex_groups['Fore.'+side].index;ids=np.array([v.index for v in body.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups)])
    distance=np.linalg.norm(base[ids]-[sign*.42,0,-.29],axis=1);distal=set(ids[distance>.15].tolist());selected=set(ids.tolist())
    faces.extend([list(p.vertices) for p in body.data.polygons if all(i in distal for i in p.vertices)])
    e=np.array([e.vertices[:] for e in body.data.edges if all(i in selected for i in e.vertices)]);lens=np.linalg.norm(base[e[:,0]]-base[e[:,1]],axis=1);valid=lens>1e-4
    edges[side]=e[valid];lengths[side]=lens[valid];palms[side]=ids[distance>np.quantile(distance,.93)]
maxstatic=0.;maxrigid=0.;headhits=0;bodyhits=0;foodhits=0;foodbodyhits=0;spans=[];static=list(static)

scene.frame_set(1);coords=points(body)
fore=BVHTree.FromPolygons([Vector(p) for p in coords],faces)
staticfaces=[list(p.vertices) for p in body.data.polygons if all(i in static for i in p.vertices)]
hits=body_tree.overlap(fore)
print('FORECONTACT',len(hits))
for a,b in hits[::max(1,len(hits)//6)]:print('PAIR',np.mean(base[staticfaces[a]],0),np.mean(coords[faces[b]],0))
for ob in food.children_recursive:
 if ob.type!='MESH':continue
 vertices=[ob.matrix_world@v.co for v in ob.data.vertices];prop=BVHTree.FromPolygons(vertices,[list(p.vertices) for p in ob.data.polygons]);hits=body_tree.overlap(prop)
 print('FOODCONTACT',ob.name,len(hits))
 for a,b in hits[::max(1,len(hits)//5)]:print('PAIR',np.mean(base[staticfaces[a]],0),np.mean([vertices[i][:] for i in ob.data.polygons[b].vertices],0))
