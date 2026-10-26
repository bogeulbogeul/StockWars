"""Reimport delivered GLBs; inspect actual exported geometry and render backs."""
import bpy,json,math,struct
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parent
manifest=json.loads((OUT/'manifest.json').read_text(encoding='utf8'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
report=[]
for i,item in enumerate(manifest):
    path=OUT/item['file'];raw=path.read_bytes()
    magic,version,total=struct.unpack_from('<4sII',raw)
    assert magic==b'glTF' and version==2 and total==len(raw)
    before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(path))
    objects=list(set(bpy.data.objects)-before)
    bpy.context.view_layer.update()
    vertices=[o.matrix_world@v.co for o in objects if o.type=='MESH' for v in o.data.vertices]
    assert vertices and all(math.isfinite(c) for v in vertices for c in v)
    lo=[min(v[k] for v in vertices) for k in range(3)];hi=[max(v[k] for v in vertices) for k in range(3)]
    assert all(hi[k]>lo[k] for k in range(3))
    images=[n.image for o in objects if o.type=='MESH' for m in o.data.materials if m and m.use_nodes for n in m.node_tree.nodes if n.type=='TEX_IMAGE']
    for im in images:
        if im: _=im.pixels[0] # Force decoding: imported packed images load lazily.
    missing=[im.name if im else 'null' for im in images if not im or not im.has_data]
    assert not missing,missing
    report.append(dict(id=item['id'],imported=True,meshCount=sum(o.type=='MESH' for o in objects),boundsMin=lo,boundsMax=hi,triangles=sum(len(p.vertices)-2 for o in objects if o.type=='MESH' for p in o.data.polygons)))
    for o in objects:
        if o.parent is None:o.location+=Vector(((i%4-1.5)*2.15,0,(2-i//4)*1.85))
(OUT/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
world=bpy.context.scene.world;world.color=(.35,.35,.35)
for loc,power,size in [((-4,7,10),1400,7),((7,3,6),900,6),((1,-5,9),1600,5)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,2))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(-3,15,9));cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,2.4))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=9.4
s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=24
s.render.resolution_x=1800;s.render.resolution_y=1250;s.render.resolution_percentage=100
s.view_settings.view_transform='AgX';s.render.image_settings.file_format='PNG';s.render.film_transparent=True
s.render.filepath=str(OUT/'rear.png');bpy.ops.render.render(write_still=True)
print('VERIFIED',len(report),'EXPORTED GLBS')
