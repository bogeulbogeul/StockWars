import bpy,numpy as np,json,sys
from pathlib import Path
P=Path(__file__).resolve().parent;S=P.parent/'anna-model-v1'
sys.path.insert(0,str(P));from glb_colors import clean_face_colors
bpy.ops.wm.open_mainfile(filepath=str(S/'Anna-rigged.blend'))
old=bpy.data.objects['Anna_Body'];vertices=np.array([v.co[:] for v in old.data.vertices]);weights=[[(g.group,g.weight) for g in v.groups] for v in old.data.vertices];bones=[(b.name,list(b.head_local),list(b.tail_local)) for b in bpy.data.objects['Anna_Rig'].data.bones]
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-rigged.blend'))
o=bpy.data.objects['Anna_Body'];rig=bpy.data.objects['Anna_Rig'];s=bpy.context.scene
report={'geometry_identical':bool(np.array_equal(vertices,np.array([v.co[:] for v in o.data.vertices]))),'weights_identical':weights==[[(g.group,g.weight) for g in v.groups] for v in o.data.vertices],'bones_identical':bones==[(b.name,list(b.head_local),list(b.tail_local)) for b in rig.data.bones]}
assert all(report.values()),report
# Encode the existing linear face colors correctly for glTF's sRGB textures.
face=bpy.data.materials['Anna_Face'];tex=next(n for n in face.node_tree.nodes if n.type=='TEX_IMAGE');old_image=tex.image
if old_image.name!='Anna_Face_Encoded_sRGB':
 pixels=np.array(old_image.pixels[:]).reshape(-1,4);rgb=pixels[:,:3];pixels[:,:3]=np.where(rgb<=.0031308,rgb*12.92,1.055*np.maximum(rgb,0)**(1/2.4)-.055)
 im=bpy.data.images.new('Anna_Face_Encoded_sRGB',width=old_image.size[0],height=old_image.size[1],alpha=True);im.colorspace_settings.name='sRGB';im.pixels.foreach_set(pixels.astype(np.float32).ravel());im.filepath_raw=str(P/'face-basecolor.png');im.file_format='PNG';im.save();im.pack();tex.image=im
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-rigged.blend'))
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-rigged.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=False,export_cameras=False,export_lights=False,export_all_vertex_colors=False)
clean_face_colors(P/'Anna-rigged.glb')
# Replace character with exported asset while keeping inspection cameras/lights.
bpy.data.objects.remove(o,do_unlink=True);bpy.data.objects.remove(rig,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(P/'Anna-rigged.glb'))
o=next(o for o in bpy.context.selected_objects if o.type=='MESH');rig=next(o for o in bpy.context.selected_objects if o.type=='ARMATURE')
report.update({'reimport_bones':len(rig.data.bones),'all_vertices_weighted':all(v.groups for v in o.data.vertices),'surface_colors_present':len(o.data.color_attributes)>0})
assert report['reimport_bones']==7 and report['all_vertices_weighted'] and report['surface_colors_present'],report
cam=s.camera;cam.location=(0,-5,0);cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/'reimport-front.png');bpy.ops.render.render(write_still=True)
(P/'validation.json').write_text(json.dumps(report,indent=2));print('VERIFIED',report)

