import bpy,json
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/blank-buddy-walk-v3/somangi-walk.blend')
m=bpy.data.objects['Somangi_Body'];gi={g.name:g.index for g in m.vertex_groups}
for z in [-.72,-.65,-.6,-.5,-.4,-.3,-.2,-.1,0,.05]:
 vs=[v.co for v in m.data.vertices if abs(v.co.z-z)<.015 and sum(g.weight for g in v.groups if g.group in [gi['Arm.L'],gi['Arm.R']])<.05]
 print('SECTION',z, len(vs), [(min(v[i] for v in vs),max(v[i] for v in vs)) for i in range(2)] if vs else [])
