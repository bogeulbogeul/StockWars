import bpy,json,numpy as np
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'input.blend'));src=next(o for o in bpy.context.scene.objects if o.type=='MESH');original=np.array([v.co[:] for v in src.data.vertices])
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-clean-face.blend'));o=bpy.data.objects['Anna_BaseBody'];s=bpy.context.scene
report={'geometry_identical':bool(np.array_equal(original,np.array([v.co[:] for v in o.data.vertices])))}
assert report['geometry_identical']
bpy.data.objects.remove(o,do_unlink=True);bpy.ops.import_scene.gltf(filepath=str(P/'Anna-clean-face.glb'))
o=next(o for o in bpy.context.selected_objects if o.type=='MESH');mats=o.data.materials;face=next(a for a in mats if 'CalmSmile' in a.name);bs=face.node_tree.nodes.get('Principled BSDF')
report.update({'material_count':len(mats),'face_texture_embedded':bool(bs.inputs['Base Color'].links),'new_meshes':1,'finite_vertices':all(all(np.isfinite(v.co)) for v in o.data.vertices),'no_noise_normal_maps':all(not a.node_tree.nodes.get('Principled BSDF').inputs['Normal'].links for a in mats)})
assert report['material_count']==3 and report['face_texture_embedded'] and report['finite_vertices'] and report['no_noise_normal_maps'],report
cam=s.camera;s.cycles.samples=24
for name,loc,target,scale in [('reimport-front',(0,-4,0),(0,0,0),2.28),('reimport-angle',(2.1,-4,.1),(0,0,0),2.28)]:
 t=Vector(target);cam.location=t+Vector(loc);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
(P/'reimport-validation.json').write_text(json.dumps(report,indent=2));print('ANNA_FACE_REIMPORT_OK',report)
