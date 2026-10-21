import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import material,box,stroke

out=Path('C:/GitHub/StockWars/output/cipher-cozy-plant-v1');out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
cream=material('Planter_Ivory',(.92,.865,.75))
blue=material('Planter_Blue_Rim',(.045,.13,.24))
soil=material('Planter_Recessed_Soil',(.13,.075,.035),1)
green=material('Plant_Leaf_Green',(.12,.28,.10))
light=material('Plant_Leaf_Light',(.22,.37,.14))
stem=material('Plant_Stem_Green',(.10,.20,.065))
vein=material('Plant_Leaf_Vein',(.20,.32,.11))

def lathe(name,profile,mat):
    n=64;verts=[(r*math.cos(j*math.tau/n),r*math.sin(j*math.tau/n),z) for r,z in profile for j in range(n)]
    faces=[]
    for i in range(len(profile)-1):
        for j in range(n):faces.append((i*n+j,i*n+(j+1)%n,(i+1)*n+(j+1)%n,(i+1)*n+j))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);mesh.materials.append(mat)
    for polygon in mesh.polygons:polygon.use_smooth=True
    return obj

lathe('Planter_Open_Rounded_Ivory_Bowl',[(0,0),(.15,0),(.19,.015),(.23,.07),(.26,.20),(.27,.35),
    (.27,.41),(.263,.43),(.244,.43),(.237,.415),(.235,.38),(.225,.10),(0,.10)],cream)
lathe('Planter_Blue_Rim_Band',[(.2704,.34),(.274,.344),(.274,.40),(.2704,.404),(.269,.40),(.269,.344),(.2704,.34)],blue)
bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.237,depth=.01,location=(0,0,.385))
bpy.context.object.name='Planter_Soil_Surface';bpy.context.object.data.materials.append(soil)
stroke('Plant_Central_Stem',[(0,0,.385),(0,0,.67),(.015,.01,.88),(.049,.034,.99)],.013,stem)

def leaf(index,base,direction,length,width):
    base=Vector(base);axis=Vector(direction).normalized();side=Vector((0,0,1)).cross(axis).normalized()
    normal=axis.cross(side).normalized();rings=25;sides=16;verts=[]
    for i in range(rings):
        t=i/(rings-1);bulge=max(.0001,math.sin(math.pi*t))
        center=base+axis*(length*t)+normal*(.025*bulge)
        for j in range(sides):
            angle=j*math.tau/sides
            verts.append(center+side*(width*bulge**.68*math.cos(angle))+normal*(.020*bulge**.8*math.sin(angle)))
    faces=[]
    for i in range(rings-1):
        for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
    faces += [tuple(range(sides-1,-1,-1)),tuple(range((rings-1)*sides,rings*sides))]
    mesh=bpy.data.meshes.new('Broad_Leaf');mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(f'Plant_Broad_Leaf_{index}',mesh);bpy.context.collection.objects.link(obj)
    mesh.materials.append(light if index%3==0 else green)
    for polygon in mesh.polygons:polygon.use_smooth=True
    stroke('Plant_Leaf_Midrib',[base+axis*(length*t)+normal*(.046*math.sin(math.pi*t)+.001) for t in [.04,.2,.4,.6,.8,.96]],.0012,vein)
    stroke('Plant_Leaf_Stalk',[(0,0,base.z-.055),base],.008,stem)

for i,(angle,height,tilt,length,width) in enumerate([
    (-25,.60,.32,.41,.15),(205,.68,.40,.42,.16),(35,.77,.48,.43,.16),
    (155,.83,.53,.43,.16),(-70,.90,.62,.40,.15),(112,.96,.80,.39,.145),(35,.99,1.7,.35,.14)]):
    a=math.radians(angle);base=(.06*math.cos(a),.06*math.sin(a),height)
    leaf(i,base,(math.cos(a),math.sin(a),tilt),length,width)
for obj in list(bpy.context.scene.objects):
    if obj.type=='CURVE':
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-cozy-plant.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-cozy-plant.glb'),export_format='GLB')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
box('Ground',(200,200,.01),(0,0,-.015),material('Ground',(.60,.61,.63)),0)
bpy.ops.object.light_add(type='AREA',location=(-3,-4,5));bpy.context.object.data.energy=400;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(2,-3,2));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.68))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=1.75;scene.camera=camera
scene.render.resolution_x=1000;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'plant-preview.png');bpy.ops.render.render(write_still=True)
