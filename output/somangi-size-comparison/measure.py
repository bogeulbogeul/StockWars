import bpy,json
from mathutils import Vector
paths={'new':r'C:\Users\bogeu\Downloads\Meshy_AI__1022155254_texture.glb','previous_game':'output/somangi-neck-smooth-v8/walk.glb','previous_meshy':'output/somangi-slim-design-v1/original.glb','recent_polish':'output/somangi-joint-polish-v1/somangi-rest.glb'}
report={}
for label,path in paths.items():
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=path)
 bpy.context.view_layer.update()
 pts=[]
 for obj in bpy.context.scene.objects:
  if obj.type=='MESH':
   evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
   mesh=evaluated.to_mesh()
   pts.extend(evaluated.matrix_world @ v.co for v in mesh.vertices)
   evaluated.to_mesh_clear()
 lo=[min(p[k] for p in pts) for k in range(3)]
 hi=[max(p[k] for p in pts) for k in range(3)]
 dims=[hi[k]-lo[k] for k in range(3)]
 # Blender Z is vertical. Torso middle section excludes the head.
 torso=[p for p in pts if lo[2]+dims[2]*.28 <= p.z <= lo[2]+dims[2]*.46]
 td=[max(p[k] for p in torso)-min(p[k] for p in torso) for k in range(3)]
 report[label]={'path':path,'min':lo,'max':hi,'width_depth_height':dims,'middle_section_width_depth':td[:2]}
print('MEASUREMENTS '+json.dumps(report))
with open('output/somangi-size-comparison/measurements.json','w') as f:json.dump(report,f,indent=2)

