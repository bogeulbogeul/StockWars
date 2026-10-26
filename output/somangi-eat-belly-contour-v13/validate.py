import bpy,numpy as np,json
from pathlib import Path
from collections import Counter
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-drink-grip-v3/somangi-bread.blend'))
o=bpy.data.objects['Somangi_SmoothBody'];base=np.array([tuple(v.co) for v in o.data.vertices])
groups={o.vertex_groups[s].index for s in ['Part.Head','Part.Arm.L','Part.Arm.R']}
ids=[v.index for v in o.data.vertices if any(g.group in groups for g in v.groups)]
r=o.vertex_groups['Part.Root'].index;root=[v.index for v in o.data.vertices if any(g.group==r for g in v.groups)]
reference_bounds=np.stack([base[root].min(0),base[root].max(0)])
reference=[]
for frame in range(1,92,6):
 bpy.context.scene.frame_set(frame);ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh()
 reference.append(np.array([tuple(v.co) for v in m.vertices])[ids]);ev.to_mesh_clear()
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
o=bpy.data.objects['Somangi_SmoothBody'];report=json.loads((P/'validation.json').read_text());start=report['torso']['torsoVertexStart']
current=np.array([tuple(v.co) for v in o.data.vertices]);body=current[start:];visible=body[body[:,2]>-.60]
width_error=abs(np.ptp(visible[:,0])-np.ptp(reference_bounds[:,0]));depth_error=abs(np.ptp(visible[:,1])-np.ptp(reference_bounds[:,1]))
error=0;static=0
for key,ref in zip(list(o.data.shape_keys.key_blocks)[1:],reference):
 a=np.empty(len(current)*3,dtype=np.float32);key.data.foreach_get('co',a);a=a.reshape(-1,3)
 error=max(error,float(np.max(np.abs(a[ids]-ref))));static=max(static,float(np.max(np.abs(a[start:]-body))))
edges=Counter(tuple(sorted((a,b))) for f in o.data.polygons if f.material_index==2 for a,b in zip(list(f.vertices),list(f.vertices)[1:]+[f.vertices[0]]))
open_edges=sum(c!=2 for c in edges.values())
assert error<1e-6 and static==0 and width_error<1e-5 and depth_error<1e-5
assert open_edges==0,open_edges
report.pop('maximumCorrectionFromPreviousMotion',None)
report.update({'headArmMotionDifference':error,'staticTorsoMotionDifference':static,
 'originalTorsoWidthDifference':float(width_error),'originalTorsoDepthDifference':float(depth_error),
 'torsoNonManifoldEdges':open_edges,'retopologizedBodyAndLegConnection':True,'bodyGeometryIdenticalToOriginal':False})
(P/'validation.json').write_text(json.dumps(report,indent=2));print({k:v for k,v in report.items() if k!='torso'})
