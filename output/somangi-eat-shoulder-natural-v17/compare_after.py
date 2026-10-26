import bpy,json,sys,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path('C:/GitHub/StockWars/output/somangi-eat-shoulder-natural-v17')
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-drink-grip-v3/somangi-bread.blend'))
ob=bpy.data.objects['Somangi_SmoothBody'];group=ob.vertex_groups['Part.Root'].index
ids={v.index for v in ob.data.vertices if any(g.group==group for g in v.groups)}
ref=BVHTree.FromPolygons([v.co.copy() for v in ob.data.vertices],[list(f.vertices) for f in ob.data.polygons if all(i in ids for i in f.vertices)])
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
ob=bpy.data.objects['Somangi_SmoothBody'];meta=json.loads((P.parent/'somangi-eat-sealed-junction-v16/metadata.json').read_text());a=meta['torsoVertexStart'];b=meta['torsoVertexEnd']
bpy.context.scene.frame_set(1);current=ob.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
now=BVHTree.FromPolygons([v.co.copy() for v in current.vertices],[list(f.vertices) for f in ob.data.polygons if all(a<=i<b for i in f.vertices)])
report=[]
for z in [-.6,-.5,-.4,-.3,-.2,-.1]:
    r=ref.ray_cast(Vector((0,0,z)),Vector((0,1,0)),1)[0];c=now.ray_cast(Vector((0,0,z)),Vector((0,1,0)),1)[0]
    report.append({'z':z,'originalBackY':r.y,'currentBackY':c.y,'difference':c.y-r.y})
print(report);(P/'back-after-comparison.json').write_text(json.dumps(report,indent=2))
widths=[]
for z in [-.6,-.5,-.4,-.3,-.2,-.1]:
    for y in [0,.10,.18]:
        r=ref.ray_cast(Vector((0,y,z)),Vector((1,0,0)),1)[0];c=now.ray_cast(Vector((0,y,z)),Vector((1,0,0)),1)[0]
        if r is not None and c is not None:widths.append({'z':z,'y':y,'originalX':r.x,'currentX':c.x,'difference':c.x-r.x})
print('WIDTH',widths);(P/'back-width-after-comparison.json').write_text(json.dumps(widths,indent=2))


