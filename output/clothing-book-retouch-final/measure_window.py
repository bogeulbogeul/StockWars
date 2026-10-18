import bpy,pathlib
from mathutils import Vector
root=pathlib.Path('C:/GitHub/StockWars/output/clothing-book-retouch-final')
bpy.ops.wm.open_mainfile(filepath=str(root/'ClothingStore.blend'))
for o in list(bpy.context.scene.objects):
 if o.type=='MESH': bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(root/'ClothingStore-retouched.glb'))
s=bpy.context.scene; target=Vector((-.52,-.7,-.22)); s.camera.location=target+Vector((.12,-2,.4)); s.camera.rotation_euler=(target-s.camera.location).to_track_quat('-Z','Y').to_euler(); s.camera.data.ortho_scale=.85

for px,py in [(500,730),(700,730),(580,880),(735,890),(550,905),(430,880),(760,850),(500,550)]:
 q=s.camera.rotation_euler.to_quaternion(); origin=s.camera.location+q@Vector(((px/1200-.5)*.85,(.5-py/1200)*.85,0)); direct=q@Vector((0,0,-1))
 hit,loc,norm,face,obj,mat=s.ray_cast(bpy.context.evaluated_depsgraph_get(),origin,direct)
 print('RAY',px,py,hit,list(loc),list(norm),face,flush=True)
