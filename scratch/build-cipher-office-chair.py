"""Compact office chair with five casters and an explicit seat contact target."""
import bpy,math,sys,ast
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import material,box,finish
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-office-chair-v1';out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
tree=ast.parse((root/'scratch/build-cipher-single-sofa.py').read_text())
function=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='puff')
exec(compile(ast.Module(body=[function],type_ignores=[]),'<puff>','exec'))
cream=material('Office_Chair_Cream',(.92,.865,.75));blue=material('Office_Chair_Blue',(.045,.13,.24),.95)
metal=material('Office_Chair_Column',(.22,.27,.29),.6);rubber=material('Office_Chair_Casters',(.035,.05,.06),1)
def rod(name,a,b,radius,mat):
    a,b=Vector(a),Vector(b);delta=b-a
    bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=radius,depth=delta.length,location=(a+b)/2)
    obj=bpy.context.object;obj.name=name;obj.rotation_euler=delta.to_track_quat('Z','Y').to_euler()
    finish(obj,mat,.007)
    for polygon in obj.data.polygons:polygon.use_smooth=True
    return obj
rod('Chair_Lift_Column',(0,0,.13),(0,0,.37),.037,metal)
rod('Chair_Column_Cover',(0,0,.15),(0,0,.28),.052,cream)
for i in range(5):
    angle=2*math.pi*i/5-math.pi/2;x=.34*math.cos(angle);y=.34*math.sin(angle)
    rod('Chair_Five_Star_Spoke',(0,0,.155),(x,y,.10),.027,cream)
    rod('Caster_Fork',(x,y,.075),(x,y,.12),.025,cream)
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.05,depth=.055,location=(x,y,.05),rotation=(0,math.pi/2,angle))
    wheel=bpy.context.object;wheel.name='Office_Chair_Caster';finish(wheel,rubber,.008)
    for polygon in wheel.data.polygons:polygon.use_smooth=True
puff('Office_Chair_Seat_Frame',(.64,.60,.09),(0,-.02,.385),cream,.4)
puff('Office_Chair_Seat_Cushion',(.58,.54,.12),(0,-.035,.43),blue,.45)
back=puff('Office_Chair_Back_Frame',(.65,.13,.48),(0,.245,.715),cream,.42)
back.rotation_euler.x=math.radians(-7)
back=puff('Office_Chair_Back_Cushion',(.57,.12,.42),(0,.175,.715),blue,.45)
back.rotation_euler.x=math.radians(-7)
rod('Chair_Back_Support',(0,.20,.38),(0,.26,.62),.037,cream)
for side in [-1,1]:
    rod('Office_Chair_Arm_Riser',(side*.34,.035,.39),(side*.34,.035,.615),.027,cream)
    puff('Office_Chair_Arm_Pad',(.105,.28,.065),(side*.34,-.03,.63),blue,.5)
contact=bpy.data.objects.new('Seat_Contact_Point',None);bpy.context.collection.objects.link(contact);contact.location=(0,-.035,.49)
contact['purpose']='Future seated pelvis target, no sitting animation included'
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-office-chair.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-office-chair.glb'),export_format='GLB',export_extras=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
box('Studio',(200,200,.01),(0,0,-.015),material('Studio',(.60,.61,.63)),0)
bpy.ops.object.light_add(type='AREA',location=(-3,-4,5));bpy.context.object.data.energy=400;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(1.6,-2.5,1.65));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.47))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=1.4;scene.camera=camera
scene.render.resolution_x=1100;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'chair-preview.png');bpy.ops.render.render(write_still=True)
