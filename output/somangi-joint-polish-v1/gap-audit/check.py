import bpy,json,hashlib
import numpy as np
from pathlib import Path
from collections import defaultdict
P=Path(__file__).resolve().parent
source=P.parent/'somangi-walk.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
body=bpy.data.objects['Somangi_SmoothBody']
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
action=rig.animation_data.action
start,end=action.frame_range
lookup=defaultdict(list)
rest=np.empty(len(body.data.vertices)*3,dtype=np.float32)
body.data.vertices.foreach_get('co',rest)
rest=rest.reshape(-1,3)
for i,p in enumerate(rest):lookup[tuple(round(float(v),6) for v in p)].append(i)
pairs=[]
for ids in lookup.values():
    for index in ids[1:]:
        if np.linalg.norm(rest[index]-rest[ids[0]])<3e-7:pairs.append((ids[0],index))
pairs=np.array(pairs,dtype=np.int32)
assert len(pairs)>2000
mid=(rest[pairs[:,0]]+rest[pairs[:,1]])/2
zones={'neck':mid[:,2]>-.08,
       'left_shoulder':(mid[:,2]<=-.08)&(mid[:,2]>-.50)&(mid[:,0]>0),
       'right_shoulder':(mid[:,2]<=-.08)&(mid[:,2]>-.50)&(mid[:,0]<0),
       'left_hip':(mid[:,2]<=-.50)&(mid[:,0]>0),
       'right_hip':(mid[:,2]<=-.50)&(mid[:,0]<0)}
maxima={name:{'maximumGap':0,'phase':0,'restPosition':None} for name in zones}
global_gap=0;first=None;loop=0
for sample in range(601):
    phase=sample/600
    frame=start+(end-start)*phase
    bpy.context.scene.frame_set(int(frame),subframe=frame-int(frame))
    ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh=ev.to_mesh()
    coords=np.empty(len(mesh.vertices)*3,dtype=np.float32)
    mesh.vertices.foreach_get('co',coords)
    coords=coords.reshape(-1,3)
    assert np.isfinite(coords).all()
    distances=np.linalg.norm(coords[pairs[:,0]]-coords[pairs[:,1]],axis=1)
    global_gap=max(global_gap,float(distances.max()))
    for name,mask in zones.items():
        eligible=np.flatnonzero(mask)
        if not len(eligible):continue
        i=eligible[np.argmax(distances[eligible])]
        if distances[i]>maxima[name]['maximumGap']:
            maxima[name]={'maximumGap':float(distances[i]),'phase':phase,'restPosition':mid[i].tolist()}
    if sample==0:first=coords.copy()
    if sample==600:loop=float(np.linalg.norm(coords-first,axis=1).max())
    ev.to_mesh_clear()
report={'source':str(source),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
    'sourceUnchanged':True,'samples':601,'exportedGlb':True,'duplicatePositionPairs':len(pairs),
    'maximumGap':global_gap,'gapRelativeToHeight':global_gap/float(np.ptp(rest[:,2])),
    'loopError':loop,'zones':maxima,'thresholdModelUnits':2e-6,
    'passesBoundaryContinuity':global_gap<2e-6}
(P/'report.json').write_text(json.dumps(report,indent=2))
print('GAP_AUDIT',json.dumps(report))
