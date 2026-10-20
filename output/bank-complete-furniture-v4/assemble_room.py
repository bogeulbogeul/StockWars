"""Place the latest storage cabinet, plant and display terminal in the bank room."""
import bpy,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
placements=[
 ('bank-storage-cabinet-v1','Bank-storage-cabinet.blend','Storage_Cabinet',(-2.65,2.48,.009),0),
 ('bank-potted-plant-v1','Bank-potted-plant.blend','Entry_Plant',(-3.15,-2.59,.009),0),
 ('bank-display-flat-mark-v4','Bank-info-terminal.blend','Info_Terminal',(3.34,-.96,.009),-math.pi/2)]
reports=[]
def append_asset(folder,file,name,loc,angle):
 before=set(bpy.data.objects)
 with bpy.data.libraries.load(str(ROOT.parent/folder/file),link=False) as (src,dst):dst.objects=src.objects
 added=set(bpy.data.objects)-before
 coll=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(coll)
 root=bpy.data.objects.new(name+'_Root',None);coll.objects.link(root)
 for o in added:
  coll.objects.link(o)
  if o.parent not in added:o.parent=root
 root.location=loc;root.rotation_euler.z=angle
 bpy.context.view_layer.update()
 pts=[o.matrix_world@Vector(c) for o in root.children_recursive if o.type=='MESH' for c in o.bound_box]
 return {'name':name,'source':folder+'/'+file,'location':loc,'rotation_z':angle,'bounds':{'min':[min(p[i] for p in pts) for i in range(3)],'max':[max(p[i] for p in pts) for i in range(3)]}}
for file,out,pic in [('Bank-furnished-room.blend','Bank-furnished-room','room.png'),('Bank-scale-check.blend','Bank-scale-check','room-scale.png')]:
 bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'bank-sofa-placement-v3'/file))
 reports=[append_asset(*p) for p in placements]
 assert not any(o.name.startswith('Front_Low_Border') for o in bpy.context.scene.objects)
 if out=='Bank-furnished-room':
  bpy.ops.object.select_all(action='DESELECT')
  for o in bpy.context.scene.objects:o.select_set(o.type in {'MESH','CURVE','EMPTY'})
  bpy.ops.export_scene.gltf(filepath=str(ROOT/(out+'.glb')),export_format='GLB',use_selection=True)
 scene=bpy.context.scene;scene.render.filepath=str(ROOT/pic);bpy.ops.render.render(write_still=True)
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/(out+'.blend')))
(ROOT/'manifest.json').write_text(json.dumps({'status':'furniture assembled in room; runtime integration pending','placements':reports,'preserved':['original U counter','shifted sofa clear of moulding','open front with raised borders removed','adopted gold bank wall mark','safe and arched window','desktop props and executive chair'],'display':'flat 2D adopted bank mark, texture packed','character':'three scale-reference copies in separate scale-check blend','validation':'placement and render only; no new seating checks'},indent=2),encoding='utf-8')
