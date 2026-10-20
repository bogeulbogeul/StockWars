"""Three binders plus a scaled version of the accepted cream/blue plant."""
import bpy,math,sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import material,box,disk
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-cabinet-decor-v1';out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
cream=material('Binder_Ivory_Labels',(.92,.865,.75));paper=material('Binder_Paper',(.82,.81,.75))
colors=[material('Binder_Navy',(.045,.11,.18)),material('Binder_Blue',(.065,.16,.25)),material('Binder_Slate',(.13,.23,.31))]
hole=material('Binder_Finger_Hole',(.025,.065,.10))
for index,(x,lean) in enumerate([(-.52,-.025),(-.38,.015),(-.24,-.035)]):
    group=bpy.data.objects.new(f'Binder_{index+1}',None);bpy.context.collection.objects.link(group)
    before=set(bpy.context.scene.objects)
    box('Binder_Page_Block',(.103,.27,.385),(0,.025,.205),paper,.004)
    for side in [-1,1]:box('Binder_Blue_Cover',(.009,.31,.43),(side*.0595,.02,.215),colors[index],.004)
    box('Binder_Spine',(.128,.024,.43),(0,-.13,.215),colors[index],.005)
    box('Binder_Blank_Label',(.052,.003,.068),(0,-.144,.305),cream,.003)
    disk('Binder_Hole_Rim',0,-.147,.105,.013,.004,cream)
    disk('Binder_Dark_Hole',0,-.150,.105,.008,.002,hole)
    for obj in set(bpy.context.scene.objects)-before:obj.parent=group
    group.location=(x,0,0);group.rotation_euler.y=lean
    bpy.context.view_layer.update()
    points=[obj.matrix_world@v.co for obj in group.children if obj.type=='MESH' for v in obj.data.vertices]
    group.location.z-=min(p.z for p in points)
# Reuse the accepted potted plant at a tabletop size, preserving recessed soil.
bpy.ops.import_scene.gltf(filepath=str(root/'output/cipher-cozy-plant-v2/Cipher-cozy-plant.glb'))
plant=bpy.data.objects.new('Small_Cabinet_Plant',None);bpy.context.collection.objects.link(plant)
for obj in list(bpy.context.selected_objects):
    if obj.parent is None:obj.parent=plant
plant.scale=(.40,)*3;plant.location=(.40,.03,0)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-cabinet-decor.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-cabinet-decor.glb'),export_format='GLB')
# Cabinet is preview context only. Exported decor origin rests on its top.
bpy.ops.import_scene.gltf(filepath=str(root/'output/cipher-training-cabinet-v4/Cipher-training-cabinet.glb'))
for obj in list(bpy.context.selected_objects):
    if obj.parent is None:obj.location.z-=.83
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
box('Studio',(200,200,.01),(0,0,-.845),material('Studio',(.60,.61,.63)),0)
bpy.ops.object.light_add(type='AREA',location=(-3,-4,5));bpy.context.object.data.energy=400;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(2.2,-3.6,2.1));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,-.16))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.2;scene.camera=camera
scene.render.resolution_x=1200;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'cabinet-decor-preview.png');bpy.ops.render.render(write_still=True)
