import bpy,bmesh,math,json,hashlib,sys
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parent
def mat(name,color):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
    color=tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in color)
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.88;p.inputs['Specular IOR Level'].default_value=.18;return m
def printed(name):
    m=mat('Matte herb paper print '+name,(1,1,1));im=bpy.data.images.load(str(OUT/f'print-{name}.png'));im.pack();t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=im;m.node_tree.links.new(t.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);return m
def poly(name,v,f,m,ids=None):
    d=bpy.data.meshes.new(name);d.from_pydata(v,[],f);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o)
    for ma in m:d.materials.append(ma)
    uv=d.uv_layers.new()
    for i,p in enumerate(d.polygons):
        if ids:p.material_index=ids[i]
        co=[(0,0),(1,0),(1,1),(0,1)] if len(p.vertices)==4 else [(0,1),(1,1),(.5,0)]
        for li,xy in zip(p.loop_indices,co):
            uv.data[li].uv=co[d.loops[li].vertex_index] if len(v)==3 else xy
    return o
def solid(o,thick=.003):
    s=o.modifiers.new('Thin paperboard','SOLIDIFY');s.thickness=thick;s.offset=-1
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=s.name)
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
def setup():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    green=mat('Sage green carton',(.60,.68,.39));cream=mat('Cream cut paper',(1,.94,.79));dark=mat('Thin green fold line',(.39,.49,.23))
    front,side,lid=[printed(s) for s in ['front','side','lid']]
    w=1.44;d=.52;h=.60;back=.64
    v=[(-w/2,-d/2,0),(w/2,-d/2,0),(w/2,d/2,0),(-w/2,d/2,0),(-w/2,-d/2,h),(w/2,-d/2,h),(w/2,d/2,back),(-w/2,d/2,back)]
    o=poly('Low wide printed paper carton',v,[(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(3,2,1,0)],[front,side,green],[0,1,0,1,2]);solid(o,.003)
    # Lid's triangular cream flap is real folded board, not a raised badge.
    A=(-w/2,d/2,back);B=(w/2,d/2,back);C=(-w/2,-d/2,h);D=(w/2,-d/2,h);E=(0,-d/2-.012,h+.006)
    o=poly('Cream triangular folded lid',[A,B,E],[(0,2,1)],[lid]);solid(o,.004)
    o=poly('Green left lid fold',[A,E,C],[(0,2,1)],[green]);solid(o,.003)
    o=poly('Green right lid fold',[B,D,E],[(0,2,1)],[green]);solid(o,.003)
    o=poly('Tucked front fold edge',[C,D,E],[(0,1,2)],[dark]);solid(o,.002)
    # Narrow lap and tucked base flaps keep the carton construction legible.
    o=poly('Rear paper glue overlap',[(-.69,d/2+.001,.025),(-.662,d/2+.001,.025),(-.662,d/2+.001,.61),(-.69,d/2+.001,.61)],[(0,1,2,3)],[green]);solid(o,.001)
    o=poly('Bottom tucked paper fold',[(-.69,-.23,-.001),(.69,-.23,-.001),(.43,.02,-.001),(-.43,.02,-.001)],[(0,3,2,1)],[green]);solid(o,.002)
    path=OUT/'item_herb_tea.glb';bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True)
    (OUT/'manifest.json').write_text(json.dumps(dict(id='item_herb_tea',file=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),reference='web/assets/items/packing-v1/items.png [10,490,410,235]'),indent=2),encoding='utf8')
    floor=mat('Warm studio',(.94,.92,.87));bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.006));bpy.context.object.name='Studio floor';bpy.context.object.data.materials.append(floor)
    bpy.context.scene.world.color=(.3,.3,.3)
    for loc,power,size in [((-3,-4,6),400,4),((3,-1,4),180,3),((0,4,5),300,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.3))-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(1.8,-4,2.4));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.90
    s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=32;s.view_settings.view_transform='AgX';s.render.resolution_x=1400;s.render.resolution_y=1000;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Herb-tea-paperbox.blend'))
def render(mode):
    s=bpy.context.scene;cam=s.camera;target=Vector((0,0,.31))
    if mode=='rear':cam.location=(-2,4,2.6)
    if mode=='detail':cam.location=(.45,-3,2.1);cam.data.ortho_scale=1.30;target=Vector((0,0,.47))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(OUT/(mode+'.png'));bpy.ops.render.render(write_still=True)
if '--' in sys.argv:render(sys.argv[sys.argv.index('--')+1])
else:setup();render('preview')
