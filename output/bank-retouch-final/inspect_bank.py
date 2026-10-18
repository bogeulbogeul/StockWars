import bpy, math, pathlib
from mathutils import Vector
ROOT=pathlib.Path('C:/GitHub/StockWars/output/bank-retouch-final')
NAMES=['BankBuilding']
for name in NAMES:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/'+name+'.glb')
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
    pts=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
    low=Vector(tuple(min(p[i] for p in pts) for i in range(3)))
    high=Vector(tuple(max(p[i] for p in pts) for i in range(3)))
    center=(low+high)/2; span=max(high-low)
    print('BOUNDS',name,list(low),list(high),flush=True)
    scene=bpy.context.scene
    scene.render.engine='BLENDER_EEVEE'
    scene.render.resolution_x=900; scene.render.resolution_y=800; scene.render.resolution_percentage=100
    scene.world=bpy.data.worlds.new('World'); scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(0.8,0.8,0.8,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=0.8
    bpy.ops.object.camera_add(location=center+Vector((span*1.2,-span*2,span*.9)))
    cam=bpy.context.object; cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='ORTHO'; cam.data.ortho_scale=span*1.45; scene.camera=cam
    bpy.ops.object.light_add(type='AREA',location=center+Vector((-span,-span*2,span*3)))
    bpy.context.object.data.energy=span*span*100; bpy.context.object.data.shape='DISK'; bpy.context.object.data.size=span*2
    scene.view_settings.view_transform='Standard'
    scene.render.image_settings.file_format='PNG'; scene.render.filepath=str(ROOT/(name+'-before.png'))
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/(name+'.blend')))
    bpy.ops.render.render(write_still=True)
