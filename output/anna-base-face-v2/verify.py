import bpy,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-clean-face.blend'));s=bpy.context.scene;o=bpy.data.objects['Anna_BaseBody'];bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(P/'Anna-clean-face.glb'));o=next(o for o in bpy.context.selected_objects if o.type=='MESH')
report={}
for a in o.data.materials:
 bs=a.node_tree.nodes.get('Principled BSDF');report[a.name.split('.')[0]]={'normal':bool(bs.inputs['Normal'].links),'basecolor_texture':bool(bs.inputs['Base Color'].links)}
assert report['Anna_Clean_Olive']['normal'] and not report['Anna_Clean_Cream']['normal'] and not report['Anna_Face_CalmSmile']['normal'] and report['Anna_Face_CalmSmile']['basecolor_texture']
cam=s.camera;t=Vector((.19,0,.80));cam.location=t+Vector((0,-4,1));cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=.65;s.render.filepath=str(P/'reimport-sprout.png');bpy.ops.render.render(write_still=True)
(P/'reimport-validation.json').write_text(json.dumps(report,indent=2));print('LEAF_ONLY_NORMAL_VERIFIED',report)
