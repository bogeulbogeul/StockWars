import bpy,sys,json
import numpy as np
from pathlib import Path
from collections import defaultdict
P=Path(__file__).resolve().parent
sys.path.insert(0,str(P.parent/'somangi-bench-down-v1'))
from rig_utils import surface_hash
report={}
for kind in ['bread','drink']:
    bpy.ops.wm.open_mainfile(filepath=str(P/f'somangi-{kind}.blend'))
    metadata=json.loads((P/f'{kind}-metadata.json').read_text())
    assert surface_hash(bpy.data.objects['Somangi_SmoothBody'])==metadata['meshHash']
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(P/f'somangi-{kind}.glb'))
    scene=bpy.context.scene;body=bpy.data.objects['Somangi_SmoothBody']
    for ob in [*scene.objects,*bpy.data.shape_keys]:
        ad=ob.animation_data
        if ad and not ad.action and ad.nla_tracks:
            strip=ad.nla_tracks[0].strips[0];ad.action=strip.action;ad.action_slot=strip.action_slot
            for track in ad.nla_tracks:track.mute=True
    action=next(k.animation_data.action for k in bpy.data.shape_keys if k.animation_data and k.animation_data.action)
    start,end=action.frame_range
    lookup=defaultdict(list)
    for v in body.data.vertices:lookup[tuple(round(c,6) for c in v.co)].append(v.index)
    pairs=np.array([(ids[0],i) for ids in lookup.values() for i in ids[1:]],dtype=int)
    gap=0;first=None;floor=0
    for i in range(181):
        frame=start+(end-start)*i/180;scene.frame_set(int(frame),subframe=frame-int(frame))
        ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
        coords=np.empty(len(mesh.vertices)*3,dtype=np.float32);mesh.vertices.foreach_get('co',coords);coords=coords.reshape(-1,3)
        assert np.isfinite(coords).all()
        gap=max(gap,float(np.linalg.norm(coords[pairs[:,0]]-coords[pairs[:,1]],axis=1).max()))
        floor=max(floor,-.950643003-float(coords[:,2].min()))
        if first is None:first=coords.copy()
        if i==180:loop=float(np.linalg.norm(first-coords,axis=1).max())
        ev.to_mesh_clear()
    ink=next(m for m in body.data.materials if m.name.startswith('Face_ink'))
    shader=next(n for n in ink.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    assert shader.inputs['Metallic'].default_value==0
    assert shader.inputs['Specular IOR Level'].default_value==0
    assert gap<2e-6 and floor<.004 and loop<2e-6
    report[kind]={'samples':181,'meshAndUvUnchanged':True,'maxSeamGap':gap,'floorPenetration':floor,'loopEndError':loop,'blackEyeMaterialPreserved':True,'durationSeconds':3}
(P/'validation.json').write_text(json.dumps(report,indent=2));print(report)
