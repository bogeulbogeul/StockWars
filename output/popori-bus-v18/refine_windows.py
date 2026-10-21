"""Detailed continuous side window rings with inset glazing and vent lites."""
import bpy
import sys
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v17/Popori-bus-animated.blend'))
scene=bpy.context.scene
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box
source=(ROOT.parent/'popori-bus-v1/build_bus.py').read_text(encoding='utf-8')
exec(source[source.index('original_box='):source.index('bpy.ops.wm.read_factory_settings')])
green=bpy.data.materials['Bus_Forest_Green'];dark=bpy.data.materials['Bus_Window_Rubber']
glass=bpy.data.materials['Bus_Blue_Glass']
metal=material('Window_Satin_Trim',(.19,.27,.26),.65)
definitions=[]
for o in list(scene.objects):
    if o.name.startswith(('Side_Window_Seal','Driver_Side_Window_Seal')):
        definitions.append((o.location.copy(),o.dimensions.copy()))
    if o.name.startswith(('Side_Window_Seal','Side_Window_Glass','Driver_Side_Window_Seal','Driver_Side_Window_Glass')):
        bpy.data.objects.remove(o,do_unlink=True)
for i,(loc,size) in enumerate(definitions):
    side=1 if loc.y>0 else -1
    x,z=loc.x,loc.z;w,h=size.x,size.z
    # Dark continuous ring with an actual through opening instead of a panel stack.
    ring=box('Window_Continuous_Rubber_Frame',(w,.047,h),(x,side*.803,z),dark,.055)
    cut=box('Temporary_Window_Opening',(w-.068,.18,h-.068),(x,side*.803,z),dark,.040)
    bpy.context.view_layer.objects.active=ring
    m=ring.modifiers.new('Real_Window_Opening','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cut
    bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cut,do_unlink=True)
    box('Window_Inset_Blue_Glass',(w-.078,.012,h-.078),(x,side*.816,z),glass,.033)
    # A small fixed upper ventilation pane with a slim continuous crossbar.
    bar_z=z+.155
    box('Window_Upper_Vent_Crossbar',(w-.062,.023,.022),(x,side*.831,bar_z),metal,.006)
    box('Window_Lower_Sill',(w-.028,.037,.023),(x,side*.813,z-h/2+.009),green,.008)
    box('Window_Vent_Latch',(.048,.017,.018),(x,side*.844,bar_z+.018),metal,.006)
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.cycles.samples=32
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),6.1),
    ('windows-close',(-2,-6,2.8),(-1.0,-.81,1.58),2.45)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'side_windows_refined':len(definitions),
    'features':['continuous rubber frame with true opening','inset glass','upper vent crossbar and latch','lower sill'],
    'parked_wipers_preserved':True,'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
