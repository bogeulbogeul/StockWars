import bpy
import sys
import math
from pathlib import Path
from mathutils import Vector,Matrix
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import stroke,material,box
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-cozy-plant-v2';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'output/cipher-cozy-plant-v1/Cipher-cozy-plant.blend'))
for obj in list(bpy.context.scene.objects):
    if obj.name.startswith('Plant_'):bpy.data.objects.remove(obj,do_unlink=True)
greens=[material('Plump_Leaf_Green',(.16,.32,.11)),material('Plump_Leaf_Light',(.23,.39,.14)),material('Plump_Leaf_Deep',(.10,.25,.085))]
stem=material('Plump_Stem',(.11,.23,.07))
stroke('Plant_Central_Stem',[(0,0,.385),(0,0,.70),(.015,.01,.91),(.02,0,1.005)],.013,stem)
specs=[(-25,.54,.40,.39,.135),(205,.57,.48,.39,.14),(-80,.64,.65,.36,.145),
    (30,.70,.55,.41,.15),(155,.73,.62,.41,.15),(-55,.82,.65,.37,.145),
    (210,.87,.85,.36,.14),(65,.92,1.0,.35,.14),(150,.98,1.5,.32,.13),(-25,1.005,2.2,.30,.13)]
for i,(angle,height,tilt,length,width) in enumerate(specs):
    a=math.radians(angle);axis=Vector((math.cos(a),math.sin(a),tilt)).normalized()
    base=Vector((.025*math.cos(a),.025*math.sin(a),height))
    # Each full-volume oval leaf presents a broad face, rather than a thin blade edge.
    face=Vector((0,-1,.5));face=(face-axis*face.dot(axis)).normalized()
    side=face.cross(axis).normalized()
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=base+axis*length*.48)
    leaf=bpy.context.object;leaf.name=f'Plant_Plump_Oval_Leaf_{i}'
    for vertex in leaf.data.vertices:
        p=vertex.co.copy()
        vertex.co=(p.x*width,p.y*.046-.012*(1-p.z*p.z),p.z*length/2)
    leaf.rotation_mode='QUATERNION';leaf.rotation_quaternion=Matrix((side,face,axis)).transposed().to_quaternion()
    leaf.data.materials.append(greens[i%3])
    for polygon in leaf.data.polygons:polygon.use_smooth=True
    stroke('Plant_Hidden_Leaf_Stalk',[(0,0,height-.035),base+axis*.045],.009,stem)
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
