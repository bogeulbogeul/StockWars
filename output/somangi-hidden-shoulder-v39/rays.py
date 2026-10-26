import bpy,json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));b=bpy.data.objects['Somangi_SmoothBody'];bpy.context.scene.frame_set(49,subframe=.75);ev=b.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();faces=[list(f.vertices) for f in m.polygons];tree=BVHTree.FromPolygons([v.co for v in m.vertices],faces)
for z in [-.11,-.14,-.17,-.20,-.25,-.3]:
 for y in [-.05,.0,.05]:
  start=Vector((-6,y,z));hits=[]
  for k in range(6):
   p,n,i,d=tree.ray_cast(start,Vector((1,0,0)))
   if p is None:break
   hits.append([round(p.x,6),m.polygons[i].material_index,i]);start=p+Vector((.000002,0,0))
  print('RAY',y,z,hits)
