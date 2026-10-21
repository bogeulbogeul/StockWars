import bpy,bmesh,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-meshy-short-vest-v1/Anna-meshy-short-vest.blend'))
o=bpy.data.objects['Anna_Vest'];bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001);print('TOPOLOGY',sum(e.is_boundary for e in bm.edges),sum(not e.is_manifold for e in bm.edges));bm.free()
for ob in bpy.data.objects:
 if ob.type=='MESH' and ob!=o:ob.hide_render=True
s=bpy.context.scene;s.render.resolution_x=700;s.render.resolution_y=700;target=Vector((0,0,-.2));cam=s.camera;cam.location=(0,-4,-.1);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=1.25;s.render.filepath=str(P/'vest-only.png');bpy.ops.render.render(write_still=True)
