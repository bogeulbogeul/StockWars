import bpy,json,math,hashlib,struct
from pathlib import Path
OUT=Path(__file__).resolve().parent
path=OUT/'item_honey_cookie.glb';raw=path.read_bytes()
magic,version,length=struct.unpack_from('<4sII',raw)
assert magic==b'glTF' and version==2 and length==len(raw)
for o in list(bpy.context.scene.objects):
    if o.type not in ['LIGHT','CAMERA'] and o.name!='Studio floor':bpy.data.objects.remove(o,do_unlink=True)
before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(path));objects=list(set(bpy.data.objects)-before)
bpy.context.view_layer.update()
vertices=[o.matrix_world@v.co for o in objects if o.type=='MESH' for v in o.data.vertices]
assert all(math.isfinite(c) for v in vertices for c in v)
cookieRoots=[o for o in objects if o.name.startswith('Cookie ') and o.type=='EMPTY'];assert len(cookieRoots)==4
meshes=[o for o in objects if o.type=='MESH']
degenerate=sum(p.area<1e-12 for o in meshes for p in o.data.polygons)
assert degenerate==0,degenerate
report=dict(id='item_honey_cookie',glbReimport=True,cookieCount=len(cookieRoots),meshCount=len(meshes),triangles=sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons),degenerateFaces=degenerate,boundsMin=[min(v[k] for v in vertices) for k in range(3)],boundsMax=[max(v[k] for v in vertices) for k in range(3)],sha256=hashlib.sha256(raw).hexdigest())
(OUT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print('VALIDATED',report)
# Detail is rendered from the reimported GLB, not only the editable source.
ns={'__file__':str(OUT/'build.py'),'__name__':'asset_helpers'}
source=(OUT/'build.py').read_text(encoding='utf8').split("if '--' in sys.argv:")[0]
exec(compile(source,str(OUT/'build.py'),'exec'),ns)
ns['render']('detail')
