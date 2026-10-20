import bpy,numpy as np,json,hashlib
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-base-face-v2/Anna-clean-face.blend'));reference=np.array([v.co[:] for v in bpy.data.objects['Anna_BaseBody'].data.vertices])
def face_hash():
 a=bpy.data.materials['Anna_Face_CalmSmile'];im=next(n.image for n in a.node_tree.nodes if n.type=='TEX_IMAGE');return hashlib.sha256(np.array(im.pixels[:],dtype=np.float32).tobytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-base-face-v3/Anna-clean-face.blend'));o=bpy.data.objects['Anna_BaseBody'];old=np.array([v.co[:] for v in o.data.vertices]);leaf=set(i for p in o.data.polygons if p.material_index==1 for i in p.vertices);mask=np.zeros(len(old),dtype=bool);mask[list(leaf)]=True;face=face_hash();topology=[tuple(p.vertices) for p in o.data.polygons]
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-clean-face.blend'));o=bpy.data.objects['Anna_BaseBody'];s=bpy.context.scene;new=np.array([v.co[:] for v in o.data.vertices]);outside=~mask|(reference[:,0]<=.305);report={'outside_tip_positions_identical':bool(np.array_equal(old[outside],new[outside])),'face_texture_identical':face==face_hash(),'topology_identical':topology==[tuple(p.vertices) for p in o.data.polygons],'finite_vertices':bool(np.isfinite(new).all())}
assert all(report.values()),report
bpy.data.objects.remove(o,do_unlink=True);bpy.ops.import_scene.gltf(filepath=str(P/'Anna-clean-face.glb'));o=next(o for o in bpy.context.selected_objects if o.type=='MESH');report['normals_exported']=o.data.has_custom_normals
cam=s.camera
for name,delta in [('reimport-tip-front',(0,-4,.15)),('reimport-tip-back',(0,4,.15))]:
 t=Vector((.365,0,.895));cam.location=t+Vector(delta);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=.21;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
(P/'reimport-validation.json').write_text(json.dumps(report,indent=2));print('TIP_REIMPORT_VERIFIED',report)
