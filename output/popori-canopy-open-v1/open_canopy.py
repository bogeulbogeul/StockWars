"""Open the vertical canopy spacing of the approved-fruit Popori tree."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-fruit-v2/Popori-fruit.blend'))
scene=bpy.context.scene
crowns=[o for o in scene.objects if o.name.startswith('Crown_Centre')]
crowns.sort(key=lambda o:o.location.z)
shifts=[0,.48,.96]
for o in scene.objects:
    if o.name.startswith('Tier_'):
        tier=int(o.name.split('_')[1])
    elif o in crowns:
        tier=crowns.index(o)
    elif o.name.startswith('Joined_Leaf_Calyx'):
        zs=[(o.matrix_world@v.co).z for v in o.data.vertices]
        middle=bool(zs) and min(zs)>3.5
    else:
        continue
    o.location.z+=shifts[tier]
    o.scale.z*=.78
# Raise the two fruits belonging to the middle tier, including their seams.
fruit_prefixes=('Popori_Five_Lobed_Fruit','Joined_Leaf_Calyx','Calyx_Centre','Short_Connected_Stem','Warm_Natural_Fruit_Seam')
for o in scene.objects:
    if not o.name.startswith(fruit_prefixes):continue
    if o.type=='CURVE':
        zs=[p.co.z for spline in o.data.splines for p in spline.points]
        middle=bool(zs) and min(zs)>3.5
    else:
        middle=o.location.z>3.5
    if middle:o.location.z+=.48
# Stretch only the upper wood so all raised crowns remain connected.
trunk=bpy.data.objects.get('Unified_Ancient_Wood')
for v in trunk.data.vertices:
    world=trunk.matrix_world@v.co
    if world.z>2.9:
        world.z+=(world.z-2.9)*.48
        v.co=trunk.matrix_world.inverted()@world
assets=[o for o in scene.objects if o.type in ('MESH','CURVE') and o.name!='Plane']
bpy.ops.object.select_all(action='DESELECT')
for o in assets:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-open-canopy.glb'),export_format='GLB',use_selection=True)
bpy.ops.object.select_all(action='DESELECT')
cam=scene.camera;scene.cycles.samples=24
for name,loc,target,scale in [
    ('front',(0,-12,6.7),(0,0,3.2),9.3),
    ('front-right',(7,-12,7.4),(0,0,3.2),9.3),
    ('canopy-close',(0,-12,6.7),(0,0,4.65),7.5)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-open-canopy.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'P1 revised canopy model; user visual review and game integration pending',
    'tier_z_offsets':[0,.48,.96],'canopy_thickness_multiplier':.78,
    'fruit_design':'Approved popori-fruit-v2; middle tier fruit moved with crown',
    'roots_and_flowerbed':'unchanged','game_modified':False
},indent=2),encoding='utf-8')
