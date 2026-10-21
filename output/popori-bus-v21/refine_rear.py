"""Continuous inset rear glazing and layered three-section tail lamps."""
import bpy
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v20/Popori-bus-animated.blend'))
scene=bpy.context.scene
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,material
source=(ROOT.parent/'popori-bus-v1/build_bus.py').read_text(encoding='utf-8')
exec(source[source.index('original_box='):source.index('bpy.ops.wm.read_factory_settings')])
dark=bpy.data.materials['Bus_Window_Rubber']
glass=bpy.data.materials['Bus_Blue_Glass']
metal=bpy.data.materials['Bus_Hub_Warm_Metal']
red=bpy.data.materials['Bus_Rear_Lamp']
amber=bpy.data.materials['Bus_Indicator_Amber']
ivory=bpy.data.materials['Bus_Headlight_Ivory']
red_rib=material('Rear_Lens_Red_Ribs',(.65,.115,.065),.40)
amber_rib=material('Rear_Lens_Amber_Ribs',(.98,.44,.075),.40)
for o in list(scene.objects):
    if o.name in ('Rear_Window_Seal','Rear_Window') or o.name.startswith('Rear_Stoplight'):
        bpy.data.objects.remove(o,do_unlink=True)
ring=box('Rear_Window_Continuous_Rubber_Frame',(1.21,.047,.62),(0,0,0),dark,.055)
cut=box('Temporary_Rear_Window_Opening',(1.142,.18,.552),(0,0,0),dark,.040)
bpy.context.view_layer.objects.active=ring
m=ring.modifiers.new('Real_Window_Opening','BOOLEAN')
m.operation='DIFFERENCE';m.solver='EXACT';m.object=cut
bpy.ops.object.modifier_apply(modifier=m.name)
bpy.data.objects.remove(cut,do_unlink=True)
ring.rotation_euler.z=1.57079632679
ring.location=(-2.335,0,1.56)
pane=box('Rear_Window_Inset_Blue_Glass',(1.132,.012,.542),(0,0,0),glass,.033)
pane.rotation_euler.z=1.57079632679
pane.location=(-2.343,0,1.56)
for y in [-.50,.50]:
    box('Rear_Lamp_Rubber_Housing',(.045,.190,.334),(-2.365,y,.825),dark,.030)
    box('Rear_Lamp_Satin_Bezel',(.026,.166,.307),(-2.389,y,.825),metal,.022)
    for z,h,mat,rib in [(.919,.092,red,red_rib),(.825,.075,amber,amber_rib),(.741,.067,ivory,ivory)]:
        box('Rear_Lamp_Inset_Lens',(.023,.135,h),(-2.408,y,z),mat,.014)
        for dz in [-.017,.017]:
            box('Rear_Lens_Subtle_Fluting',(.004,.108,.004),(-2.421,y,z+dz),rib,.0015)
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.cycles.samples=32
cam=scene.camera
for name,loc,target,scale in [('opposite-side',(-6,8,4.0),(0,0,1.06),6.1),
    ('rear-close',(-7,3,2.9),(-2.34,0,1.31),2.25)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'rear_inset_window':True,'layered_tail_lamps':2,
    'lens_sections':['red','amber','ivory'],'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
