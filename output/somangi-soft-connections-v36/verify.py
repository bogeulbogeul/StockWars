import bpy,json,sys,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-unbent-v35/somangi-eat.blend'))
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
for k in range(181):
    f=1+k*.5;s.frame_set(int(f),subframe=f-int(f));coords=points(body)
    static_max=max(static_max,float(np.max(np.abs(coords[fixed]-raw[fixed]))))
    for name,a in edges.items():rigidity[name]=max(rigidity[name],float(np.max(np.abs(np.linalg.norm(coords[a[:,0]]-coords[a[:,1]],axis=1)/lengths[name]-1))))
    verts=[Vector(p) for p in coords];head=BVHTree.FromPolygons(verts,headfaces);torso=BVHTree.FromPolygons(verts,bodyfaces);arms=BVHTree.FromPolygons(verts,armfaces)
    arm_head+=bool(head.overlap(arms));hithead=False;hitbody=False
    for ob in food.children_recursive:
        if ob.type!='MESH':continue
        v=[ob.matrix_world@p.co for p in ob.data.vertices]
        if max((p-v[0]).length for p in v)<1e-7:continue
        prop=BVHTree.FromPolygons(v,[list(f.vertices) for f in ob.data.polygons]);hithead|=bool(head.overlap(prop));hitbody|=bool(torso.overlap(prop))
    food_head+=hithead;food_body+=hitbody
s.frame_set(91);end=points(body)
result=dict(samples=181,bodyGeometryMaxDifference=float(np.max(np.abs(raw-source))),topologyUnchanged=topology==[tuple(f.vertices) for f in body.data.polygons],bones=[b.name for b in rig.data.bones],armBodiesRigidOutsideConnections=all(len(v.groups)==1 and abs(v.groups[0].weight-1)<1e-7 for v in body.data.vertices if v.index in source_arms),weightSumError=max(abs(sum(g.weight for g in v.groups)-1) for v in body.data.vertices),fixedBodyDisplacement=static_max,relativeEdgeLengthError=rigidity,distalArmHeadCollisionSamples=arm_head,foodHeadCollisionSamples=food_head,foodBodyCollisionSamples=food_body,endRestMaxDifference=float(np.max(np.abs(end-source))))
(P/'verification.json').write_text(json.dumps(result,indent=2));print(result)
assert result['bodyGeometryMaxDifference']==0 and result['topologyUnchanged'] and result['armBodiesRigidOutsideConnections']
assert arm_head==0 and food_head==0 and food_body==0
