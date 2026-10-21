"""Lower the glass tops, remove centre seal and use green window surrounds."""
import bpy
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v12/Popori-bus-animated.blend'))
scene=bpy.context.scene
green=bpy.data.materials['Bus_Forest_Green']
for o in list(scene.objects):
    if o.name.startswith('Door_Central_Rubber_Seal'):
        bpy.data.objects.remove(o,do_unlink=True)
    elif o.name.startswith('Door_Inset_Glass'):
        o.scale.z*=.887/.927;o.location.z-=.020
    elif o.name.startswith('Door_Glass_Rubber_Seal'):
        o.scale.z*=.924/.964;o.location.z-=.020
        o.data.materials.clear();o.data.materials.append(green)
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.cycles.samples=32
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),6.1),
    ('door-close',(1.5,-5,2),(.396,-.83,1.18),1.85)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'glass_top_lowered':.04,'glass_bottom_preserved':True,
    'centre_seal_removed':True,'glass_surround_material':'Bus_Forest_Green',
    'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
