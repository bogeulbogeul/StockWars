import bpy,math,json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
p=Path('C:/GitHub/StockWars/output/anna-vest-fit-v3')
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/anna-vest-fit-v2/Anna-vest-fit.blend')
o=bpy.data.objects['Anna_Vest'];body=bpy.data.objects['Anna_BaseBody'];deps=bpy.context.evaluated_depsgraph_get();tree=BVHTree.FromObject(body,deps)
inv=o.matrix_world.inverted();changed=0
for v in o.data.vertices:
 q=o.matrix_world@v.co;center=Vector((0,-.035,q.z));d=q-center;d.z=0;r=d.length
 if r<.001:continue
 direction=d/r;hit,normal,index,dist=tree.ray_cast(center,direction,1.5)
 if hit is None:continue
 t=max(0,min(1,(-q.z-.13)/.12));t=t*t*(3-2*t)
 gap=r-dist
 if gap>.016:
  q-=direction*((gap-.016)*.78*t);v.co=inv@q;changed+=1
s=bpy.context.scene
for name,pos in [('front',(0,-4,.25)),('side',(4,0,.25)),('back',(0,4,.25))]:
 cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(p/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(p/'Anna-vest-fit.blend'))
bpy.ops.object.select_all(action='DESELECT')
for ob in bpy.data.objects:
 if ob.type=='MESH':ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(p/'Anna-vest-fit.glb'),export_format='GLB',use_selection=True)
print('ADJUSTED_VERTICES',changed)
