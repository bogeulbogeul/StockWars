"""Rounded clay ridge courses, substantial tiles and a fitted chimney collar."""
import bpy,bmesh,math
from mathutils import Vector
from exterior_geometry import box,extrude,finish

def build(red):
 scene=bpy.context.scene
 for o in list(scene.objects):
  if o.name.startswith(('Home_Red_Ridge_Cap','Home_Red_Clay_Tile')):bpy.data.objects.remove(o,do_unlink=True)
 slope=.80/1.23
 def h(x):return 2.05-slope*abs(x)
 tiles=[]
 # Rounded solid tiles use physical dimensions in the roof's tangent plane.
 for side in (-1,1):
  for row in range(7):
   x=side*(row+.5)*1.23/7
   normal=Vector((side*slope,0,1)).normalized()
   for column in range(8):
    y=-.96+(column+.5)*1.92/8
    center=Vector((x,y,h(x)))+normal*.006
    tile=box('Home_Red_Clay_Tile',((1.23/7-.005)*math.sqrt(1+slope*slope),1.92/8-.005,.043),center,red,.011)
    tile.rotation_euler.y=side*math.atan(slope)
    tiles.append(tile)
 # Cut only the tiles touched by the chimney, instead of leaving buried tips.
 cut=box('Chimney_Tile_Trim_Cutter',(.302,.312,1.4),(.66,.35,1.9),red,.002)
 bpy.context.view_layer.update();trimmed=0
 for tile in tiles:
  points=[tile.matrix_world@Vector(c) for c in tile.bound_box]
  if max(p.x for p in points)<.509 or min(p.x for p in points)>.811:continue
  if max(p.y for p in points)<.194 or min(p.y for p in points)>.506:continue
  bpy.context.view_layer.objects.active=tile
  mod=tile.modifiers.new('Chimney_Exact_Tile_Cut','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut
  bpy.ops.object.modifier_apply(modifier=mod.name);trimmed+=1
 bpy.data.objects.remove(cut,do_unlink=True)
 # A closed terracotta collar seats inside the chimney and over the cut tiles.
 outer=[(.484,.169),(.836,.169),(.836,.531),(.484,.531)]
 inner=[(.524,.209),(.796,.209),(.796,.491),(.524,.491)]
 vertices=[(x,y,h(x)+offset) for offset in (.041,-.018) for poly in (outer,inner) for x,y in poly]
 faces=[]
 for i in range(4):
  j=(i+1)%4;faces.extend([(i,j,4+j,4+i),(8+i,12+i,12+j,8+j),
   (i,8+i,8+j,j),(4+i,4+j,12+j,12+i)])
 mesh=bpy.data.meshes.new('Fitted_Chimney_Collar');mesh.from_pydata(vertices,[],faces)
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
 obj=bpy.data.objects.new('Home_Chimney_Closed_Tile_Collar',mesh);bpy.context.collection.objects.link(obj);finish(obj,red,.004)
 # Each cap has a full domed section whose lower flanges are embedded in tiles.
 def section(radius,height,base):
  return [(radius*math.cos(math.pi*i/64),base+height*math.sin(math.pi*i/64)) for i in range(65)]
 def cap(name,radius,height,base,a,b):
  obj=extrude(name,section(radius,height,base),a,b,red,.0025)
  for p in obj.data.polygons:p.use_smooth=abs(p.normal.y)<.99
  obj.data.normals_split_custom_set([(0,0,0)]*len(obj.data.loops))
  return obj
 length=1.948;start=-length/2;step=length/8
 for i in range(8):
  cap('Home_Red_Ridge_Cap',.080,.120,2.010,start+i*step+.0005,start+(i+1)*step-.0005)
 for i in range(9):
  y=start+i*step
  cap('Home_Ridge_Rounded_Overlap_Band',.086,.128,2.006,y-.010,y+.010)
 return {'roofTiles':len(tiles),'chimneyTrimmedTiles':trimmed,'ridgeCaps':8,'overlapBands':9,
  'tileThickness':.043,'tileBevel':.011,'ridgeCrown':2.134,'embeddedFlangeBase':2.010}
