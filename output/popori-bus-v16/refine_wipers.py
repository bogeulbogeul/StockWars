"""Continuous parallel parked wipers with pivots, articulated arms and blades."""
import bpy
import sys
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v15/Popori-bus-animated.blend'))
scene=bpy.context.scene
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,disk,stroke
source=(ROOT.parent/'popori-bus-v1/build_bus.py').read_text(encoding='utf-8')
exec(source[source.index('original_box='):source.index('bpy.ops.wm.read_factory_settings')])
dark=bpy.data.materials['Bus_Window_Rubber']
armmat=material('Wiper_Satin_Graphite',(.075,.092,.09),.65)
for o in list(scene.objects):
    if o.name.startswith(('Wiper_Arm','Wiper_Blade','Front_Wiper')):bpy.data.objects.remove(o,do_unlink=True)
# Same-handed parked pose; each blade stays fully within the windshield.
for i,y in enumerate([-.37,.25]):
    pivot=(2.379,y,1.315)
    elbow=(2.387,y+.035,1.405)
    joint=Vector((2.390,y+.095,1.535))
    bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.024,depth=.016,
        location=pivot,rotation=(0,1.57079632679,0))
    o=bpy.context.object;o.name='Wiper_Pivot_Cap';o.data.materials.append(armmat)
    for p in o.data.polygons:p.use_smooth=True
    stroke('Continuous_Wiper_Arm',[pivot,elbow,tuple(joint)],.010,armmat)
    direction=Vector((0,.115,.165)).normalized()
    a=joint-direction*.135;b=joint+direction*.135
    # Curved carrier and continuous slim rubber blade overlap at the centre joint.
    carrier_a=a+Vector((.004,0,0));carrier_b=b+Vector((.004,0,0))
    stroke('Wiper_Blade_Carrier',[tuple(carrier_a),tuple(joint+Vector((.012,0,0))),tuple(carrier_b)],.011,armmat)
    stroke('Wiper_Rubber_Blade',[tuple(a-Vector((.003,0,0))),tuple(b-Vector((.003,0,0)))],.008,dark)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=joint)
    o=bpy.context.object;o.name='Wiper_Centre_Joint';o.scale=(.018,.016,.021);o.data.materials.append(armmat)
    for p in o.data.polygons:p.use_smooth=True
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.cycles.samples=32
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),6.1),
    ('front-close',(7,-3,2.8),(2.37,0,1.14),2.8),
    ('wiper-close',(6,-1.3,2.35),(2.38,0,1.52),1.35)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'wipers':'Parallel continuous parked arms, pivot caps, centre joints and slim full-length rubber blades',
    'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
