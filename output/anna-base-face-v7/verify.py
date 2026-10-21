import bpy,numpy as np,json,hashlib,bmesh
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
def face_hash():
 a=bpy.data.materials['Anna_Face_CalmSmile'];im=next(n.image for n in a.node_tree.nodes if n.type=='TEX_IMAGE');return hashlib.sha256(np.array(im.pixels[:],dtype=np.float32).tobytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-base-face-v6/Anna-clean-face.blend'));o=bpy.data.objects['Anna_BaseBody'];m=o.data;keep=set(i for p in m.polygons if p.material_index!=1 for i in p.vertices);old=set(tuple(m.vertices[i].co) for i in keep);face=face_hash()
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-clean-face.blend'));body=bpy.data.objects['Anna_BaseBody'];leaf=bpy.data.objects['Anna_PlumpLeaf'];s=bpy.context.scene
bm=bmesh.new();bm.from_mesh(leaf.data);bad=sum(not e.is_manifold for e in bm.edges);bm.free()
report={'body_face_positions_identical':old==set(tuple(v.co) for v in body.data.vertices),'face_texture_identical':face==face_hash(),'leaf_nonmanifold_edges':bad,'leaf_finite':all(all(np.isfinite(v.co)) for v in leaf.data.vertices)}
assert report['body_face_positions_identical'] and report['face_texture_identical'] and bad==0 and report['leaf_finite'],report
bpy.data.objects.remove(body,do_unlink=True);bpy.data.objects.remove(leaf,do_unlink=True);bpy.ops.import_scene.gltf(filepath=str(P/'Anna-clean-face.glb'));report['reimport_mesh_count']=sum(o.type=='MESH' for o in bpy.context.selected_objects);assert report['reimport_mesh_count']==2
cam=s.camera;t=Vector((.19,0,.81));cam.location=t+Vector((0,-4,.5));cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=.70;s.render.resolution_x=800;s.render.resolution_y=800;s.render.filepath=str(P/'reimport-sprout.png');bpy.ops.render.render(write_still=True)
(P/'reimport-validation.json').write_text(json.dumps(report,indent=2));print('PLUMP_LEAF_VERIFIED',report)
