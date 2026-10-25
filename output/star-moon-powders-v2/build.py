import bpy,bmesh,math,random,json,hashlib,sys
from pathlib import Path
from mathutils import Vector,Euler
OUT=Path(__file__).resolve().parent
def mat(name,c,rough=.8):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');c=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c);p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;return m
def mesh(name,v,f,m):
    d=bpy.data.meshes.new(name);d.from_pydata(v,[],f);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o)
    for ma in m:d.materials.append(ma)
    return o
def solid(o,t=.004):
    mod=o.modifiers.new('Actual thin paper','SOLIDIFY');mod.thickness=t;mod.offset=-1;mod.material_offset=2
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
def make_product(kind,ico):
    rng=random.Random(1025 if kind=='star' else 1026)
    colors=[(1,.65,.07),(1,.82,.27),(1,.95,.65)] if kind=='star' else [(.72,.54,.88),(.84,.70,.95),(.95,.88,1)]
    paper=mat(kind+' colored matte paper',(.93,.74,.42) if kind=='star' else (.66,.49,.79))
    liner=mat(kind+' pale paper inside',(1,.89,.69) if kind=='star' else (.84,.73,.91))
    printed=mat(kind+' flat printed front',(1,1,1));im=bpy.data.images.load(str(OUT/f'{kind}-front.png'));im.pack();tex=printed.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;printed.node_tree.links.new(tex.outputs['Color'],printed.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    # Four perimeter segments, including the inward fold down each short side.
    points=[]
    for side,count in [(0,32),(1,16),(2,32),(3,16)]:
        for k in range(count):points.append((side,k/count))
    N=len(points);rows=32;v=[]
    for j in range(rows+1):
        t=j/rows;hw=.46-.085*t;hd=.24-.055*t
        for side,u in points:
            if side==0:x=-hw+2*hw*u;y=-hd-.018*math.sin(math.pi*u)*math.sin(math.pi*t);height=1.04-.010*math.sin(math.pi*u)
            elif side==1:x=hw-.032*math.sin(math.pi*u)*math.sin(math.pi*t);y=-hd+2*hd*u;height=1.04+.16*u
            elif side==2:x=hw-2*hw*u;y=hd;height=1.20-.010*math.sin(math.pi*u)
            else:x=-hw+.032*math.sin(math.pi*u)*math.sin(math.pi*t);y=hd-2*hd*u;height=1.20-.16*u
            v.append((x,y,t*height))
    f=[]
    for j in range(rows):
        for i in range(N):f.append((j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i))
    o=mesh(kind+' folded open pouch',v,f,[printed,paper,liner]);uv=o.data.uv_layers.new()
    for p in o.data.polygons:
        j,i=divmod(p.index,N);p.material_index=0 if points[i][0]==0 else 1
        u=points[i][1];unext=points[(i+1)%N][1] if points[(i+1)%N][0]==points[i][0] else 1
        for li,co in zip(p.loop_indices,[(u,j/rows),(unext,j/rows),(unext,(j+1)/rows),(u,(j+1)/rows)]):uv.data[li].uv=co
    solid(o)
    # Folded mouth strip follows the opening, with no thick floating bars.
    ring=v[-N:];vv=ring+[(x*.90,y*.87,z-.023) for x,y,z in ring];ff=[]
    for i in range(N):ff.append((i,(i+1)%N,N+(i+1)%N,N+i))
    lip=mesh(kind+' continuous folded paper lip',vv,ff,[liner]);solid(lip,.003)
    floor=mesh(kind+' closed paper bottom',[(-.456,-.236,.004),(.456,-.236,.004),(.456,.236,.004),(-.456,.236,.004)],[(0,1,2,3)],[paper]);solid(floor,.003)
    grains=[mat(kind+' fine crystal '+str(i),c,.39 if kind=='star' else .48) for i,c in enumerate(colors)]
    for m in grains:
        m.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.06
    # A filled elliptical mound under the fine granules keeps the packet visibly full.
    vv=[(0,0,1.18)];seg=64
    for j in range(1,9):
        t=j/8
        for i in range(seg):
            a=math.tau*i/seg;vv.append((.365*t*math.cos(a),.174*t*math.sin(a),.94+.24*(1-t*t)))
    ff=[]
    for i in range(seg):ff.append((0,1+i,1+(i+1)%seg))
    for j in range(7):
        for i in range(seg):a=1+j*seg+i;b=1+j*seg+(i+1)%seg;ff.append((a,b,b+seg,a+seg))
    packed=mat(kind+' packed fine powder base',colors[0],.92)
    mesh(kind+' filled powder mound',vv,ff,[packed])
    vv=[];ff=[];ids=[];iv,ifaces=ico
    for k in range(2800):
        a=rng.random()*math.tau;t=math.sqrt(rng.random())*.98;x=.365*t*math.cos(a);y=.174*t*math.sin(a);z=.94+.24*(1-t*t)
        r=rng.uniform(.006,.013);rot=Euler((rng.random()*6,rng.random()*6,rng.random()*6)).to_matrix();start=len(vv)
        for pt in iv:
            p=rot@Vector(pt)*r+Vector((x,y,z+r*.25));vv.append(tuple(p))
        material=rng.choices([0,1,2],[6,3,1])[0]
        for face in ifaces:ff.append(tuple(start+i for i in face));ids.append(material)
    o=mesh(kind+' fine joined crystal granules',vv,ff,grains)
    for p,i in zip(o.data.polygons,ids):p.material_index=i
def setup():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1);o=bpy.context.object;ico=([tuple(v.co) for v in o.data.vertices],[tuple(p.vertices) for p in o.data.polygons]);bpy.data.objects.remove(o,do_unlink=True)
    manifest=[]
    for kind,item,name,x in [('star','item_crypto_decoder','별가루',-.65),('moon','item_moon_powder','달가루',.65)]:
        before=set(bpy.data.objects);make_product(kind,ico);objects=list(set(bpy.data.objects)-before)
        root=bpy.data.objects.new(item,None);bpy.context.collection.objects.link(root)
        for o in objects:o.parent=root
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects+[root]:o.select_set(True)
        path=OUT/(item+'.glb');bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True,use_selection=True)
        manifest.append(dict(id=item,name=name,file=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),granules=2800));root.location.x=x
    (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
    floor=mat('Warm ivory studio',(.94,.92,.87));bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.003));bpy.context.object.name='Studio floor';bpy.context.object.data.materials.append(floor);bpy.context.scene.world.color=(.3,.3,.3)
    for loc,power,size in [((-3,-4,6),500,4),((3,-1,4),200,3),((0,4,5),350,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.6))-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(1.4,-6,3.1));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.95
    s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=40;s.view_settings.view_transform='AgX';s.render.resolution_x=1600;s.render.resolution_y=1150;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Star-moon-powders.blend'))
def render(mode):
    s=bpy.context.scene;cam=s.camera;target=Vector((0,0,.60))
    if mode=='rear':cam.location=(-1.4,6,3.2)
    if mode=='detail':cam.location=(1,-4,3.4);cam.data.ortho_scale=2.60;target=Vector((0,0,.99))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(OUT/(mode+'.png'));bpy.ops.render.render(write_still=True)
if '--' in sys.argv:render(sys.argv[sys.argv.index('--')+1])
else:setup();render('preview')
