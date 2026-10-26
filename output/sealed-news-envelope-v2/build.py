import bpy,bmesh,math,json,hashlib,sys
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parent
def mat(name,c,rough=.85):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');c=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c);p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;return m
def mesh(name,v,f,m,smooth=True):
    d=bpy.data.meshes.new(name);d.from_pydata(v,[],f);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);d.materials.append(m)
    for p in d.polygons:p.use_smooth=smooth
    return o
def clean(o):
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
def center_y(x,z):return -.003*math.sin(math.pi*z)*math.cos(math.pi*x/1.86)
def fold(name,outline,m,offset):
    center=(sum(x for x,z in outline)/len(outline),sum(z for x,z in outline)/len(outline));v=[];f=[];N=12
    for i in range(len(outline)):
        a=center;b=outline[i];c=outline[(i+1)%len(outline)];indices={}
        for j in range(N+1):
            for k in range(N-j+1):
                u=j/N;t=k/N;x=a[0]*(1-u-t)+b[0]*u+c[0]*t;z=a[1]*(1-u-t)+b[1]*u+c[1]*t
                indices[j,k]=len(v);v.append((x,center_y(x,z)-.005-offset,z))
        for j in range(N):
            for k in range(N-j):
                f.append((indices[j,k],indices[j+1,k],indices[j,k+1]))
                if j+k<N-1:f.append((indices[j+1,k],indices[j+1,k+1],indices[j,k+1]))
    o=mesh(name,v,f,m);clean(o);s=o.modifiers.new('Actual folded paper layer','SOLIDIFY');s.thickness=.0007;s.offset=-1;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=s.name);clean(o)
def curve(name,pts,r,m):
    d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=3;s=d.splines.new('POLY');s.points.add(len(pts)-1)
    for p,v in zip(s.points,pts):p.co=(*v,1)
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);d.materials.append(m);bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');return bpy.context.object
def setup():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    paper=mat('Warm cream envelope paper',(1,.91,.76));flap=mat('Cream closing flap',(1,.93,.80));bottom=mat('Cream lower paper fold',(1,.92,.78))
    wax=mat('Forest green matte wax',(.27,.40,.15),.52);rim=mat('Embossed green wax rim',(.36,.49,.22),.54);leafmat=mat('Light green leaf emboss',(.65,.75,.40),.62);vein=mat('Leaf vein green',(.42,.56,.25),.68)
    w=1.86;h=1;corner=.028;cols=41;zs=sorted({round(z,7) for z in [i/64 for i in range(65)]+[corner*(1-math.cos(math.pi*k/32)) for k in range(17)]+[1-corner*(1-math.cos(math.pi*k/32)) for k in range(17)]});rows=len(zs);v=[]
    for side in [-1,1]:
        for z in zs:
            hw=w/2
            if z<corner:hw=w/2-corner+math.sqrt(max(0,corner**2-(z-corner)**2))
            elif z>h-corner:hw=w/2-corner+math.sqrt(max(0,corner**2-(z-(h-corner))**2))
            for i in range(cols):
                x=-hw+2*hw*i/(cols-1);v.append((x,center_y(x,z)+side*.005,z))
    count=rows*cols;f=[]
    for side in [0,1]:
        for j in range(rows-1):
            for i in range(cols-1):
                a=side*count+j*cols+i;face=(a,a+1,a+1+cols,a+cols);f.append(face if side==0 else tuple(reversed(face)))
    loop=list(range(cols))+[j*cols+cols-1 for j in range(1,rows)]+[(rows-1)*cols+i for i in range(cols-2,-1,-1)]+[j*cols for j in range(rows-2,0,-1)]
    for i,a in enumerate(loop):b=loop[(i+1)%len(loop)];f.append((a,b,b+count,a+count))
    o=mesh('Closed thin cream envelope body',v,f,paper);clean(o)
    fold('Lower tucked paper triangle',[(-.908,.021),(.908,.021),(0,.56)],bottom,.0006)
    outline=[]
    for k in range(13):
        a=math.pi-math.pi/2*k/12;outline.append((-.902+corner*math.cos(a),.972+corner*math.sin(a)))
    for k in range(13):
        a=math.pi/2-math.pi/2*k/12;outline.append((.902+corner*math.cos(a),.972+corner*math.sin(a)))
    outline.append((0,.32));fold('Fully closed top paper flap',outline,flap,.0015)
    # A softly scalloped wax seal, attached to the closed flap without exposed contents.
    N=144;profile=[(0,-.006),(.86,-.006),(.98,-.015),(1.02,-.028),(1,-.041),(.92,-.054),(.82,-.055),(0,-.051)];v=[]
    for t,y in profile:
        for i in range(N):
            a=math.tau*i/N;r=.226*t*(1+.042*math.cos(7*a)+.007*math.sin(11*a));v.append((r*math.cos(a),y,.45+r*math.sin(a)))
    f=[]
    for j in range(len(profile)-1):
        for i in range(N):f.append((j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i))
    o=mesh('Organic rounded green wax seal',v,f,wax);clean(o)
    curve('Subtle raised wax inner ring',[(.176*math.cos(i*math.tau/144),-.053,.45+.176*math.sin(i*math.tau/144)) for i in range(145)],.0045,rim)
    curve('Connected sprout stem',[(-.065,-.055,.345),(-.025,-.055,.400),(.028,-.055,.480),(.065,-.055,.536)],.0055,leafmat)
    for name,a,b,width in [('Large upper leaf',(.023,.025),(.102,.13),.030),('Small left leaf',(.006,0),(-.069,.088),.023),('Small lower leaf',(-.028,-.050),(.063,-.008),.022)]:
        dx=b[0]-a[0];dz=b[1]-a[1];L=math.hypot(dx,dz);outline=[]
        for sign,steps in [(1,range(33)),(-1,range(32,-1,-1))]:
            for k in steps:
                t=k/32;r=width*math.sin(math.pi*t);outline.append((a[0]+dx*t-sign*dz/L*r,.45+a[1]+dz*t+sign*dx/L*r))
        cx=(a[0]+b[0])/2;cz=.45+(a[1]+b[1])/2;v=[(cx,-.058,cz)]+[(x,-.0515,z) for x,z in outline]+[(cx,-.049,cz)];n=len(outline);f=[]
        for i in range(n):f.extend([(0,1+i,1+(i+1)%n),(n+1,1+(i+1)%n,1+i)])
        o=mesh(name+' wax relief',v,f,leafmat);clean(o)
        curve(name+' fine vein',[(a[0]+dx*t,-.0585,.45+a[1]+dz*t) for t in [.18,.36,.54,.72,.86]],.0013,vein)
    path=OUT/'item_premium_rumor.glb';bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True)
    (OUT/'manifest.json').write_text(json.dumps(dict(id='item_premium_rumor',file=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),reference='web/assets/items/paper-v4/sealed-news.svg',closedEnvelope=True,paperBodyThickness=.010),indent=2),encoding='utf8')
    floor=mat('Warm studio',(.94,.92,.87));bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.003));bpy.context.object.name='Studio floor';bpy.context.object.data.materials.append(floor);bpy.context.scene.world.color=(.3,.3,.3)
    for loc,power,size in [((-3,-4,6),450,4),((3,-1,4),180,3),((0,4,5),300,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.5))-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(.7,-4,1.8));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.25
    s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=40;s.view_settings.view_transform='AgX';s.render.resolution_x=1500;s.render.resolution_y=1000;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Sealed-news-envelope.blend'))
def render(mode):
    s=bpy.context.scene;cam=s.camera;target=Vector((0,0,.50))
    if mode=='rear':cam.location=(-.7,4,1.8)
    if mode=='detail':cam.location=(.55,-3,1.4);cam.data.ortho_scale=.76;target=Vector((0,-.025,.45))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(OUT/(mode+'.png'));bpy.ops.render.render(write_still=True)
if '--' in sys.argv:render(sys.argv[sys.argv.index('--')+1])
else:setup();render('preview')
