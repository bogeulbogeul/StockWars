import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import material,box

out=Path('C:/GitHub/StockWars/output/cipher-single-sofa-v1');out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
cream=material('Sofa_Warm_Ivory',(.92,.865,.75))
blue=material('Sofa_Blue_Cushion',(.045,.13,.24),.95)
wood=material('Sofa_Round_Wood_Legs',(.44,.28,.13))

def puff(name,size,location,mat,power=.45):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=32,location=location)
    obj=bpy.context.object;obj.name=name
    for v in obj.data.vertices:
        v.co=Vector([math.copysign(abs(v.co[i])**power,v.co[i])*size[i]/2 for i in range(3)])
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:polygon.use_smooth=True
    return obj

for x in [-.43,.43]:
    for y in [-.32,.32]:
        bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=.04,radius2=.055,depth=.15,location=(x,y,.075))
        leg=bpy.context.object;leg.name='Sofa_Short_Wood_Leg';leg.data.materials.append(wood)
        for polygon in leg.data.polygons:polygon.use_smooth=True
puff('Sofa_Ivory_Base',(1.20,.98,.23),(0,0,.245),cream,.35)
puff('Sofa_Ivory_Back',(1.18,.24,.71),(0,.36,.635),cream,.4)
for x in [-.51,.51]:puff('Sofa_Rounded_Arm',(.20,.94,.47),(x,-.015,.49),cream,.5)
puff('Sofa_Seat_Cushion',(.82,.77,.18),(0,-.07,.40),blue,.4)
back=puff('Sofa_Back_Cushion',(.84,.24,.53),(0,.245,.69),blue,.48)
back.rotation_euler.x=math.radians(-7)
seat=bpy.data.objects.new('Seat_Contact_Point',None);bpy.context.collection.objects.link(seat)
seat.location=(0,-.10,.49)
seat['purpose']='Seated pelvis contact target; not a character animation'
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-single-sofa.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-single-sofa.glb'),export_format='GLB',export_extras=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
box('Studio_Ground',(200,200,.01),(0,0,-.015),material('Ground',(.60,.61,.63)),0)
bpy.ops.object.light_add(type='AREA',location=(-3,-4,5));bpy.context.object.data.energy=400;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(2,-3,2));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.48))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=1.8;scene.camera=camera
scene.render.resolution_x=1100;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'sofa-preview.png');bpy.ops.render.render(write_still=True)
