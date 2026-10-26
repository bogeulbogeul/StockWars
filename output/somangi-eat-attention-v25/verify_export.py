import bpy,json,numpy as np,sys
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'somangi-eat.glb'))
scene=bpy.context.scene
for ob in [*scene.objects,*bpy.data.shape_keys]:
    ad=ob.animation_data
    if ad and not ad.action and ad.nla_tracks:
        strip=ad.nla_tracks[0].strips[0];ad.action=strip.action;ad.action_slot=strip.action_slot
        for track in ad.nla_tracks:track.mute=True
body=max((o for o in scene.objects if o.type=='MESH'),key=lambda o:len(o.data.vertices))
rig=next(m.object for m in body.modifiers if m.type=='ARMATURE')
start,end=rig.animation_data.action.frame_range;scene.frame_set(int(start));base=points(body)
records={}
for side in ['L','R']:
    group=body.vertex_groups['Arm.'+side].index
    ids=np.array([v.index for v in body.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups)])
    selected=set(ids.tolist());edges=np.array([(e.vertices[0],e.vertices[1]) for e in body.data.edges if all(i in selected for i in e.vertices)])
    lengths=np.linalg.norm(base[edges[:,0]]-base[edges[:,1]],axis=1);valid=lengths>1e-5
    records[side]=dict(edges=edges[valid],lengths=lengths[valid],maxRelativeEdgeError=0.)
for j in range(181):
    f=start+(end-start)*j/180;scene.frame_set(int(f),subframe=f-int(f));coords=points(body)
    for r in records.values():
        e=r['edges'];err=np.abs(np.linalg.norm(coords[e[:,0]]-coords[e[:,1]],axis=1)/r['lengths']-1)
        r['maxRelativeEdgeError']=max(r['maxRelativeEdgeError'],float(err.max()))
result={'samples':181,'arms':{s:r['maxRelativeEdgeError'] for s,r in records.items()}}
(P/'glb-rigidity-verification.json').write_text(json.dumps(result,indent=2));print(result)
