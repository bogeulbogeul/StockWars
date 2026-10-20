import bpy,sys,math
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import material,box
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-training-computers-v1'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
dark=material('Graphite_Frame',(.045,.065,.08),.8);keys=material('Keyboard_Keycaps',(.10,.13,.16),.95)
blue=material('Monitor_Stand',(.065,.13,.19),.85)
for side,file in [(-1,'monitor-chart.png'),(1,'monitor-analysis.png')]:
    label='Left' if side<0 else 'Right'
    group=bpy.data.objects.new('Monitor_'+label,None);bpy.context.collection.objects.link(group)
    group.location=(side*.55,.16,0);group.rotation_euler.z=-side*.12
    def part(name,size,loc,mat,bevel):
        obj=box(label+'_'+name,size,loc,mat,bevel);obj.parent=group;return obj
    part('Stand_Base',(.34,.25,.035),(0,.02,.0175),blue,.014)
    part('Stand_Post',(.065,.065,.25),(0,.025,.155),blue,.018)
    part('Monitor_Frame',(1.045,.065,.65),(0,0,.55),dark,.025)
    screen=material(label+'_Display',(1,1,1),1)
    image=bpy.data.images.load(str(out/file));image.pack()
    texture=screen.node_tree.nodes.new('ShaderNodeTexImage');texture.image=image
    shader=screen.node_tree.nodes['Principled BSDF']
    screen.node_tree.links.new(texture.outputs['Color'],shader.inputs['Base Color'])
    screen.node_tree.links.new(texture.outputs['Color'],shader.inputs['Emission Color']);shader.inputs['Emission Strength'].default_value=.18
    mesh=bpy.data.meshes.new(label+'_Display_Surface')
    mesh.from_pydata([(-.485,-.034,.27),(.485,-.034,.27),(.485,-.034,.83),(-.485,-.034,.83)],[],[(0,1,2,3)])
    uv=mesh.uv_layers.new()
    for i,coord in enumerate([(0,0),(1,0),(1,1),(0,1)]):uv.data[i].uv=coord
    obj=bpy.data.objects.new(label+'_Display',mesh);bpy.context.collection.objects.link(obj);obj.parent=group;mesh.materials.append(screen)
box('Keyboard_Base',(.94,.30,.028),(-.14,-.32,.014),dark,.013)
for row in range(4):
    for col in range(14):
        box('Keyboard_Key',(.051,.043,.009),(-.563+col*.064,-.414+row*.058,.032),keys,.003)
box('Keyboard_Spacebar',(.30,.035,.009),(-.17,-.448,.032),keys,.003)
bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=(.57,-.32,.039))
mouse=bpy.context.object;mouse.name='Mouse';mouse.scale=(.075,.115,.039)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);mouse.data.materials.append(dark)
for face in mouse.data.polygons:face.use_smooth=True
box('Mouse_Wheel',(.012,.032,.007),(.57,-.29,.078),keys,.003)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-training-computers.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-training-computers.glb'),export_format='GLB')
# Desk below is preview context only, not part of the exported computer set.
bpy.ops.import_scene.gltf(filepath=str(root/'output/cipher-training-desk-v2/Cipher-training-desk.glb'))
for obj in bpy.context.selected_objects:
    if obj.parent is None:obj.location.z-=.72
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
box('Studio_Ground',(200,200,.01),(0,0,-.735),material('Studio',(.6,.61,.63)),0)
bpy.ops.object.light_add(type='AREA',location=(-3,-4,6));bpy.context.object.data.energy=450;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(2.6,-5,2.8));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.05))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=3.5;scene.camera=camera
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'computer-set-preview.png');bpy.ops.render.render(write_still=True)
