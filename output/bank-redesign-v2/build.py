"""Bank exterior based on the adopted gold gable concept, native geometry."""
import bpy,bmesh,sys,json,hashlib,math
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
sys.path[:0]=[str(R),str(R.parent/'cipher-exterior-blender-v1')]
from exterior_geometry import box,extrude,finish
import roof
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'bank-exterior-clean-v1/Bank-clean.blend'))
s=bpy.context.scene
for o in list(s.objects):
 if o.name.startswith(('Front_Gable','Rear_Gable','Sealed_Gold_Roof','Wood_Roof_Edge','Broad_Green_Tile','Porch_Cream_Gable','Porch_Wood_Lower_Beam','Porch_Gold_Curved_Edge','Wood_Fascia')):bpy.data.objects.remove(o,do_unlink=True)
def color(name,c):
 m=bpy.data.materials[name];m.diffuse_color=(*c,1);m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c,1);return m
cream=color('Bank_Cream',(.90,.82,.68));stone=color('Bank_Smooth_Base',(.85,.77,.64));wood=color('Bank_Honey_Wood',(.47,.26,.105));gold=color('Bank_Gold_Roof',(.96,.56,.075))
counts=roof.build(gold,wood,cream)
wall=bpy.data.objects['Smooth_Walls_Windowless_Back']
for g in [o for o in s.objects if o.name.startswith('Main_Cream_Side_Gable')]:
 bpy.context.view_layer.objects.active=wall;m=wall.modifiers.new('Continuous_Side_Wall','BOOLEAN');m.operation='UNION';m.solver='EXACT';m.object=g
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(g,do_unlink=True)
# Existing engraved gold sprout medallion, fitted to the new pediment plane.
coin=bpy.data.objects['Coin_Gold_Rim'];coin.location.y-=.163;coin.location.z-=.005;coin.scale*=.90
# Correct cream square columns; retain rounded bases and existing landing.
for o in s.objects:
 if o.name.startswith(('Porch_Post','Door_Cream_Frame')) and o.type=='MESH':
  o.data.materials.clear();o.data.materials.append(cream)
# Four blind panel recesses in the original door leaves.
for leaf in [o for o in s.objects if o.name.startswith('Central_Double_Door_Leaf')]:
 side=-1 if min(v.co.x for v in leaf.data.vertices)<-.1 else 1
 for z,h in [(.36,.24),(.79,.29)]:
  cut=box('Panel_Cut',(.232,.034,h),(side*.166,-.974,z),wood,.008)
  bpy.context.view_layer.objects.active=leaf;m=leaf.modifiers.new('Recessed_Door_Panel','BOOLEAN');m.operation='DIFFERENCE';m.object=cut
  bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cut,do_unlink=True)
  frame=box('Door_Continuous_Panel_Molding',(.245,.016,h+.006),(side*.166,-.967,z),wood,.004)
  tool=box('Panel_Ring_Opening',(.229,.06,h-.004),(side*.166,-.967,z),wood,.004)
  bpy.context.view_layer.objects.active=frame;m=frame.modifiers.new('Panel_Ring','BOOLEAN');m.operation='DIFFERENCE';m.object=tool
  bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(tool,do_unlink=True)
  bpy.context.view_layer.objects.active=leaf;m=leaf.modifiers.new('Seated_Panel_Molding','BOOLEAN');m.operation='UNION';m.object=frame
  bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(frame,do_unlink=True)
 # Lower bevel is seated inside the landing surface.
 for v in leaf.data.vertices:
  if v.co.z<.205:v.co.z-=.026*min(1,max(0,(.205-v.co.z)/.025))
 leaf.data.update()
# Extend both columns and their capitals into the straight header.
for o in s.objects:
 if o.type=='MESH' and o.name.startswith('Porch_Post_Cap'):
  for v in o.data.vertices:
   p=o.matrix_world@v.co
   if p.z>1.28:p.z+=.035;v.co=o.matrix_world.inverted()@p
  o.data.update()
# Remove old arch's separate overlapping jambs and use a continuous ring.
for o in list(s.objects):
 if '_Wood_Frame' in o.name or o.name.startswith('Door_Cream_Frame'):bpy.data.objects.remove(o,do_unlink=True)
def ring(name,cx,r,outer,base,spring,mat,front,back,parent=None):
 def p(rad,bot):return [(cx-rad,bot),(cx+rad,bot),(cx+rad,spring)]+[(cx+rad*math.cos(math.pi*i/64),spring+rad*math.sin(math.pi*i/64)) for i in range(1,65)]
 a=p(outer,base-.012);b=p(r,base);n=len(a);v=[(x,y,z) for y in (front,back) for poly in (a,b) for x,z in poly];f=[]
 for i in range(n):
  j=(i+1)%n;f.extend([(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)])
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],f);bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,mat,.004);o.parent=parent
ring('Door_Continuous_Cream_Arch',0,.33,.40,.154,.78,cream,-1.01,-.92)
for x,name in [(-.99,'Front_Left'),(.99,'Front_Right')]:ring(name+'_Continuous_Window_Arch',x,.255,.299,.47,.88,wood,-.984,-.92)
ring('Right_Side_Continuous_Window_Arch',0,.255,.299,.47,.88,wood,-.984,-.92,bpy.data.objects['Right_Side_Window_Pivot'])
for o in s.objects:
 if o.type=='MESH' and o.name.endswith('_Unified_Cross'):
  for v in o.data.vertices:
   if .84<v.co.z<.88 or v.co.z>1.10:v.co.z+=.020
  o.data.update()
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'Bank-clean.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=28;s.render.resolution_x=1200;s.render.resolution_y=1000
c=s.camera
for name,loc,at,scale in [('front-right',(4,-6,3.5),(0,-.08,1.12),4.6),('front',(0,-7,2.8),(0,-.1,1.12),4.6),('rear',(4,6,3.5),(0,0,1.12),4.6),('roof-junction',(3,-5,4),(0,-.60,1.96),2.0),('entry-detail',(1,-5,2),(0,-1.05,.95),2.1)]:
 c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler()
 s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Bank-redesign.blend'))
(R/'manifest.json').write_text(json.dumps({'roof':counts,'source':'bank-exterior-clean-v1','gameApplied':False,'sha256':hashlib.sha256((R/'Bank-clean.glb').read_bytes()).hexdigest()},indent=2))
