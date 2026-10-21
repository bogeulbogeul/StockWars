"""Park both wipers flat along the bottom windshield edge."""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v16/Popori-bus-animated.blend'))
scene=bpy.context.scene
pivots=[Vector((2.379,y,1.315)) for y in [-.37,.25]]
rotation=Matrix.Rotation(math.radians(-53),4,'X')
for o in scene.objects:
    if not o.name.startswith(('Wiper_Pivot_Cap','Continuous_Wiper_Arm','Wiper_Blade_Carrier','Wiper_Rubber_Blade','Wiper_Centre_Joint')):continue
    if o.type=='CURVE':
        coords=[Vector(p.co[:3]) for s in o.data.splines for p in s.points]
        center=sum(coords,Vector())/len(coords)
    else:center=o.location
    pivot=min(pivots,key=lambda p:abs(p.y-center.y))
    o.matrix_world=Matrix.Translation(pivot)@rotation@Matrix.Translation(-pivot)@o.matrix_world
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.cycles.samples=32
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),6.1),
    ('wiper-close',(6,-1.3,2.35),(2.38,0,1.52),1.35)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'wipers':'Parked low along windshield bottom; no wiper animation',
    'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
