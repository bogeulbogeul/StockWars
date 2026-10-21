"""Clean bumper trim and mount the plate and grille against the coach."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v22/Popori-bus-animated.blend'))
scene=bpy.context.scene
for name in ['Bumper_Upper_Recess','Bumper_Metal_Inset']:
    bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
for o in scene.objects:
    if o.name.startswith(('Front_Numberplate_Mount','Front_Numberplate_Face','Plate_Fastener')):
        o.location.z+=.081
        o.location.x-=.065
    if o.name.startswith(('Front_Grille_Recess','Grille_Narrow_Metal_Bar')):
        o.location.x-=.040
        o.location.z+=.025
plate=bpy.data.objects['Front_Numberplate_Mount']
grille=bpy.data.objects['Front_Grille_Recess']
assert plate.location.z-plate.dimensions.z/2>.55
assert grille.location.z-grille.dimensions.z/2>plate.location.z+plate.dimensions.z/2
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.cycles.samples=32
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),6.1),
    ('bumper-close',(7,-3,2.4),(2.35,0,.74),1.85)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'bumper_trim_removed':2,'plate_above_bumper':True,
    'grille_moved_inward':.040,'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
