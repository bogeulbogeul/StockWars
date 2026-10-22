import bpy,json,sys
import numpy as np
from mathutils import Vector
from pathlib import Path
from collections import defaultdict
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from rig_utils import surface_hash
from bench_scene import load_bench,collision_data
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-sit-v1/somangi-sit.blend'))
source_hash=surface_hash(bpy.data.objects['Somangi_SmoothBody'])
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-bench-down.blend'))
assert surface_hash(bpy.data.objects['Somangi_SmoothBody'])==source_hash
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-bench-down.glb'))
body=bpy.data.objects['Somangi_SmoothBody'];rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
action=next(a for a in bpy.data.actions if a.name=='Bench_Down');rig.animation_data.action=action
start,end=action.frame_range
meta=json.loads((P/'metadata.json').read_text())
bench=collision_data(load_bench(meta))
lookup=defaultdict(list)
for v in body.data.vertices:lookup[tuple(round(c,6) for c in v.co)].append(v.index)
pairs=np.array([(ids[0],i) for ids in lookup.values() for i in ids[1:]],dtype=np.int32)
gap=floor_pen=depth=0;max_count=0;worst_time=0;worst_name=''
for sample in range(361):
    t=sample/360;frame=start+(end-start)*t
    bpy.context.scene.frame_set(int(frame),subframe=frame-int(frame))
    ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
    coords=np.empty(len(mesh.vertices)*3,dtype=np.float32);mesh.vertices.foreach_get('co',coords);coords=coords.reshape(-1,3)
    assert np.isfinite(coords).all()
    gap=max(gap,float(np.linalg.norm(coords[pairs[:,0]]-coords[pairs[:,1]],axis=1).max()))
    floor_pen=max(floor_pen,meta['floorZ']-float(coords[:,2].min()))
    collisions=0
    for name,tree,lo,hi in bench:
        mask=np.all((coords>np.array(lo)+.001)&(coords<np.array(hi)-.001),axis=1)
        for index in np.flatnonzero(mask):
            near,normal,_,dist=tree.find_nearest(coords[index])
            if (Vector(coords[index])-near).dot(normal)<-.002:
                collisions+=1
                if dist>depth:depth=dist;worst_time=t*1.2;worst_name=name
    max_count=max(max_count,collisions)
    ev.to_mesh_clear()
def points_at(a,frame):
    rig.animation_data.action=a
    bpy.context.scene.frame_set(int(frame),subframe=frame-int(frame))
    ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh()
    arr=np.array([tuple(v.co) for v in m.vertices]);ev.to_mesh_clear()
    return arr
initial=points_at(action,start);final=points_at(action,end)
seated=next(a for a in bpy.data.actions if a.name=='Town_Bench_Idle')
seated_error=float(np.linalg.norm(initial-points_at(seated,seated.frame_range[0]),axis=1).max())
rig.animation_data_clear()
from rig_utils import reset
reset(rig);bpy.context.view_layer.update()
ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh()
standing_error=float(np.linalg.norm(final-np.array([tuple(v.co) for v in m.vertices]),axis=1).max())
ev.to_mesh_clear()
report={'meshAndUvUnchanged':True,'meshHash':source_hash,'samples':361,
    'seatedStartError':seated_error,'standingEndError':standing_error,
    'maxSeamGap':gap,'floorPenetration':floor_pen,'benchPenetrationDepth':depth,
    'maximumVerticesInsideBench':max_count,'worstTimeSeconds':worst_time,'worstBenchPart':worst_name,
    'actualTownBench':True,'gameInstalled':False}
(P/'validation.json').write_text(json.dumps(report,indent=2));print('JUMP_SIT_VALIDATION',report)
assert gap<2e-6 and floor_pen<.004 and max_count==0,report
assert seated_error<2e-6 and standing_error<2e-6,report
