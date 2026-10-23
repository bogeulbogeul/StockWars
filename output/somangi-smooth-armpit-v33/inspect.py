import bpy,sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
p=Path(__file__).resolve().parent;bpy.ops.wm.open_mainfile(filepath=str(p/'somangi-eat.blend'));s=bpy.context.scene;s.frame_set(34);ob=bpy.data.objects['Somangi_SmoothBody'];ev=ob.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();tree=BVHTree.FromPolygons([v.co for v in m.vertices],[list(f.vertices) for f in m.polygons])
for y,z in [(0,-.35),(.01,-.35),(.03,-.31),(-.02,-.4),(.05,-.25)]:
 hit,n,i,d=tree.ray_cast(Vector((3,y,z)),Vector((-1,0,0)));f=m.polygons[i];print('HIT',y,z,hit[:],n[:],i,f.material_index,[(ob.vertex_groups[g.group].name,g.weight) for g in ob.data.vertices[f.vertices[0]].groups]);mat=m.materials[f.material_index];print('MAT',mat.name)
for mat in m.materials:
 print('MATERIAL',mat.name)
 for node in mat.node_tree.nodes:
  if node.type=='BSDF_PRINCIPLED':print('SHADER',[(k,node.inputs[k].default_value[: ] if k=='Base Color' else node.inputs[k].default_value,[(l.from_node.name,l.from_socket.name) for l in node.inputs[k].links]) for k in ['Base Color','Roughness','Metallic','Normal'] if k!='Normal'])
  if node.type=='TEX_IMAGE':print('IMAGE',node.name,node.image.name,node.image.size[:])
