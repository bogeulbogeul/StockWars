import bpy,pathlib,json
root=pathlib.Path(r'C:/GitHub/StockWars')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root/'web/assets/props/3d/CommonTree-clean.glb'))
counts=[]
for ob in list(bpy.context.scene.objects):
 if ob.type!='MESH':continue
 before=sum(len(p.vertices)-2 for p in ob.data.polygons)
 if before>500:
  bpy.context.view_layer.objects.active=ob
  mod=ob.modifiers.new('distant-forest-render-only','DECIMATE');mod.ratio=.04;mod.use_collapse_triangulate=True
  bpy.ops.object.modifier_apply(modifier=mod.name)
 after=sum(len(p.vertices)-2 for p in ob.data.polygons);counts.append({'name':ob.name,'before':before,'after':after})
out=root/'web/assets/props/3d/CommonTree-forest-lite.glb'
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_animations=False,export_apply=True)
(root/'output/frame-performance-v1/forest-geometry.json').write_text(json.dumps(counts,indent=2))
print(json.dumps({'before':sum(i['before'] for i in counts),'after':sum(i['after'] for i in counts),'bytes':out.stat().st_size}))
