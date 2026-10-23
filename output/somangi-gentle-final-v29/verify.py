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
scene=bpy.context.scene;body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_RigidArms'];food=bpy.data.objects['bread_Prop']
scene.frame_set(91);base=points(body);tree=KDTree(len(base))
for i,p in enumerate(base):tree.insert(p,i)
tree.balance();rest=max(tree.find(p)[2] for p in original)
groups={s:body.vertex_groups['Arm.'+s].index for s in ['L','R']};root=body.vertex_groups['Body'].index
static=[v.index for v in body.data.vertices if any(g.group==root and g.weight>.999 for g in v.groups)]
static_set=set(static)
headfaces=[list(p.vertices) for p in body.data.polygons if all(base[i,2]>-.025 and i in static_set for i in p.vertices)]
head=BVHTree.FromPolygons([Vector(p) for p in base],headfaces)
body_tree=BVHTree.FromPolygons([Vector(p) for p in base],[list(p.vertices) for p in body.data.polygons if all(i in static_set for i in p.vertices)])
forefaces=[];visible_forefaces=[];edges={};lengths={}
for side,group in groups.items():
    ids=set(v.index for v in body.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups))
    anchor=np.array((.285 if side=='L' else -.285,0,-.11))
    distal=set(i for i in ids if np.linalg.norm(base[i]-anchor)>.22)
    forefaces.extend([list(p.vertices) for p in body.data.polygons if all(i in distal for i in p.vertices)])
    visible_forefaces.extend([list(p.vertices) for p in body.data.polygons if all(i in distal and abs(base[i,0])>.4 for i in p.vertices)])
    e=np.array([e.vertices[:] for e in body.data.edges if all(i in ids for i in e.vertices)])
    lens=np.linalg.norm(base[e[:,0]]-base[e[:,1]],axis=1);valid=lens>1e-4;edges[side]=e[valid];lengths[side]=lens[valid]
maxstatic=0.;maxrigid=0.;armhits=0;foodhits=0;torsohits=0;spans=[];palms={}
for side,group in groups.items():
    ids=np.array([v.index for v in body.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups)])
    anchor=np.array((.285 if side=='L' else -.285,0,-.11));distance=np.linalg.norm(base[ids]-anchor,axis=1)
    palms[side]=ids[distance>np.quantile(distance,.93)]
for step in range(181):
    f=1+step*.5;scene.frame_set(int(f),subframe=f-int(f));coords=points(body)
    maxstatic=max(maxstatic,float(np.max(np.abs(coords[static]-base[static]))))
    for s,e in edges.items():maxrigid=max(maxrigid,float(np.max(np.abs(np.linalg.norm(coords[e[:,0]]-coords[e[:,1]],axis=1)/lengths[s]-1))))
    fore=BVHTree.FromPolygons([Vector(p) for p in coords],forefaces)
    armhits+=bool(head.overlap(fore))
    visible=BVHTree.FromPolygons([Vector(p) for p in coords],visible_forefaces)
    torsohits+=bool(body_tree.overlap(visible))
    for ob in food.children_recursive:
        if ob.type!='MESH':continue
        vs=[ob.matrix_world@v.co for v in ob.data.vertices]
        if max((v-vs[0]).length for v in vs)<1e-7:continue
        foodhits+=bool(head.overlap(BVHTree.FromPolygons(vs,[list(p.vertices) for p in ob.data.polygons])))
    if f<=58:spans.append(abs(float(coords[palms['L'],0].mean()-coords[palms['R'],0].mean())))
node=bpy.data.objects['Food_EqualBiteConsumption'];scene.frame_set(1);initial=np.array(food.scale)*np.array(node.scale);stages=[]
for f in [1,40,52,58,91]:
    scene.frame_set(f);stages.append((np.array(food.scale)*np.array(node.scale)/initial).tolist())
result=dict(samples=181,originalRestSurfaceError=rest,staticBodyHeadLegError=maxstatic,maximumArmRelativeEdgeError=maxrigid,armHeadCollisionSamples=armhits,visibleForearmBodyCollisionSamples=torsohits,foodHeadCollisionSamples=foodhits,holdingHandSpanVariation=max(spans)-min(spans),foodStages=stages)
(P/'verification.json').write_text(json.dumps(result,indent=2));print(result)
