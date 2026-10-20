"""Empty decorated room shell matching the user's frontal shop reference."""
import bpy
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import material, box

bpy.ops.wm.read_factory_settings(use_empty=True)
cream=material('Cream_Plaster',(.86,.77,.61))
wood=material('Honey_Wood_Trim',(.48,.27,.11))
coral=material('Coral_Baseboard',(.76,.22,.14))
tile_a=material('Warm_Tile_A',(.78,.68,.52))
tile_b=material('Warm_Tile_B',(.85,.76,.60))
base=material('Floor_Base',(.60,.51,.39))
W,D,H,T=8,6,2.8,.14
box('Floor_Base',(W+2*T,D+2*T,.12),(0,0,-.06),base,.008)
for x in range(8):
    for y in range(6):
        box('Floor_Tile',(.997,.997,.025),(-3.5+x,-2.5+y,.0125),
            tile_a if (x+y)%2 else tile_b,.002)
box('Back_Wall',(W+2*T,T,H),(0,D/2+T/2,H/2),cream,.008)
box('Back_Coral_Baseboard',(W,.055,.46),(0,D/2-.0275,.23),coral,.006)
box('Back_Top_Trim',(W+2*T,.22,.12),(0,D/2+T/2,H-.02),wood,.01)
for sign in [-1,1]:
    x=sign*(W/2+T/2)
    box('Side_Wall',(T,D,H),(x,0,H/2),cream,.008)
    box('Side_Coral_Baseboard',(.055,D,.46),(sign*(W/2-.0275),0,.23),coral,.006)
    box('Side_Top_Trim',(.22,D+.15,.12),(x,0,H-.02),wood,.01)
    for y in [-D/2+.04,D/2-.04]:
        px=sign*(W/2-.07)
        box('Corner_Pillar_Shaft',(.20,.20,H-.22),(px,y,H/2-.04),cream,.012)
        box('Corner_Pillar_Coral_Foot',(.25,.25,.48),(px,y,.24),coral,.009)
        box('Corner_Pillar_Capital',(.29,.29,.15),(px,y,H-.12),wood,.012)
        box('Corner_Pillar_Cap',(.42,.42,.09),(px,y,H+.005),wood,.009)
# Plain narrow exit slopes into black, as in the home entrance reference.
ramp_mat=bpy.data.materials.new('Exit_Gray_Fade')
ramp_mat.use_nodes=True
nodes=ramp_mat.node_tree.nodes
links=ramp_mat.node_tree.links
shader=nodes.get('Principled BSDF')
tex=nodes.new('ShaderNodeTexCoord')
sep=nodes.new('ShaderNodeSeparateXYZ')
fade=nodes.new('ShaderNodeValToRGB')
fade.color_ramp.elements[0].color=(.001,.001,.001,1)
fade.color_ramp.elements[1].color=(.50,.48,.44,1)
links.new(tex.outputs['Generated'],sep.inputs[0])
links.new(sep.outputs['Y'],fade.inputs[0])
links.new(fade.outputs[0],shader.inputs['Base Color'])
mesh=bpy.data.meshes.new('Exit_Ramp')
mesh.from_pydata([(-.48,-3.14,0),(.48,-3.14,0),(.48,-4.1,-.30),(-.48,-4.1,-.30)],[],[(0,3,2,1)])
ramp=bpy.data.objects.new('Home_Style_Exit',mesh)
bpy.context.collection.objects.link(ramp)
ramp.data.materials.append(ramp_mat)
asset=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Room-pillar-shell.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.render.resolution_x=1400
scene.render.resolution_y=1000
scene.world=bpy.data.worlds.new('Black')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=0
for loc,power,size in [((0,-4,9),1400,8),((0,2,7),700,6)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    light=bpy.context.object
    light.data.energy=power
    light.data.size=size
    light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-12,9))
cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='PERSP'
cam.data.lens=38
scene.camera=cam
scene.render.filepath=str(ROOT/'front.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-pillar-shell.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Empty room shell; game not changed',
    'reference':'User shop screenshot with corner pillars and top trim',
    'dimensions':[W,D,H],'units':'Temporary modeling units',
    'features':['4 corner pillars with capitals and feet','Honey wood top trim',
                'Coral baseboards','Square tiled floor','Home-style central exit'],
    'furniture':False,'ceiling_and_front':'Open cutaway for interior view'
},indent=2),encoding='utf-8')
