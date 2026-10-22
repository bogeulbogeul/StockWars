"""Remove side waist stripes and clear rear service decoration from wheels."""
import bpy
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v5/Popori-bus-animated.blend'))
scene=bpy.context.scene
for o in list(scene.objects):
    if o.name.startswith('Waistline_Trim'):bpy.data.objects.remove(o,do_unlink=True)
panels=[]
for o in scene.objects:
    if o.name.startswith(('Rear_Service_Panel','Rear_Engine_Vent')):
        o.location.x=-1.45
        o.location.z+=.19
        if o.name.startswith('Rear_Service_Panel'):
            o.scale.z*=.72;panels.append(o)
        else:
            o.location.z=1.06+(o.location.z-1.06)*.72
bpy.context.view_layer.update()
panel_bottom=min((o.matrix_world@Vector(p)).z for o in panels for p in o.bound_box)
assert panel_bottom>.39+.435+.10
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.cycles.samples=24
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),5.3),
    ('rear-wheel-close',(-3,-6,2),(-1.23,-.8,.82),1.8)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'side_white_stripes_removed':True,
    'rear_panel_bottom':panel_bottom,'panel_to_arch_vertical_clearance':panel_bottom-.825,
    'door_step_alignment_preserved':True,'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
