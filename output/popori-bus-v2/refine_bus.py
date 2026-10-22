"""Refine the bus and export a real four-wheel roll animation."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v1/Popori-bus.blend'))
scene=bpy.context.scene
source=(ROOT.parent/'popori-bus-v1/build_bus.py').read_text(encoding='utf-8')
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,disk,stroke,box
exec(source[source.index('original_box='):source.index('bpy.ops.wm.read_factory_settings')])
cream=bpy.data.materials['Bus_Warm_Cream'];green=bpy.data.materials['Bus_Forest_Green']
dark=bpy.data.materials['Bus_Window_Rubber'];hub=bpy.data.materials['Bus_Hub_Warm_Metal']
rubber=bpy.data.materials['Bus_Tire_Rubber']
brass=material('Bus_Subtle_Brass',(.58,.40,.18),.5)

# Real wheel openings remove body/tire intersection, with rounded cut edges.
for x in [-1.20,1.18]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=.435,depth=2.5,location=(x,0,.39),rotation=(math.pi/2,0,0))
    cutter=bpy.context.object
    for name in ['Cream_Rounded_Coach','Green_Lower_Body']:
        body=bpy.data.objects[name]
        bpy.context.view_layer.objects.active=body
        m=body.modifiers.new('Actual_Wheel_Arch','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cutter
        bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    for y in [-.823,.823]:
        points=[(x+.443*math.cos(math.pi*j/64),y,.39+.443*math.sin(math.pi*j/64)) for j in range(65)]
        stroke('Continuous_Wheel_Arch_Trim',points,.019,cream)
for y in [-.821,.821]:
    box('Waistline_Trim',(3.45,.017,.032),(-.10,y,1.085),cream,.008)
    box('Rear_Service_Panel',(.53,.015,.25),(-1.42,y,.87),green,.025)
    for j in range(4):box('Rear_Engine_Vent',(.35,.012,.012),(-1.42,y+math.copysign(.012,y),.79+j*.045),dark,.004)
for x in [.48,.70]:
    box('Door_Handle',(.023,.024,.15),(x,-.862,1.04),hub,.009)
for x in [-.85,.55]:
    box('Roof_Vent_Base',(.57,.50,.045),(x,0,2.17),cream,.02)
    box('Roof_Vent_Cap',(.49,.42,.045),(x,0,2.205),green,.02)
for y in [-.57,.57]:
    box('Front_Headlight_Visor',(.06,.28,.028),(1.997,y,.995),cream,.012)
box('Front_Plate_Recess',(.028,.34,.11),(2.025,0,.53),green,.014)
box('Front_Plate',(.018,.28,.068),(2.044,0,.53),cream,.008)

scene.render.fps=24;scene.frame_start=1;scene.frame_end=49
pivots=[];checks=[]
for axle,x in [('Rear',-1.20),('Front',1.18)]:
    for side,y in [('Right',-.78),('Left',.78)]:
        wheel=next(o for o in scene.objects if o.name.startswith('Road_Wheel') and abs(o.location.x-x)<.01 and abs(o.location.y-y)<.01)
        items=[wheel]+[o for o in scene.objects if o.name.startswith(('Wheel_Hub','Wheel_Centre')) and abs(o.location.x-x)<.01 and abs(o.location.y-y)<.20]
        outer=y+math.copysign(.153,y)
        for j in range(6):
            a=j*math.tau/6
            items.append(disk('Wheel_Hub_Bolt',x+.145*math.cos(a),outer,.39+.145*math.sin(a),.021,.014,brass))
        # Tread blocks make the spinning tire clearly visible from all angles.
        for j in range(32):
            a=j*math.tau/32
            block=box('Rounded_Tire_Tread',(.043,.17,.014),(x+.386*math.sin(a),y,.39+.386*math.cos(a)),rubber,.005)
            block.rotation_euler.y=a;items.append(block)
        pivot=bpy.data.objects.new('WheelPivot_'+axle+'_'+side,None);scene.collection.objects.link(pivot)
        pivot.location=(x,y,.39);bpy.context.view_layer.update()
        for o in items:
            matrix=o.matrix_world.copy();o.parent=pivot;o.matrix_world=matrix
        pivot.rotation_mode='XYZ'
        for frame,angle in [(1,0),(13,math.pi/2),(25,math.pi),(37,3*math.pi/2),(49,math.tau)]:
            pivot.rotation_euler.y=angle;pivot.keyframe_insert(data_path='rotation_euler',frame=frame)
        action=pivot.animation_data.action;action.name='Roll_'+axle+'_'+side
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for fc in bag.fcurves:
                        for key in fc.keyframe_points:key.interpolation='LINEAR'
        # glTF merges matching NLA track names into one Wheel_Roll clip.
        track=pivot.animation_data.nla_tracks.new();track.name='Wheel_Roll'
        track.strips.new('Wheel_Roll',1,action)
        pivot.animation_data.action=None
        pivots.append(pivot)
scene.frame_set(1);bpy.context.view_layer.update()
for p in pivots:
    start=p.matrix_world.translation.copy()
    for f in [1,7,13,19,25,31,37,43,49]:
        scene.frame_set(f);bpy.context.view_layer.update()
        assert (p.matrix_world.translation-start).length<1e-6
    checks.append({'pivot':p.name,'stationary_axle':True,'radius':.39})
scene.frame_set(1)
assets=[o for o in scene.objects if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground']
bpy.ops.object.select_all(action='DESELECT')
for o in assets:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
cam=scene.camera;scene.cycles.samples=24
for name,loc in [('front-right',(6,-8,4.3)),('side',(0,-9,2.8)),('rear',(-6,8,4.3))]:
    cam.location=loc;cam.data.ortho_scale=5.3
    cam.rotation_euler=(Vector((0,0,1.06))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
cam.location=(6,-8,4.3);cam.rotation_euler=(Vector((0,0,1.06))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'wheel_checks':checks,'clip':'Wheel_Roll','seconds_per_revolution':2,
    'distance_per_revolution':math.tau*.39,'rotation_axis':'Blender +Y; front is +X',
    'status':'Model and wheel clip exported; game motion integration pending'},indent=2),encoding='utf-8')
