import bpy,json,pathlib
root=pathlib.Path('C:/GitHub/StockWars/output/clothing-book-retouch-final')
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(root/'ClothingStore-window-fixed.glb'))
o=next(o for o in bpy.context.scene.objects if o.type=='MESH');m=o.data;uv=m.uv_layers.active.data;polys=[]
for p in m.polygons:
 x,y,z=o.matrix_world@p.center
 if -.73<x<-.31 and y<-.585 and -.66<z<-.459:
  polys.append([uv[i].uv[:] for i in p.loop_indices])
(root/'flower-uv.json').write_text(json.dumps(polys));print('Plant triangles',len(polys))
