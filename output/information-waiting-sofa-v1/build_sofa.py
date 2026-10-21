"""Two-seat wooden sage sofa with cream and gingham throw pillows."""
import bpy
import math
import json
import sys
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box

def soft_cushion(name,size,loc,mat,power=.47):
    # Superellipsoid: a gently domed center with continuously rounded edges.
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=40,radius=1,location=loc)
    obj=bpy.context.object;obj.name=name
    for vertex in obj.data.vertices:
        vertex.co=Vector([math.copysign(abs(c)**power,c)*size[i]/2
                          for i,c in enumerate(vertex.co)])
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:polygon.use_smooth=True
    return obj

bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('Sofa_Honey_Wood',(.56,.35,.16))
sage=material('Sofa_Sage_Upholstery',(.32,.43,.23),.98)
cream=material('Sofa_Cream_Linen',(.88,.82,.64),1)
gingham=material('Sofa_Sage_Gingham',(.70,.73,.52),1)
# Soft gingham generated in local coordinates, embedded as material nodes.
nodes=gingham.node_tree.nodes;links=gingham.node_tree.links
tex=nodes.new('ShaderNodeTexCoord')
sep=nodes.new('ShaderNodeSeparateXYZ');links.new(tex.outputs['Generated'],sep.inputs[0])
bands=[]
for axis in ['X','Z']:
    mul=nodes.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=8
    links.new(sep.outputs[axis],mul.inputs[0])
    ping=nodes.new('ShaderNodeMath');ping.operation='PINGPONG';ping.inputs[1].default_value=1
    links.new(mul.outputs[0],ping.inputs[0])
    step=nodes.new('ShaderNodeMath');step.operation='GREATER_THAN';step.inputs[1].default_value=.5
    links.new(ping.outputs[0],step.inputs[0]);bands.append(step)
add=nodes.new('ShaderNodeMath');add.operation='ADD'
for i,band in enumerate(bands):links.new(band.outputs[0],add.inputs[i])
scale=nodes.new('ShaderNodeMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=.5
links.new(add.outputs[0],scale.inputs[0])
ramp=nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].color=(.88,.82,.64,1)
ramp.color_ramp.elements[1].color=(.42,.52,.30,1)
links.new(scale.outputs[0],ramp.inputs[0]);links.new(ramp.outputs[0],nodes.get('Principled BSDF').inputs['Base Color'])

box('Sofa_Wood_Seat_Base',(1.94,.78,.12),(0,0,.36),wood,.035)
for x in [-.86,.86]:
    for y in [-.29,.29]:
        box('Sofa_Foot',(.105,.105,.36),(x,y,.18),wood,.023)
    box('Sofa_Armrest',(.13,.85,.09),(x,0,.68),wood,.035)
    # Bury the post top inside the rail so rounded end faces cannot leave a gap.
    box('Sofa_Back_Post',(.10,.10,.91),(x,.325,.665),wood,.016)
    box('Sofa_Front_Arm_Post',(.09,.09,.32),(x,-.29,.52),wood,.020)
box('Wood_Back_Frame',(1.66,.10,.68),(0,.33,.75),wood,.025)
box('Wood_Back_Top_Rail',(1.94,.12,.075),(0,.33,1.105),wood,.025)
for x in [-.4225,.4225]:
    soft_cushion('Seat_Cushion',(.835,.70,.19),(x,-.025,.515),sage,.42)
    back=soft_cushion('Back_Cushion',(.835,.23,.57),(x,.23,.845),sage,.46)
    back.rotation_euler.x=math.radians(-7)
for name,x,z,mat,tilt in [('Gingham_Pillow',-.52,.78,gingham,-13),('Cream_Pillow',.55,.75,cream,15)]:
    obj=soft_cushion(name,(.35,.22,.36),(x,-.015,z+.025),mat,.61)
    obj.rotation_euler=(math.radians(-14),math.radians(tilt),0)
    # Bake the procedural gingham for portable GLB rendering below.

# Bake only the plaid pillow's Base Color into an embedded texture.
plaid=bpy.data.objects['Gingham_Pillow']
bpy.ops.object.select_all(action='DESELECT');plaid.select_set(True);bpy.context.view_layer.objects.active=plaid
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.025);bpy.ops.object.mode_set(mode='OBJECT')
image=bpy.data.images.new('Sofa_Gingham_BaseColor',width=512,height=512)
target=nodes.new('ShaderNodeTexImage');target.image=image;nodes.active=target
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16
scene.render.bake.use_pass_direct=False;scene.render.bake.use_pass_indirect=False;scene.render.bake.use_pass_color=True
bpy.ops.object.bake(type='DIFFUSE')
image.filepath_raw=str(ROOT/'gingham-basecolor.png');image.file_format='PNG';image.save();image.pack()
for link in list(nodes.get('Principled BSDF').inputs['Base Color'].links):links.remove(link)
links.new(target.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])

root=bpy.data.objects.new('Information_Waiting_Sofa',None);bpy.context.collection.objects.link(root)
for obj in list(scene.objects):
    if obj!=root:obj.parent=root
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Waiting-sage-sofa.glb'),export_format='GLB',use_selection=True)
scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1200;scene.render.resolution_y=1000
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.72,.76,.80,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
box('Preview_Floor',(200,200,.01),(0,0,-.015),material('Preview_Wood',(.60,.40,.21)),0)
for loc,power,size in [((-3,-4,6),350,5),((4,1,5),200,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,.5))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(3,-5,3))
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.8
cam.rotation_euler=(Vector((0,0,.55))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
scene.render.filepath=str(ROOT/'sofa.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Waiting-sage-sofa.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'Independent sofa model; placement/game pending',
    'width':1.99,'depth_approx':.86,'height':1.145,'seat_surface':.61,
    'features':['wood frame','two sage seats and backs','cream pillow','baked gingham pillow'],
    'units':'temporary office units','game_changed':False},indent=2),encoding='utf-8')
