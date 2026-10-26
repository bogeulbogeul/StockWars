"""Remove the protruding timber threshold; retain the stone landing."""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-door-polish-v5'/'VivianStore-door-polish.blend'))
obj=bpy.data.objects['Door_Flush_Threshold'];bpy.data.objects.remove(obj,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.type in ('MESH','CURVE','EMPTY') and not obj.get('preview_only',False) and not obj.name.startswith('Preview_'):obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'VivianStore-clean.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;cam=scene.camera;scene.cycles.samples=24
cam.location=(.8,-4,1.6);cam.data.ortho_scale=1.6
cam.rotation_euler=(Vector((0,-.98,.57))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'door-detail.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'VivianStore-flush-entry.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'removed':'Door_Flush_Threshold','sha256':hashlib.sha256((ROOT/'VivianStore-clean.glb').read_bytes()).hexdigest()},indent=2))
