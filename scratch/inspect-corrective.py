import bpy
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/somangi-mouth-bite-v37/somangi-eat.blend');b=bpy.data.objects['Somangi_SmoothBody'];m=b.modifiers.new('Test smooth','CORRECTIVE_SMOOTH')
for p in m.bl_rna.properties:
 if p.identifier not in ['rna_type','name','type']:print(p.identifier, getattr(m,p.identifier,None))
