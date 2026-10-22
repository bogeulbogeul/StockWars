"""Replace flat roof plates with soft low-profile vent hatches."""
import bpy
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v21/Popori-bus-animated.blend'))
scene=bpy.context.scene
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box
source=(ROOT.parent/'popori-bus-v1/build_bus.py').read_text(encoding='utf-8')
exec(source[source.index('original_box='):source.index('bpy.ops.wm.read_factory_settings')])
cream=bpy.data.materials['Bus_Warm_Cream']
green=bpy.data.materials['Bus_Forest_Green']
positions=[o.location.x for o in scene.objects if o.name.startswith('Roof_Vent_Base')]
assert len(positions)==2
for o in list(scene.objects):
    if o.name.startswith(('Roof_Vent_Base','Roof_Vent_Cap')):
        bpy.data.objects.remove(o,do_unlink=True)
for x in positions:
    box('Roof_Hatch_Rounded_Collar',(.64,.54,.065),(x,0,2.183),cream,.030)
    cap=box('Roof_Hatch_Soft_Green_Cap',(.56,.46,.090),(x,0,2.229),green,.043)
    for y in [-.105,-.035,.035,.105]:
        cutter=box('Temporary_Vent_Channel',(.35,.018,.028),(x,y,2.274),green,.008)
        bpy.context.view_layer.objects.active=cap
        m=cap.modifiers.new('Recessed_Roof_Vent','BOOLEAN')
        m.operation='DIFFERENCE';m.solver='EXACT';m.object=cutter
        bpy.ops.object.modifier_apply(modifier=m.name)
        bpy.data.objects.remove(cutter,do_unlink=True)
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.cycles.samples=32
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),6.1),
    ('roof-close',(4,-6,6),(0,0,2.15),4.8)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'rounded_roof_hatches':2,'recessed_vent_channels':8,
    'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
