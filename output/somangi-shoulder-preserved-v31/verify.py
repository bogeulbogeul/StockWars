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
for step in range(181):
    f=1+step*.5;scene.frame_set(int(f),subframe=f-int(f));coords=points(body)
    maxstatic=max(maxstatic,float(np.max(np.abs(coords[static]-base[static]))))
    for s,e in edges.items():maxrigid=max(maxrigid,float(np.max(np.abs(np.linalg.norm(coords[e[:,0]]-coords[e[:,1]],axis=1)/lengths[s]-1))))
    fore=BVHTree.FromPolygons([Vector(p) for p in coords],faces);headhits+=bool(head.overlap(fore));bodyhits+=bool(body_tree.overlap(fore))
    food_head=False;food_body=False
    for ob in food.children_recursive:
        if ob.type!='MESH':continue
        vertices=[ob.matrix_world@v.co for v in ob.data.vertices]
        if max((v-vertices[0]).length for v in vertices)<1e-7:continue
        prop=BVHTree.FromPolygons(vertices,[list(p.vertices) for p in ob.data.polygons]);food_head|=bool(head.overlap(prop));food_body|=bool(body_tree.overlap(prop))
    foodhits+=food_head;foodbodyhits+=food_body
    if f<=58:spans.append(float(coords[palms['L'],0].mean()-coords[palms['R'],0].mean()))
node=bpy.data.objects['Food_EqualBiteConsumption'];scene.frame_set(1);initial=np.array(food.scale)*np.array(node.scale);stages=[]
for f in [1,40,52,58,91]:
    scene.frame_set(f);stages.append((np.array(food.scale)*np.array(node.scale)/initial).tolist())
result=dict(samples=181,originalRestSurfaceError=rest,shoulderUpperArmBodyHeadLegDisplacement=maxstatic,forearmRelativeEdgeError=maxrigid,forearmHeadCollisionSamples=headhits,forearmBodyCollisionSamples=bodyhits,foodHeadCollisionSamples=foodhits,foodBodyCollisionSamples=foodbodyhits,holdingHandSpanVariation=max(spans)-min(spans),foodSizeStages=stages)
(P/'verification.json').write_text(json.dumps(result,indent=2));print(result)
