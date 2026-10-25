import bpy,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'CipherSecurities-reference.blend'))
scene=bpy.context.scene;cam=scene.camera
cam.data.type='ORTHO';cam.data.ortho_scale=8;cam.location=(6,10,5.5)
cam.rotation_euler=(Vector((0,0,1.3))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.context.view_layer.update();mat=cam.matrix_world.to_3x3();rows=[]
for x,y in [(552,532),(552,535),(552,540),(552,697),(552,701),(560,701),(540,532),(560,532)]:
 origin=cam.location+mat@Vector(((x/1200-.5)*8,(.5-y/900)*6,0))
 hit,loc,normal,index,obj,matrix=scene.ray_cast(bpy.context.evaluated_depsgraph_get(),origin,mat@Vector((0,0,-1)))
 rows.append({'pixel':[x,y],'object':obj.name if obj else None,'point':list(loc),
  'material':obj.data.materials[obj.data.polygons[index].material_index].name if obj else None})
print(json.dumps(rows,indent=2));(ROOT/'rear-rays.json').write_text(json.dumps(rows,indent=2))
