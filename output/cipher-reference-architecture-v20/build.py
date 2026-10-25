"""Rebuild reference proportions as straight walls, columns and planar roofs."""
import bpy,sys,math,json,hashlib
import numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
sys.path.insert(0,str(ROOT.parent/'cipher-roof-traced-v17'))
sys.path.insert(0,str(ROOT))
from exterior_geometry import box,extrude,stroke,finish
from projection import P,at_y,at_z,project,setup,design
from roof import build as build_roof
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-full-reference-v18'/'CipherSecurities-reference.blend'))
scene=bpy.context.scene;cam=scene.camera;setup(cam)
scene.render.resolution_x=1374;scene.render.resolution_y=1145;scene.render.resolution_percentage=100
scene.frame_set(1);bpy.context.view_layer.update()
cream=bpy.data.materials['Trim_Cream'];blue=bpy.data.materials['Roof_Blue']
gold=bpy.data.materials['Cipher_Satin_Brass'];glass=bpy.data.materials['Window_Muted_Blue']
# Retire the previous roof, floor and columns before rebuilding the dimensions.
retired=('Ref_','Central_Sealed','Central_Blue','Portico_Column','Reference_Stepped_Stone_Cheek',
 'Reference_Continuous_Three_Step','Central_Foundation','Portico_Landing','Grand_Entry_Step','Grand_Rear_Windowless_Wall')
for o in list(scene.objects):
 buried_rear_pilaster=o.name.startswith('Wing_Corner_Pilaster') and abs(o.location.x)<1.4 and o.location.y>0
 if o.name.startswith(retired) or buried_rear_pilaster:bpy.data.objects.remove(o,do_unlink=True)
roof_stats,central_planes=build_roof();d=design();bd=P[9]
# Walls stay vertical and the foundation remains flat on Z=0.
wing_transform=Matrix.Diagonal((P[10]/3.11,bd/.98,P[8]/1.95,1))
for o in scene.objects:
 if o.name.startswith(('Single_Storey_Wing','Wing_Foundation','Wing_Plinth','Wing_Cornice','Wing_Corner','Grand_Window','Grand_Front_Window')):
  o.matrix_world=wing_transform@o.matrix_world
# Match each front window as a rigid, upright assembly, not a mesh warp.
window_centers=[-2.44*P[10]/3.11,-1.75*P[10]/3.11,1.60*P[10]/3.11,2.31*P[10]/3.11]
targets=[(177,600,759),(314,609,773),(908,644,820),(1056,655,836)]
groups=[[] for _ in window_centers]
for o in scene.objects:
 if not o.name.startswith(('Grand_Window','Grand_Front_Window')):continue
 c=sum((o.matrix_world@Vector(v) for v in o.bound_box),Vector())/8
 if abs(c.x)>2.95:continue
 groups[min(range(4),key=lambda i:abs(c.x-window_centers[i]))].append(o)
for i,group in enumerate(groups):
 frame=next(o for o in group if o.name.startswith('Grand_Window_Continuous_Arch_Frame'))
 pts=[frame.matrix_world@Vector(v) for v in frame.bound_box]
 low=min(v.z for v in pts);high=max(v.z for v in pts);z=(low+high)/2
 px,py_top,py_bottom=targets[i];y=-.96805*bd/.98
 target_low=at_y((px,py_bottom),y);target_high=at_y((px,py_top),y)
 destination=(target_low+target_high)/2
 tr=Matrix.Translation(Vector(destination))@Matrix.Diagonal((1,1,(target_high[2]-target_low[2])/(high-low),1))@Matrix.Translation((-window_centers[i],-y,-z))
 for o in group:o.matrix_world=tr@o.matrix_world
# Door and central wall share the same physical opening scale.
door_bottom=at_y((605,821),-bd-.05);door_top=at_y((607,612),-bd-.05)
sz=(door_top[2]-door_bottom[2])/1.2500998;sx=.94
door=bpy.data.objects['Door_Assembly'];members=[door,*door.children_recursive]
members.extend(o for o in scene.objects if o.name.startswith(('Reference_Door','Reference_Straight_Brass','Reference_Brass_Pull')))
members=list(set(members));old={o.name:o.matrix_world.copy() for o in members}
def depth(o):
 n=0
 while o.parent:n+=1;o=o.parent
 return n
transform=Matrix.Translation(Vector(door_bottom))@Matrix.Diagonal((sx,1,sz,1))@Matrix.Translation((0,1.10,-.30))
for o in sorted(members,key=depth):o.matrix_world=transform@old[o.name]
central_transform=Matrix.Translation((door_bottom[0],0,door_bottom[2]-.3*sz))@Matrix.Diagonal((sx,bd/.98,sz,1))
for o in list(scene.objects):
 if not o.name.startswith(('Grand_Central_Shell','Grand_Central_Front_Wall','Grand_Rear_Windowless_Wall')):continue
 o.matrix_world=central_transform@o.matrix_world
 # Clip the shell below the actual two roof planes, never through the tiles.
 inv=o.matrix_world.inverted()
 for v in o.data.vertices:
  q=o.matrix_world@v.co
  if q.x<door_bottom[0]-.60:q.x-=.32
  elif q.x>door_bottom[0]+.60:q.x+=.15
  h=min(fn(q.x,q.y) for fn in central_planes)-.065
  if q.z>h:q.z=h;v.co=inv@q
  else:v.co=inv@q
# The fanlight has five spokes, as in the source.
for a in (math.pi/6,5*math.pi/6):
 points=[transform@Vector((0,-1.133,1.0155)),transform@Vector((.421*math.cos(a),-1.133,1.0155+.421*math.sin(a)))]
 stroke('Door_Additional_Fanlight_Radial',points,.006,gold)
# Four genuinely round vertical columns, with visible ring capitals.
column_y=-bd-.32;bottom=.45;top=1.715
column_x=[at_y((px,777 if px<600 else 811),column_y)[0] for px in (421,482,723,785)]
profile=[(.16,0),(.16,.035),(.15,.05),(.128,.066),(.12,.09),(.116,.12),
 (.116,1.12),(.125,1.145),(.145,1.155),(.145,1.178),(.125,1.19),
 (.15,1.205),(.15,1.23),(.16,1.245),(.16,1.265)]
for x in column_x:
 n=64;verts=[(x+r*math.cos(2*math.pi*j/n),column_y+r*math.sin(2*math.pi*j/n),bottom+z) for r,z in profile for j in range(n)]
 faces=[(k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j) for k in range(len(profile)-1) for j in range(n)]
 faces.extend([tuple(range(n-1,-1,-1)),tuple(range((len(profile)-1)*n,len(profile)*n))])
 mesh=bpy.data.meshes.new('Column_Profile');mesh.from_pydata(verts,[],faces)
 o=bpy.data.objects.new('Portico_Column',mesh);bpy.context.collection.objects.link(o);finish(o,cream,.003)
 for face in mesh.polygons:face.use_smooth=len(face.vertices)==4
 box('Portico_Column_Plinth',(.35,.36,bottom),(x,column_y,bottom/2),cream,.009)
 box('Portico_Column_Capital',(.34,.36,.09),(x,column_y,1.755),cream,.007)
# Move the clock as a rigid assembly, preserving circularity and named pivots.
clock=[o for o in scene.objects if o.name.startswith(('Clock_','Grand_Clock_Brass'))]
clock_old={o.name:o.matrix_world.copy() for o in clock}
clock_center=at_y((592,450),d['front']-.025)
ct=Matrix.Translation(Vector(clock_center))@Matrix.Diagonal((1.06,1,1.06,1))@Matrix.Translation((0,1.54,-2.51))
for o in sorted(clock,key=depth):o.matrix_world=ct@clock_old[o.name]
# Plaque follows the source position below the beam, above the arch.
center=at_y((603,565),-bd-.18)
logo=[o for o in scene.objects if o.name.startswith(('Cipher_Logo','Reference_Chart','Reference_Rising'))]
for o in logo:
 o.matrix_world=Matrix.Translation(Vector(center))@Matrix.Diagonal((1.10,1,1.32,1))@Matrix.Translation((0,1.049,-1.76))@o.matrix_world
for o in list(scene.objects):
 if o.name.startswith('Reference_Chart_Bar'):bpy.data.objects.remove(o,do_unlink=True)
for i,h in enumerate((.030,.045,.065,.085,.105,.130)):
 box('Reference_Chart_Bar',(.025,.012,h),(center[0]-.14+i*.052,center[1]-.037,center[2]-.095+h/2),gold,.002)
# Consistent three risers and solid cheeks, measured from the reference floor.
left=at_z((278,880),0);right=at_z((787,931),0)
cx=(left[0]+right[0])/2;outer_width=right[0]-left[0];cheek=.36
front=(left[1]+right[1])/2;rise=door_bottom[2]/3;tread=.19;rear=-bd+.10
profile=[(rear,0),(front,0),(front,rise),(front+tread,rise),
 (front+tread,2*rise),(front+2*tread,2*rise),(front+2*tread,3*rise),(rear,3*rise)]
stairs=extrude('Reference_Continuous_Three_Step',profile,-(outer_width/2-cheek),outer_width/2-cheek,cream,.008)
stairs.rotation_euler.z=math.pi/2;stairs.location.x=cx
for side in (-1,1):
 for ya,yb,z in [(front,front+tread,rise+.09),(front+tread,front+2*tread,2*rise+.09),(front+2*tread,rear,3*rise+.09)]:
  box('Reference_Stepped_Stone_Cheek',(cheek,yb-ya,z),(cx+side*(outer_width-cheek)/2,(ya+yb)/2,z/2),cream,.01)
box('Central_Foundation',(2.80,2*bd,.25),(door_bottom[0],0,.125),cream,.01)
# Close the entire rear gable down to the foundation, including its join to wings.
rear=d['rear'];lx=rear[0]+d['left'][0]-d['peak'][0];rx=rear[0]+d['right'][0]-d['peak'][0]
rear_outline=[(lx,0),(rx,0),(rx,central_planes[1](rx,d['back'])-.05),
 (rear[0],rear[2]-.045),(lx,central_planes[0](lx,d['back'])-.05)]
rear_wall=extrude('Rear_Closed_Central_Wall',rear_outline,d['back']-.23,d['back']-.012,cream,.005)
def union_into(target,parts):
 for part in parts:
  bpy.context.view_layer.objects.active=target
  mod=target.modifiers.new('Closed_Architectural_Join','BOOLEAN');mod.operation='UNION';mod.solver='EXACT';mod.object=part
  bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(part,do_unlink=True)
bridges=[]
for x in (-1.05,1.05):
 bridges.append(box('Rear_Wall_Join',(.34,.24,P[8]-.25),(x,bd-.124,(P[8]+.25)/2),cream,.003))
union_into(rear_wall,bridges)
base=bpy.data.objects['Central_Foundation']
union_into(base,[o for o in list(scene.objects) if o.name.startswith(('Wing_Foundation','Wing_Plinth','Wing_Corner_Foot'))])
# Neutral clay lighting, avoiding the white blown-out floor of the old review.
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
for name,color in [('Roof_Blue',(.018,.063,.145,1)),('Window_Muted_Blue',(.055,.14,.25,1)),
 ('Preview_Gray',(.30,.315,.34,1))]:
 mat=bpy.data.materials.get(name)
 if mat:mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=color
for name in ('Trim_Cream','Wall_Ivory'):
 node=bpy.data.materials[name].node_tree.nodes['Principled BSDF'];color=node.inputs['Base Color'].default_value
 node.inputs['Base Color'].default_value=tuple(min(1,c*1.15) for c in color[:3])+(1,)
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
for o in scene.objects:
 if o.name=='Preview_Ground':o.scale.x*=20;o.scale.y*=20
# A curved studio backdrop removes the artificial horizon from comparison views.
profile=[(-100,-.021),(5,-.021)]
profile.extend((5+10*math.sin(math.pi*i/48),9.979-10*math.cos(math.pi*i/48)) for i in range(1,25))
profile.append((15,80));vertices=[(x,y,z) for y,z in profile for x in (-100,100)]
faces=[(2*i,2*i+1,2*i+3,2*i+2) for i in range(len(profile)-1)]
mesh=bpy.data.meshes.new('Studio_Cyclorama');mesh.from_pydata(vertices,[],faces)
o=bpy.data.objects.new('Preview_Cyclorama',mesh);bpy.context.collection.objects.link(o)
ground=bpy.data.objects['Preview_Ground'];ground_material=ground.active_material
ground_material.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.42,.435,.47,1)
backdrop=bpy.data.materials.new('Studio_Backdrop_Gray');backdrop.use_nodes=True
nodes=backdrop.node_tree.nodes;emission=nodes.new('ShaderNodeEmission')
emission.inputs['Color'].default_value=(.35,.37,.42,1)
backdrop.node_tree.links.new(emission.outputs[0],nodes.get('Material Output').inputs['Surface'])
o.data.materials.append(backdrop)
for face in mesh.polygons:face.use_smooth=True
for light in scene.objects:
 if light.type=='LIGHT' and light.location.z>6.5:light.location.z=5.8
# Standard shadow-catcher presentation: no studio wall/horizon in asset previews.
o.hide_render=True;ground.is_shadow_catcher=True;scene.render.film_transparent=True
tree=bpy.data.node_groups.new('Studio_Composite','CompositorNodeTree')
tree.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor')
scene.compositing_node_group=tree;scene.use_nodes=True;nodes=tree.nodes
layers=nodes.new('CompositorNodeRLayers');background=nodes.new('CompositorNodeRGB')
background.outputs[0].default_value=(.42,.44,.48,1)
over=nodes.new('CompositorNodeAlphaOver');over.inputs['Factor'].default_value=1
tree.links.new(background.outputs[0],over.inputs['Background']);tree.links.new(layers.outputs['Image'],over.inputs['Foreground'])
out=nodes.new('NodeGroupOutput');tree.links.new(over.outputs[0],out.inputs['Image'])
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
asset=[o for o in scene.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith(('Preview_','Studio_'))]
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,
 export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
scene.render.filepath=str(ROOT/'front-right.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-reference.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'roof':roof_stats,'bodyHeightScale':P[8]/1.95,
 'bodyDepth':2*bd,'stairsWidth':outer_width,'gameApplied':False,
 'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest()},indent=2))
