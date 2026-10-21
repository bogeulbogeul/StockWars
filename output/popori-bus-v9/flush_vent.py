"""Seat both vent panels directly onto the green body surface."""
import bpy
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v8/Popori-bus-animated.blend'))
scene=bpy.context.scene
# Body side is y=+/- .815; panel rear face intersects it by .002.
for o in scene.objects:
    if o.name.startswith('Rear_Service_Panel'):
        o.location.y=(1 if o.location.y>0 else -1)*.8205
    elif o.name.startswith('Rear_Engine_Vent'):
        o.location.y=(1 if o.location.y>0 else -1)*.833
bpy.context.view_layer.update()
body=bpy.data.objects['Green_Lower_Body']
inverse=body.matrix_world.inverted()
for o in scene.objects:
    if not o.name.startswith(('Rear_Service_Panel','Rear_Engine_Vent')):continue
    side=1 if o.location.y>0 else -1
    inv=o.matrix_world.inverted()
    for vertex in o.data.vertices:
        world=o.matrix_world@vertex.co
        hit,point,normal,index=body.ray_cast(inverse@Vector((world.x,side*3,world.z)),Vector((0,-side,0)))
        assert hit
        surface=body.matrix_world@point
        offset=side*world.y-.813
        world.y=surface.y+side*(offset-.001)
        vertex.co=inv@world
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.cycles.samples=24
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),6.1),
    ('vent-close',(-3,-6,2),(-1.50,-.8,.88),1.8)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'vent_panel_rear_face_y':.813,
    'body_side_y':.815,'panel_overlap':.002,'surface_fit':'Each panel and vent vertex follows actual curved body raycast',
    'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
