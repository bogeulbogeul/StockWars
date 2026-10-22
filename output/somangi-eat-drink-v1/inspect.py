import bpy
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/somangi-black-eyes-v1/somangi-black-eyes.blend')
r=bpy.data.objects['Somangi_OriginalRig']
for b in r.data.bones:print(b.name,tuple(b.head_local),tuple(b.tail_local))
