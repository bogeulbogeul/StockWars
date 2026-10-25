import bpy,bmesh,math,json,hashlib,sys
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parent
def mat(name,c):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');c=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c);p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=.90;p.inputs['Specular IOR Level'].default_value=.17;return m
def setup():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    front=mat('Clean lottery paper print',(1,1,1));im=bpy.data.images.load(str(OUT/'lotto-front.png'));im.pack();tex=front.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;front.node_tree.links.new(tex.outputs['Color'],front.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    back=mat('Unprinted pale green paper back',(.86,.91,.72));edge=mat('Thin cream green cut edge',(.91,.94,.81))
    w=1.90;h=.98;corner=.047;notch=.022;centers=[.14+k*.1167 for k in range(7)]
    zs={h*i/64 for i in range(65)}
    for c in centers:
        for k in range(17):zs.add(c+notch*math.sin(-math.pi/2+math.pi*k/16))
    for k in range(17):
        z=corner*(1-math.cos(math.pi*k/32));zs.add(z);zs.add(h-z)
    zs=sorted({round(z,7) for z in zs if 0<=z<=h});cols=49;rows=len(zs);v=[]
    def halfwidth(z):
        hw=w/2
        if z<corner:hw=w/2-corner+math.sqrt(max(0,corner**2-(z-corner)**2))
        elif z>h-corner:hw=w/2-corner+math.sqrt(max(0,corner**2-(z-(h-corner))**2))
        for c in centers:
            if abs(z-c)<notch:hw=min(hw,w/2-math.sqrt(notch**2-(z-c)**2))
        return hw
    for side in [-1,1]:
        for z in zs:
            hw=halfwidth(z)
            for i in range(cols):
                x=-hw+2*hw*i/(cols-1);bow=-.014*(1-(2*x/w)**2)
                v.append((x,bow+side*.00175,z))
    count=rows*cols;f=[];ids=[]
    for side in [0,1]:
        for j in range(rows-1):
            for i in range(cols-1):
                a=side*count+j*cols+i;face=(a,a+1,a+1+cols,a+cols)
                f.append(face if side==0 else tuple(reversed(face)));ids.append(side)
    loop=list(range(cols))+[j*cols+cols-1 for j in range(1,rows)]+[(rows-1)*cols+i for i in range(cols-2,-1,-1)]+[j*cols for j in range(rows-2,0,-1)]
    for i,a in enumerate(loop):b=loop[(i+1)%len(loop)];f.append((a,b,b+count,a+count));ids.append(2)
    d=bpy.data.meshes.new('Thin notched lottery ticket');d.from_pydata(v,[],f);d.update();o=bpy.data.objects.new('Thin curved paper ticket with seven notches on each side',d);bpy.context.collection.objects.link(o)
    for m in [front,back,edge]:d.materials.append(m)
    uv=d.uv_layers.new()
    for p,material in zip(d.polygons,ids):
        p.material_index=material;p.use_smooth=material!=2
        for li in p.loop_indices:
            pt=d.vertices[d.loops[li].vertex_index].co;uv.data[li].uv=((pt.x+w/2)/w,pt.z/h)
    bm=bmesh.new();bm.from_mesh(d);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(d);bm.free()
    path=OUT/'item_lotto_ticket.glb';bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True)
    (OUT/'manifest.json').write_text(json.dumps(dict(id='item_lotto_ticket',file=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),reference='web/assets/items/paper-v4/lotto.svg',thickness=.0035,notchesPerSide=7,exampleNumbers=[6,12,23,28,35,42]),indent=2),encoding='utf8')
    floor=mat('Warm studio',(.94,.92,.87));bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.003));bpy.context.object.name='Studio floor';bpy.context.object.data.materials.append(floor);bpy.context.scene.world.color=(.3,.3,.3)
    for loc,power,size in [((-3,-4,6),400,4),((3,-1,4),180,3),((0,4,5),300,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.5))-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(.65,-4,1.75));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.30
    s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=32;s.view_settings.view_transform='AgX';s.render.resolution_x=1500;s.render.resolution_y=1000;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Lotto-paper-ticket.blend'))
def render(mode):
    s=bpy.context.scene;cam=s.camera;target=Vector((0,0,.49))
    if mode=='rear':cam.location=(-.65,4,1.7)
    if mode=='detail':cam.location=(1.0,-3,1.4);cam.data.ortho_scale=1.08;target=Vector((.55,0,.47))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(OUT/(mode+'.png'));bpy.ops.render.render(write_still=True)
if '--' in sys.argv:render(sys.argv[sys.argv.index('--')+1])
else:setup();render('preview')
