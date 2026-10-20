"""Move the waiting sofa clear of wainscot and slightly toward the entry."""
import bpy,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
results=[]
for filename,out,image in [('Bank-furnished-room.blend','Bank-furnished-room','room.png'),('Bank-scale-check.blend','Bank-scale-check','room-scale.png')]:
 bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'bank-open-front-v2'/filename))
 root=bpy.data.objects['Waiting_Sofa_Root'];old=list(root.location)
 root.location.x+=.14;root.location.y-=.25
 bpy.context.view_layer.update()
 pts=[o.matrix_world@Vector(c) for o in root.children_recursive if o.type=='MESH' for c in o.bound_box]
 bounds={'min':[min(v[i] for v in pts) for i in range(3)],'max':[max(v[i] for v in pts) for i in range(3)]}
 # Left wall moulding protrudes to x=-3.76.
 assert bounds['min'][0]>-3.76
 results.append({'scene':filename,'old':old,'new':list(root.location),'bounds':bounds,'moulding_clearance':bounds['min'][0]+3.76})
 if out=='Bank-furnished-room':
  bpy.ops.object.select_all(action='DESELECT')
  for o in bpy.context.scene.objects:o.select_set(o.type in {'MESH','CURVE','EMPTY'})
  bpy.ops.export_scene.gltf(filepath=str(ROOT/(out+'.glb')),export_format='GLB',use_selection=True)
 scene=bpy.context.scene;scene.render.filepath=str(ROOT/image);bpy.ops.render.render(write_still=True)
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/(out+'.blend')))
(ROOT/'report.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
