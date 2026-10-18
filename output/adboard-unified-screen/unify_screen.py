"""Add one uninterrupted, UV-mapped advertising surface within the existing bezel."""
import bpy,pathlib,json
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'AdBoard.blend'))
body=next(o for o in bpy.context.scene.objects if o.type=='MESH'); body.name='AdBoardBody'
# Measured from original screen polygons; a small front offset prevents z-fighting.
left,right,bottom,top,depth=-.684,.684,-.194,.380,-.081
mesh=bpy.data.meshes.new('AdScreenMesh')
mesh.from_pydata([(left,depth,bottom),(right,depth,bottom),(right,depth,top),(left,depth,top)],[],[(0,1,2,3)])
mesh.update(); screen=bpy.data.objects.new('AdScreen',mesh); bpy.context.collection.objects.link(screen)
uv=mesh.uv_layers.new(name='UVMap')
for index,value in enumerate([(0,0),(1,0),(1,1),(0,1)]): uv.data[index].uv=value
screen['role']='advertising_display'; screen['textureAspectRatio']=(right-left)/(top-bottom)
screen['description']='Single seamless display. Replace AdScreenMaterial base-color texture with an image or video.'
material=bpy.data.materials.new('AdScreenMaterial'); material.use_nodes=True
material.node_tree.nodes.clear(); nodes=material.node_tree.nodes; links=material.node_tree.links
output=nodes.new('ShaderNodeOutputMaterial'); background=nodes.new('ShaderNodeBackground')
texture=nodes.new('ShaderNodeTexImage'); texture.name='AdvertisementTexture'
blank=bpy.data.images.new('AdScreenBlank',width=8,height=8,alpha=False)
blank.generated_color=(.014,.019,.023,1); blank.filepath_raw=str(ROOT/'AdScreen-blank.png'); blank.file_format='PNG'; blank.save()
texture.image=blank; links.new(texture.outputs['Color'],background.inputs['Color']); links.new(background.outputs[0],output.inputs['Surface'])
mesh.materials.append(material)
scene=bpy.context.scene
bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); screen.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'AdBoard-unified.glb'),export_format='GLB',use_selection=True,export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'AdBoard-unified.blend'))
scene.render.filepath=str(ROOT/'AdBoard-after.png'); bpy.ops.render.render(write_still=True)
original_camera=scene.camera.location.copy(); original_rotation=scene.camera.rotation_euler.copy()
grid=bpy.data.images.new('AdScreenUVTest',width=1440,height=604,alpha=False); grid.generated_type='COLOR_GRID'
grid.filepath_raw=str(ROOT/'AdScreen-uv-test.png'); grid.file_format='PNG'; grid.save(); texture.image=grid
scene.render.filepath=str(ROOT/'AdBoard-ad-test.png'); bpy.ops.render.render(write_still=True)
scene.camera.location=Vector((0,-3,.093)); scene.camera.rotation_euler=(Vector((0,0,.093))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.camera.data.ortho_scale=2.25; scene.render.filepath=str(ROOT/'AdBoard-test-front.png'); bpy.ops.render.render(write_still=True)
texture.image=blank
metadata={'screenMesh':'AdScreen','screenMaterial':'AdScreenMaterial','uv':'full 0..1, one quad / two glTF triangles','width':right-left,'height':top-bottom,'aspectRatio':(right-left)/(top-bottom),'recommendedImageSize':[1440,604],'unlit':True,'originalBodyPreserved':True,'note':'New opaque display covers original split surface inside existing bezel; advertising playback is not implemented.'}
(ROOT/'screen-info.json').write_text(json.dumps(metadata,indent=2))
