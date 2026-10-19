import bpy,pathlib,numpy as np
r=pathlib.Path('C:/GitHub/StockWars/output/clothing-book-retouch-final');bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(r/'ClothingStore-flower-fixed.glb'));o=next(o for o in bpy.context.scene.objects if o.type=='MESH')
v=np.array([(o.matrix_world@v.co)[:] for v in o.data.vertices]);a=v[(v[:,0]>-.8)&(v[:,0]<-.25)&(v[:,1]<-.58)&(v[:,2]<-.44)]
print('PLANT BOUNDS',np.quantile(a,[0,.01,.2,.5,.8,.99,1],axis=0).tolist())
