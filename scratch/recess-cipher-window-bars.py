import bpy
from pathlib import Path
from mathutils import Vector

root = Path('C:/GitHub/StockWars')
for folder, stem in [('cipher-exterior-blender-v1','CipherSecurities-exterior'),
                     ('cipher-exterior-clock-v1','CipherSecurities-clock')]:
    out = root/'output'/folder
    bpy.ops.wm.open_mainfile(filepath=str(out/f'{stem}.blend'))
    bars = [o for o in bpy.context.scene.objects if o.name.startswith('Window_Cross_')]
    assert len(bars) == 4, [o.name for o in bars]
    for bar in bars:
        bar.location.y = -.939 if 'Horizontal' in bar.name else -.936
    bpy.ops.wm.save_as_mainfile(filepath=str(out/f'{stem}.blend'))
    bpy.ops.export_scene.gltf(filepath=str(out/f'{stem}.glb'), export_format='GLB',
        export_animations=True, export_animation_mode='SCENE', export_frame_range=True)

scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.8,.84,.9,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
bpy.ops.object.light_add(type='AREA',location=(-3,-4,6))
bpy.context.object.data.energy=350
bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(-1.5,-3.5,1.3))
camera=bpy.context.object
camera.rotation_euler=(Vector((-.77,-.93,.65))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'
camera.data.ortho_scale=.85
scene.camera=camera
scene.render.resolution_x=850
scene.render.resolution_y=850
scene.render.resolution_percentage=100
scene.render.filepath=str(root/'output/cipher-exterior-clock-v1/window-recessed.png')
bpy.ops.render.render(write_still=True)
