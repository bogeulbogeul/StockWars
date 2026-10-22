import bpy,json,sys
import numpy as np
from pathlib import Path
from collections import defaultdict
P=Path(__file__).resolve().parent
sys.path.insert(0,str(P))
from rig_utils import surface_hash
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-joint-polish-v1/somangi-motion-ready.blend'))
original_hash=surface_hash(bpy.data.objects['Somangi_SmoothBody'])
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-sit.blend'))
assert surface_hash(bpy.data.objects['Somangi_SmoothBody'])==original_hash
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-sit.glb'))
body=bpy.data.objects['Somangi_SmoothBody'];rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
assert sum(o.type=='MESH' and o.name.startswith('Somangi_SmoothBody') for o in bpy.context.scene.objects)==1
clips={a.name:a for a in bpy.data.actions}
assert {'Sit_Cycle','Sit_Down','Sit_Idle','Stand_Up','Walk_InPlace'}<=set(clips)
rig.animation_data.action=clips['Sit_Cycle']
start,end=clips['Sit_Cycle'].frame_range
metadata=json.loads((P/'sit-metadata.json').read_text())
lookup=defaultdict(list)
for v in body.data.vertices:lookup[tuple(round(c,6) for c in v.co)].append(v.index)
pairs=np.array([(ids[0],i) for ids in lookup.values() for i in ids[1:]],dtype=np.int32)
max_gap=penetration=seat_depth=0;seat_count=0;worst_phase=0;first=None;worst_details={}
for i in range(281):
    phase=i/280;frame=start+(end-start)*phase
    bpy.context.scene.frame_set(int(frame),subframe=frame-int(frame))
    ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
    coords=np.empty(len(mesh.vertices)*3,dtype=np.float32);mesh.vertices.foreach_get('co',coords);coords=coords.reshape(-1,3)
    assert np.isfinite(coords).all()
    max_gap=max(max_gap,float(np.linalg.norm(coords[pairs[:,0]]-coords[pairs[:,1]],axis=1).max()))
    penetration=max(penetration,metadata['floorZ']-float(coords[:,2].min()))
    seat=metadata['seatSurfaceZ']
    inside=(np.abs(coords[:,0])<.50)&(coords[:,1]>metadata['seatFrontY']+.015)&(coords[:,1]<metadata['seatBackY']-.015)&(coords[:,2]<seat-.003)&(coords[:,2]>seat-.065)
    if inside.any():
        depth=float((seat-coords[inside,2]).max())
        if depth>seat_depth:
            seat_depth=depth;worst_phase=phase
            indices=np.flatnonzero(inside)
            groups={}
            for index in indices:
                for group in body.data.vertices[index].groups:
                    name=body.vertex_groups[group.group].name
                    if group.weight>.5:groups[name]=groups.get(name,0)+1
            worst_details={'groups':groups,'min':coords[inside].min(axis=0).tolist(),'max':coords[inside].max(axis=0).tolist()}
        seat_count=max(seat_count,int(inside.sum()))
    if i==0:first=coords.copy()
    if i==280:loop=float(np.linalg.norm(coords-first,axis=1).max())
    ev.to_mesh_clear()
report={'meshAndUvUnchanged':True,'meshHash':original_hash,'clips':list(clips),
    'samples':281,'maxSeamGap':max_gap,'floorPenetration':penetration,'cycleLoopError':loop,
    'previewSeatPenetration':seat_depth,'maximumVerticesInPreviewSeat':seat_count,'worstSeatPhase':worst_phase,'seatDetails':worst_details}
(P/'validation.json').write_text(json.dumps(report,indent=2))
print('SIT_VALIDATION',report)
assert max_gap<2e-6 and penetration<.004 and loop<1e-5,report
assert seat_count==0,report
