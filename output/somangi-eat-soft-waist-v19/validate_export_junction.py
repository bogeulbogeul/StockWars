import bpy,json,numpy as np,sys
from pathlib import Path
from mathutils.kdtree import KDTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
meta=json.loads((P/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];ids=meta['seamHeadIds'];tree=KDTree(len(ids))
for j,i in enumerate(ids):tree.insert(body.matrix_world@body.data.vertices[i].co,j)
tree.balance()
bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene;scene.render.fps=30
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-eat.glb'))
for ob in [*scene.objects,*bpy.data.shape_keys]:
    ad=ob.animation_data
    if ad and not ad.action and ad.nla_tracks:
        strip=ad.nla_tracks[0].strips[0];ad.action=strip.action;ad.action_slot=strip.action_slot
        for track in ad.nla_tracks:track.mute=True
body=bpy.data.objects['Somangi_SmoothBody'];groups=[[] for _ in ids]
for v in body.data.vertices:
    _,j,distance=tree.find(body.matrix_world@v.co)
    if distance<1e-6:groups[j].append(v.index)
assert all(groups),'Missing head seam vertices'
pairs=[(group[0],i) for group in groups for i in group[1:]]
maximum=0
if pairs:
    a,b=np.array(pairs).T
    for half in range(181):
        frame=1+half*.5;scene.frame_set(int(frame),subframe=frame-int(frame));co=points(body)
        maximum=max(maximum,float(np.max(np.linalg.norm(co[a]-co[b],axis=1))))
assert maximum<1e-6,maximum
report={'file':'somangi-eat.glb','samples':181,'matchedHeadBoundaryLocations':len(groups),
    'materialSplitVertexPairs':len(pairs),'maximumExportedHeadSleeveSeparation':maximum}
(P/'export-junction-validation.json').write_text(json.dumps(report,indent=2));print(report)
