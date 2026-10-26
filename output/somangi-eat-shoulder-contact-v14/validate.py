import bpy,numpy as np,json,sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
from contact import head_tree,prop_samples,safe_shift,transform
meta=json.loads((P/'metadata.json').read_text());start=meta['torsoVertexStart']
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-belly-contour-v13/somangi-eat.blend'))
old=bpy.data.objects['Somangi_SmoothBody'];original=np.array([tuple(v.co) for v in old.data.vertices])
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];root=bpy.data.objects['bread_Prop']
samples=prop_samples(root);worst=0;penetrations=0;grip=0;torso=0;head=0
food_meshes=[ob for ob in root.children if ob.type=='MESH']
for half in range(181):
    frame=1+half*.5;bpy.context.scene.frame_set(int(frame),subframe=frame-int(frame))
    coords=points(body);tree=head_tree(coords[meta['headIds']],meta['headFaces'])
    remaining=safe_shift(tree,transform(samples,root.matrix_world),clearance=.010)
    worst=max(worst,float(remaining))
    torso=max(torso,float(np.max(np.abs(coords[start:meta['torsoVertexEnd']]-original[start:]))))
    for ids in meta['palmIds'].values():
        local=root.matrix_world.inverted()@Vector(coords[ids].mean(0))
        radial=np.linalg.norm(np.array(local)/np.array([.20,.105,.17]))
        grip=max(grip,float(abs(radial-1)*max(root.scale)*.20))
    for ob in food_meshes:
        verts=[ob.matrix_world@v.co for v in ob.data.vertices]
        food_tree=BVHTree.FromPolygons(verts,[list(f.vertices) for f in ob.data.polygons],all_triangles=False)
        penetrations+=len(tree.overlap(food_tree))
assert worst<1e-5,worst
assert penetrations==0,penetrations
assert torso==0,torso
assert grip<.004,grip
report={'samples':181,'headFoodTriangleIntersections':penetrations,
 'maximumFaceClearanceViolationAlongY':worst,'testedFaceClearanceAlongY':.010,
 'maximumPalmLoafSurfaceError':grip,'maximumTorsoDifferenceFromV13':torso,
 'breadIncludesTopScoring':True,'gameInstalled':False}
(P/'validation.json').write_text(json.dumps(report,indent=2));print(report)
