import bpy
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-retouched.blend'))
for o in list(bpy.context.scene.objects):
 if o.type=='MESH':bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(P/'Anna-retouched.glb'))
s=bpy.context.scene;cam=s.camera;s.cycles.samples=24;cam.data.ortho_scale=2.28
target=Vector((0,0,-.001))
for name,loc in [('side-facing-left',(4,0,-.001)),('side-facing-right',(-4,0,-.001))]:
 cam.location=loc;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
