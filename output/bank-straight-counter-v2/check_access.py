"""Static mesh collision audit of crab entry and final seating, no runtime claim."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'Bank-furnished-room.blend'))
scene=bpy.context.scene
obstacles=[o for o in scene.objects if o.type=='MESH' and o.name.startswith(('Desk_','Executive_'))]
def bvh(o):
 return BVHTree.FromPolygons([o.matrix_world@v.co for v in o.data.vertices],[list(p.vertices) for p in o.data.polygons],all_triangles=False,epsilon=.00001)
colliders=[(o.name,bvh(o)) for o in obstacles]
def snapshot(file,frame,name):
 before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT.parent.parent/'web/assets/characters/3d/somangi'/file))
 added=set(bpy.data.objects)-before;scene.frame_set(frame);bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();out=[]
 for o in added:
  if o.type!='MESH' or o.name.startswith('Icosphere'):continue
  ev=o.evaluated_get(deps);m=bpy.data.meshes.new_from_object(ev,depsgraph=deps);m.transform(o.matrix_world)
  for v in m.vertices:v.co/=1.95
  ob=bpy.data.objects.new(name+'_'+o.name,m);scene.collection.objects.link(ob);out.append(ob)
 for o in added:bpy.data.objects.remove(o,do_unlink=True)
 return out
crab=snapshot('crab.glb',13,'Crab')
pts=[v.co for o in crab for v in o.data.vertices];zmin=min(p.z for p in pts)
for o in crab:
 for v in o.data.vertices:v.co.z-=zmin
crabdepth=max(p.y for p in pts)-min(p.y for p in pts)
# Sideways route at the arm-front station; actual triangle contact sampled along X.
route=[]
for x in [1.20,.90,.65,.40,.20,0]:
 for o in crab:
  o.location=(x,.60,.024);o.rotation_euler.z=math.pi/2
 bpy.context.view_layer.update();hits=set()
 for o in crab:
  t=bvh(o)
  for n,c in colliders:
   if t.overlap(c):hits.add(n)
 route.append({'x':x,'y':.60,'intersections':sorted(hits)})
for o in crab:o.hide_render=True
seated=snapshot('office-sit.glb',25,'Seated')
contact=Vector((0,-.0099999979,.2054430246))/1.95
offset=Vector((0,1.265,.664))-contact
for o in seated:o.location=offset
bpy.context.view_layer.update();hits=set()
for o in seated:
 t=bvh(o)
 for n,c in colliders:
  if t.overlap(c):hits.add(n)
report={'basis':'same source divisor 1.95 as current game; room unit=100 game units assumption','chair_seat_front_y':.915,'counter_rear_y':.30,'central_counter_rear_y':.30,'central_seat_gap':.615,'central_arm_gap':.730,'note':'straight counter with no rear wings','crab_pose_depth':crabdepth,'route_samples':route,'seated_triangle_intersections':sorted(hits),'result':'see route_samples for crab clearance; seated back cushion intersections remain','runtime':'bank has no registered chair interaction; actual input/animation transition not verified'}
(ROOT/'access-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
