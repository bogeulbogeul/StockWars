import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import material,box,extrude,disk,stroke

out=Path('C:/GitHub/StockWars/output/cipher-cozy-elevator-v1');out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
cream=material('Elevator_Cream',(.92,.865,.75))
blue=material('Elevator_Blue',(.045,.13,.24))
dark=material('Elevator_Recess',(.025,.07,.13))
silver=material('Elevator_Soft_Silver',(.53,.63,.69),.65)

def top_path(w,h,r):
    points=[(-w/2,0),(-w/2,h-r)]
    for cx,start in [(-w/2+r,math.pi),(w/2-r,math.pi/2)]:
        points += [(cx+r*math.cos(start-i*math.pi/2/20),h-r+r*math.sin(start-i*math.pi/2/20)) for i in range(21)]
    return points+[(w/2,0)]

extrude('Elevator_Rounded_Cream_Surround',top_path(1.72,2.26,.31)+list(reversed(top_path(1.40,2.08,.22))),-.16,.02,cream,.018)
extrude('Elevator_Blue_Inner_Frame',top_path(1.43,2.11,.23)+list(reversed(top_path(1.25,1.86,.035))),-.19,-.08,blue,.012)
box('Elevator_Dark_Recess',(1.27,.035,1.86),(0,-.05,.93),dark,.01)
for side in [-1,1]:
    box('Elevator_Silver_Door',(.606,.025,1.80),(side*.31,-.087,.92),silver,.012)
    box('Elevator_Door_Edge',(.012,.004,1.75),(side*.014,-.103,.92),dark,.003)
box('Elevator_Threshold',(1.46,.20,.025),(0,-.08,.0125),silver,.008)
box('Elevator_Threshold_Track',(1.23,.022,.006),(0,-.13,.029),dark,.002)
box('Elevator_Floor_Display',(.53,.025,.16),(0,-.205,1.98),dark,.025)
for x,direction in [(-.13,1),(.13,-1)]:
    extrude('Elevator_Display_Arrow',[(x-.032,1.98-direction*.018),(x+.032,1.98-direction*.018),(x,1.98+direction*.038)],-.224,-.219,cream,.001)
box('Elevator_Floor_One',(.020,.006,.085),(0,-.224,1.98),cream,.002)
# Separate stacked circular buttons on the entrance side, without a bulky panel.
for height,direction in [(1.20,1),(.97,-1)]:
    disk('Elevator_Call_Ivory_Rim',1.04,-.055,height,.105,.045,cream)
    disk('Elevator_Call_Blue_Face',1.04,-.084,height,.079,.018,blue)
    stroke('Elevator_Call_Up' if direction==1 else 'Elevator_Call_Down',
        [(1.012,-.10,height-direction*.015),(1.04,-.10,height+direction*.025),(1.068,-.10,height-direction*.015)],.009,cream)
for obj in list(bpy.context.scene.objects):
    if obj.type=='CURVE':
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-cozy-elevator.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-cozy-elevator.glb'),export_format='GLB')
box('Preview_Wall',(3,.10,2.7),(0,.10,1.35),material('Wall',(.83,.785,.68)),.02)
box('Preview_Floor',(5,4,.04),(0,-1,-.03),material('Floor',(.86,.795,.66)),.01)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
bpy.ops.object.light_add(type='AREA',location=(-3,-4,5));bpy.context.object.data.energy=400;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(3,-5,3));camera=bpy.context.object
camera.rotation_euler=(Vector((.1,0,1.15))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=2.95;scene.camera=camera
scene.render.resolution_x=1000;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'elevator-preview.png');bpy.ops.render.render(write_still=True)
