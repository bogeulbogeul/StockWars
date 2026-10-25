import bpy,math,json,hashlib,struct
from pathlib import Path
OUT=Path(__file__).resolve().parent;path=OUT/'item_honey_candy.glb';data=path.read_bytes()
magic,version,length=struct.unpack_from('<4sII',data);assert magic==b'glTF' and version==2 and length==len(data)
for o in list(bpy.context.scene.objects):
    if o.type not in ['LIGHT','CAMERA'] and o.name!='Studio floor':bpy.data.objects.remove(o,do_unlink=True)
before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(path));objects=list(set(bpy.data.objects)-before)
bpy.context.view_layer.update();meshes=[o for o in objects if o.type=='MESH']
coords=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
assert all(math.isfinite(c) for v in coords for c in v)
images={n.image for o in meshes for m in o.data.materials if m and m.use_nodes for n in m.node_tree.nodes if n.type=='TEX_IMAGE'}
for im in images:_=im.pixels[0];assert im.has_data and im.packed_file
degenerate=sum(p.area<1e-12 for o in meshes for p in o.data.polygons);assert not degenerate
report=dict(id='item_honey_candy',reimported=True,meshCount=len(meshes),embeddedPrints=len(images),degenerateFaces=degenerate,triangles=sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons),boundsMin=[min(v[k] for v in coords) for k in range(3)],boundsMax=[max(v[k] for v in coords) for k in range(3)],sha256=hashlib.sha256(data).hexdigest())
(OUT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf8');print('VALIDATED',report)
ns={'__file__':str(OUT/'build.py'),'__name__':'helpers'}
exec(compile((OUT/'build.py').read_text(encoding='utf8').split("if '--' in sys.argv:")[0],str(OUT/'build.py'),'exec'),ns)
ns['render']('detail')
