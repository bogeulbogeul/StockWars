import bpy,math
from pathlib import Path
from mathutils import Vector
p=Path('C:/GitHub/StockWars/output/anna-vest-fit-v1')
bpy.ops.wm.open_mainfile(filepath=str(p/'Anna-vest-fit.blend'))
o=bpy.data.objects['Anna_Vest'];bpy.context.view_layer.objects.active=o;o.select_set(True)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
keys=[(-.70,.255,.15,.13),(-.60,.27,.28,.19),(-.50,.305,.325,.225),(-.40,.30,.32,.22),(-.30,.265,.28,.185),(-.20,.225,.22,.16),(-.09,.20,.18,.16)]
for v in o.data.vertices:
 z=v.co.z+o.location.z
 for a,b in zip(keys,keys[1:]):
  if a[0]<=z<=b[0]:break
 t=max(0,min(1,(z-a[0])/(b[0]-a[0])));rx,rf,rb=[a[i]*(1-t)+b[i]*t for i in [1,2,3]]
 x=v.co.x;y=v.co.y+o.location.y;angle=math.atan2(y,x);dy=rf if y<0 else rb
 radius=1/math.sqrt((math.cos(angle)/rx)**2+(math.sin(angle)/dy)**2)
 r=math.hypot(x,y);new=radius+.023+.12*r
 v.co.x=new*math.cos(angle);v.co.y=new*math.sin(angle)-o.location.y
s=bpy.context.scene;cam=s.camera
for name,pos in [('front',(0,-4,.25)),('side',(4,0,.25)),('back',(0,4,.25))]:
 target=Vector((0,0,0));cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(p/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(p/'Anna-vest-fit.blend'))
bpy.ops.object.select_all(action='DESELECT')
for ob in bpy.data.objects:
 if ob.type=='MESH':ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(p/'Anna-vest-fit.glb'),export_format='GLB',use_selection=True)
