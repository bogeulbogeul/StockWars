"""Refine top branch connection and rebuild consistently upright attached fruit."""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-canopy-open-v1/Popori-open-canopy.blend'))
scene=bpy.context.scene
prefixes=('Popori_Five_Lobed_Fruit','Joined_Leaf_Calyx','Calyx_Centre','Short_Connected_Stem','Warm_Natural_Fruit_Seam')
for o in list(scene.objects):
    if o.name.startswith(prefixes):bpy.data.objects.remove(o,do_unlink=True)
source=(ROOT.parent/'popori-fruit-v2/build_fruit.py').read_text(encoding='utf-8')
exec(source[source.index('def mat'):source.index('hero=fruit')])
# All pieces are regenerated together at a single origin, calyx and stem +Z.
# Lower calyx is kept below its canopy rather than protruding through its top.
for x,y,z in [(-2.55,-.48,2.87),(-1.70,-1.08,2.90),(2.62,-.4,2.87),
              (1.7,-1.03,2.90),(-1.48,-.64,4.51),(1.38,-.65,4.53)]:
    fruit((x,y,z),.44)

# Replace the exposed vertical top with a smooth fork that spreads into the crown.
trunk=bpy.data.objects.get('Unified_Ancient_Wood')
for v in trunk.data.vertices:
    co=trunk.matrix_world@v.co
    if co.z>5.40:
        t=min(1,(co.z-5.40)/1.25)
        co.x-=.26*t*t
        co.z-=.13*t
        v.co=trunk.matrix_world.inverted()@co
wood=bpy.data.materials.get('Ancient_Honey_Wood')
def branch(points,radii):
    c=bpy.data.curves.new('Crown_Fork','CURVE');c.dimensions='3D'
    c.resolution_u=24;c.bevel_depth=1;c.bevel_resolution=5;c.use_fill_caps=True
    s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for p,co,r in zip(s.bezier_points,points,radii):
        p.co=co;p.radius=r;p.handle_left_type=p.handle_right_type='AUTO'
    o=bpy.data.objects.new('Soft_Top_Crown_Branch',c);scene.collection.objects.link(o);c.materials.append(wood)
branch([(-.04,.1,5.25),(-.16,.1,5.68),(-.48,.13,6.12),(-.68,.12,6.30)],[.21,.17,.10,.035])
branch([(-.12,.1,5.57),(.17,.1,5.85),(.43,.12,6.16)],[.17,.12,.035])
# Lower the top crown slightly to conceal branch tips while retaining an open gap.
centres=sorted([o for o in scene.objects if o.name.startswith('Crown_Centre')],key=lambda o:o.location.z)
for o in scene.objects:
    if o.name.startswith('Tier_2') or o==centres[-1]:o.location.z-=.16
assets=[o for o in scene.objects if o.type in ('MESH','CURVE') and o.name!='Plane']
bpy.ops.object.select_all(action='DESELECT')
for o in assets:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-refined.glb'),export_format='GLB',use_selection=True)
bpy.ops.object.select_all(action='DESELECT')
cam=scene.camera;scene.cycles.samples=24
for name,loc,target,scale in [('front',(0,-12,6.7),(0,0,3.1),9.1),
    ('canopy-close',(0,-12,6.7),(0,0,4.55),7.3)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-refined.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'P1 revised model; user visual review and game integration pending',
    'changes':['Curved forked upper crown support','All six fruits rebuilt upright with calyx and stem above fruit','Lower fruit calyx hidden below canopy surface'],
    'game_modified':False},indent=2),encoding='utf-8')
