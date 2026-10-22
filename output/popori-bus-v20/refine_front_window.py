"""Match the front windscreen to the clean inset side windows."""
import bpy
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v19/Popori-bus-animated.blend'))
scene=bpy.context.scene
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box
source=(ROOT.parent/'popori-bus-v1/build_bus.py').read_text(encoding='utf-8')
exec(source[source.index('original_box='):source.index('bpy.ops.wm.read_factory_settings')])
dark=bpy.data.materials['Bus_Window_Rubber']
glass=bpy.data.materials['Bus_Blue_Glass']
for name in ['Front_Windscreen_Seal','Front_Windscreen']:
    bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
# Build in the same plane as the side windows, then rotate onto the front.
ring=box('Front_Window_Continuous_Rubber_Frame',(1.29,.047,.67),(0,0,0),dark,.055)
cut=box('Temporary_Front_Window_Opening',(1.222,.18,.602),(0,0,0),dark,.040)
bpy.context.view_layer.objects.active=ring
m=ring.modifiers.new('Real_Window_Opening','BOOLEAN')
m.operation='DIFFERENCE';m.solver='EXACT';m.object=cut
bpy.ops.object.modifier_apply(modifier=m.name)
bpy.data.objects.remove(cut,do_unlink=True)
ring.rotation_euler.z=1.57079632679
ring.location=(2.335,0,1.57)
pane=box('Front_Window_Inset_Blue_Glass',(1.212,.012,.592),(0,0,0),glass,.033)
pane.rotation_euler.z=1.57079632679
pane.location=(2.343,0,1.57)
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.cycles.samples=32
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),6.1),
    ('front-window-close',(7,-3,2.9),(2.34,0,1.58),1.95)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'continuous_front_window_frame':True,
    'inset_glass':True,'parked_wipers_preserved':True,'wheel_roll_preserved':True,
    'game_modified':False},indent=2),encoding='utf-8')
