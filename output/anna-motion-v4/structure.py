import bpy,bmesh,math
from mathutils import Vector

def rebuild(body,rig):
 # Remove only the T-pose arms. The face, abdomen and feet remain original.
 bm=bmesh.new();bm.from_mesh(body.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
 remove=[v for v in bm.verts if abs(v.co.x)>.255 and -.36<v.co.z<-.025]
 bmesh.ops.delete(bm,geom=remove,context='VERTS')
 edges=[e for e in bm.edges if e.is_boundary]
 if edges:
  result=bmesh.ops.holes_fill(bm,edges=edges,sides=0)
  bmesh.ops.triangulate(bm,faces=result.get('faces',[]))
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(body.data);bm.free();body.data.validate();body.data.update()
 body.vertex_groups.clear()
 groups={n:body.vertex_groups.new(name=n) for n in ['Body','Head','Leg.L','Leg.R']}
 def smooth(a,b,v):
  t=max(0,min(1,(v-a)/(b-a)));return t*t*(3-2*t)
 for v in body.data.vertices:
  z=v.co.z;w={'Body':1}
  if z>-.13:
   t=smooth(-.13,-.08,z);w={'Head':t,'Body':1-t}
  elif z<-.70:
   t=smooth(-.70,-.77,z);w={'Leg.L' if v.co.x>0 else 'Leg.R':t,'Body':1-t}
  for n,value in w.items():
   if value>0:groups[n].add([v.index],value,'REPLACE')
 parts=[]
 for side,sign in [('L',1),('R',-1)]:
  bone=rig.data.bones['Arm.'+side];direction=Vector((sign*.60,0,-.80));q=Vector((0,0,1)).rotation_difference(direction)
  bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=32)
  obj=bpy.context.object;obj.name='Anna_RigidArm.'+side
  for v in obj.data.vertices:
   u=v.co.z;v.co.x*=.106*(1+.06*u);v.co.y*=.106*(1+.06*u);v.co.z=.155+.255*u;v.co=bone.head_local+q@v.co
  obj.data.materials.append(bpy.data.materials['Anna_Clean_Cream'])
  for f in obj.data.polygons:f.use_smooth=True
  g=obj.vertex_groups.new(name='Arm.'+side);g.add(list(range(len(obj.data.vertices))),1,'REPLACE')
  obj.parent=rig;mod=obj.modifiers.new('Single rigid arm bone','ARMATURE');mod.object=rig;parts.append(obj)
 return parts
