import bpy,math
from pathlib import Path
from mathutils import Vector
p=Path('C:/GitHub/StockWars/output/anna-vest-fit-v2')
bpy.ops.wm.open_mainfile(filepath=str(p/'Anna-vest-fit.blend'))
o=bpy.data.objects['Anna_Vest']
for v in o.data.vertices:
 z=v.co.z;t=max(0,min(1,(z-.15)/.55));t=t*t*(3-2*t)
 v.co.z+=.05/.34*t
 low=max(0,min(1,(-z+.1)/.8));low=low*low*(3-2*low)
 v.co.x*=1-.09*low
 v.co.y*=1-.12*low
s=bpy.context.scene
for name,pos in [('front',(0,-4,.25)),('side',(4,0,.25)),('back',(0,4,.25))]:
 cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(p/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(p/'Anna-vest-fit.blend'))
bpy.ops.object.select_all(action='DESELECT')
for ob in bpy.data.objects:
 if ob.type=='MESH':ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(p/'Anna-vest-fit.glb'),export_format='GLB',use_selection=True)
