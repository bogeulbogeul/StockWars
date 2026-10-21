import bpy
from pathlib import Path
from mathutils import Vector
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-elevator-painted-buttons-v2'
bpy.ops.wm.open_mainfile(filepath=str(root/'output/cipher-cozy-elevator-v1/Cipher-cozy-elevator.blend'))
for obj in list(bpy.context.scene.objects):
    if obj.name.startswith(('Elevator_Call_Up','Elevator_Call_Down')):bpy.data.objects.remove(obj,do_unlink=True)
buttons=sorted([obj for obj in bpy.context.scene.objects if obj.name.startswith('Elevator_Call_Blue_Face')],key=lambda o:o.location.z,reverse=True)
assert len(buttons)==2
for button,label in zip(buttons,['up','down']):
    paint=bpy.data.materials.new(f'Button_Painted_{label}');paint.use_nodes=True
    paint.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.9
    image=bpy.data.images.load(str(out/f'button-{label}.png'));image.pack()
    node=paint.node_tree.nodes.new('ShaderNodeTexImage');node.image=image
    paint.node_tree.links.new(node.outputs['Color'],paint.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
    button.data.materials.append(paint);index=len(button.data.materials)-1
    uv=button.data.uv_layers.active or button.data.uv_layers.new()
    for polygon in button.data.polygons:
        if polygon.normal.z>.9:
            polygon.material_index=index
            for loop in polygon.loop_indices:
                v=button.data.vertices[button.data.loops[loop].vertex_index].co
                uv.data[loop].uv=(v.x/.158+.5,v.y/.158+.5)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-cozy-elevator.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-cozy-elevator.glb'),export_format='GLB')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
bpy.ops.object.light_add(type='AREA',location=(-3,-4,5));bpy.context.object.data.energy=400;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(1.5,-2,1.5));camera=bpy.context.object
camera.rotation_euler=(Vector((1.04,-.06,1.08))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=.62;scene.camera=camera
scene.render.resolution_x=700;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'buttons-preview.png');bpy.ops.render.render(write_still=True)
