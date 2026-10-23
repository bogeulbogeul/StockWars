import bpy,numpy as np,json,sys
from pathlib import Path
from mathutils import Vector
from mathutils.kdtree import KDTree
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
from contact import head_tree,prop_samples,safe_shift,transform
meta=json.loads((P/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
ob=bpy.data.objects['Somangi_SmoothBody'];reference=[ob.matrix_world@ob.data.vertices[i].co for i in meta['headIds']]
tree=KDTree(len(reference))
for i,p in enumerate(reference):tree.insert(p,i)
tree.balance()
bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene;scene.render.fps=30
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-eat.glb'))
for ob in [*scene.objects,*bpy.data.shape_keys]:
    ad=ob.animation_data
    if ad and not ad.action and ad.nla_tracks:
        strip=ad.nla_tracks[0].strips[0];ad.action=strip.action;ad.action_slot=strip.action_slot
        for track in ad.nla_tracks:track.mute=True
body=bpy.data.objects['Somangi_SmoothBody'];root=bpy.data.objects['bread_Prop']
ids={v.index for v in body.data.vertices if tree.find(body.matrix_world@v.co)[2]<.00001}
faces=[list(f.vertices) for f in body.data.polygons if all(i in ids for i in f.vertices)]
assert len(faces)>10000,len(faces)
samples=prop_samples(root);meshes=[ob for ob in root.children if ob.type=='MESH'];hits=0;violation=0
for half in range(181):
    frame=1+half*.5;scene.frame_set(int(frame),subframe=frame-int(frame))
    coords=points(body);coords=transform(coords,body.matrix_world)
    head=head_tree(coords,faces)
    violation=max(violation,float(safe_shift(head,transform(samples,root.matrix_world),.010)))
    for ob in meshes:
        food=BVHTree.FromPolygons([ob.matrix_world@v.co for v in ob.data.vertices],
            [list(f.vertices) for f in ob.data.polygons],all_triangles=False)
        hits+=len(head.overlap(food))
assert hits==0,hits
assert violation<1e-5,violation
report={'file':'somangi-eat.glb','samples':181,'headTriangles':len(faces),
    'headFoodTriangleIntersections':hits,'maximumFaceClearanceViolationAlongY':violation,
    'testedFaceClearanceAlongY':.010}
(P/'export-validation.json').write_text(json.dumps(report,indent=2));print(report)
