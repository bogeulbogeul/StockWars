import bpy
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/somangi-walk-v4/somangi-walk.blend')
for o in bpy.data.objects:
 if o.type=='MESH':print(o.name,len(o.data.vertices),[(min(v.co[i] for v in o.data.vertices),max(v.co[i] for v in o.data.vertices)) for i in range(3)],[m.name for m in o.data.materials])
rig=bpy.data.objects['Somangi_Rig'];print('HEAD',rig.data.bones['Head'].head_local[:])
