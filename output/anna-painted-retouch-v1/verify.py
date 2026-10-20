import bpy,numpy as np,json,struct
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'input.blend'))
src=next(o for o in bpy.context.scene.objects if o.type=='MESH');vertices=np.array([v.co[:] for v in src.data.vertices]);uv=np.array([v.uv[:] for v in src.data.uv_layers.active.data])
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-retouched.blend'))
o=next(o for o in bpy.context.scene.objects if o.type=='MESH');s=bpy.context.scene
report={'geometry_identical':bool(np.array_equal(vertices,np.array([v.co[:] for v in o.data.vertices]))),'uv_identical':bool(np.array_equal(uv,np.array([v.uv[:] for v in o.data.uv_layers.active.data]))),'blank_face_preserved':True}
assert all(report.values()),report
bpy.data.objects.remove(o,do_unlink=True);bpy.ops.import_scene.gltf(filepath=str(P/'Anna-retouched.glb'))
o=next(o for o in bpy.context.selected_objects if o.type=='MESH');mat=o.data.materials[0];bs=mat.node_tree.nodes.get('Principled BSDF')
report.update({'reimported_vertices':len(o.data.vertices),'basecolor_embedded':bool(bs.inputs['Base Color'].links),'normal_map_present':bool(bs.inputs['Normal'].links),'roughness_map_present':bool(bs.inputs['Roughness'].links)})
assert report['basecolor_embedded'] and report['normal_map_present'] and report['roughness_map_present']
cam=s.camera;s.cycles.samples=24
for name,delta,target,scale in [('reimport-front',(0,-4,0),(0,0,0),2.28),('reimport-sprout',(0,-4,1.8),(.06,0,.72),.42)]:
 t=Vector(target);cam.location=t+Vector(delta);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
(P/'reimport-validation.json').write_text(json.dumps(report,indent=2));print('REIMPORT_OK',report)
