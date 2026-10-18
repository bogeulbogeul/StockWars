import bpy,json
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-bench-sit-v1/somangi-bench-sit.blend'))
s=bpy.context.scene;s.frame_set(25);mesh=bpy.data.objects['Somangi_Body']
obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());temp=obj.to_mesh()
groups={g.index:g.name for g in mesh.vertex_groups}
rows=[]
for v in mesh.data.vertices:
    if abs(v.co.x)<.26 and -.8<v.co.z<-.48 and v.co.y>.02:
        rows.append({'i':v.index,'rest':list(v.co),'posed':list(temp.vertices[v.index].co),'weights':{groups[g.group]:g.weight for g in v.groups}})
rows.sort(key=lambda r:r['posed'][2])
body=[r for r in rows if r['weights'].get('Body',0)>.95]
print('LOWEST',json.dumps(rows[:8]));print('BODY',json.dumps(body[:8]));obj.to_mesh_clear()
