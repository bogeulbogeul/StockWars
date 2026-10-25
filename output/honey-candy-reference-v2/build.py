import bpy,bmesh,math,json,hashlib,sys
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parent
def mat(name,c,rough=.35):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');c=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c);p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;return m
def mesh(name,v,f,m):
    d=bpy.data.meshes.new(name);d.from_pydata(v,[],f);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);d.materials.append(m)
    for p in d.polygons:p.use_smooth=True
    return o
def clean(o):
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
def thin(o,t):
    s=o.modifiers.new('Actual thin wrapper film','SOLIDIFY');s.thickness=t;s.offset=-1;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=s.name);clean(o)
def flower(name,radius,lobes,depth,m,y=0):
    N=120;profile=[(0,depth),(.78,depth),(.94,depth*.8),(1,depth*.25),(1,-depth*.25),(.94,-depth*.85),(.70,-depth),(0,-depth)];v=[]
    radii=[]
    for i in range(N):
        a=math.tau*i/N;d=(a+math.pi/lobes)%(math.tau/lobes)-math.pi/lobes
        radii.append(.55*math.cos(d)+math.sqrt(.45**2-(.55*math.sin(d))**2))
    for _ in range(2):radii=[(radii[(i-1)%N]+2*radii[i]+radii[(i+1)%N])/4 for i in range(N)]
    for t,yy in profile:
        for i in range(N):
            a=math.tau*i/N;r=radius*t*radii[i];v.append((r*math.sin(a),yy+y,.40+r*math.cos(a)))
    f=[]
    for j in range(len(profile)-1):
        for i in range(N):f.append((j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i))
    o=mesh(name,v,f,m);clean(o);return o
def setup():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    sweet=mat('Translucent golden flower candy',(1,.75,.14),.22);p=sweet.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=.10;p.inputs['IOR'].default_value=1.46;p.inputs['Coat Weight'].default_value=.25
    p.inputs['Emission Color'].default_value=(1,.42,.015,1);p.inputs['Emission Strength'].default_value=.10
    amber=mat('Amber honey flower center',(1,.60,.015),.20);p=amber.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=0;p.inputs['Coat Weight'].default_value=.3
    film=mat('Clear central candy wrapper',(1,1,1),.10);p=film.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=1;p.inputs['IOR'].default_value=1.40
    foil=mat('Honey gold twisted wrapper',(1,.65,.07),.29);p=foil.node_tree.nodes.get('Principled BSDF');p.inputs['Metallic'].default_value=.22;p.inputs['Coat Weight'].default_value=.18
    flower('Continuous six petal honey candy',.342,6,.065,sweet)
    flower('Small five petal amber flower',.165,5,.014,amber,y=-.074)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(0,-.091,.40));o=bpy.context.object;o.name='Honey flower heart';o.scale=(.044,.008,.044);o.data.materials.append(sweet)
    for p in o.data.polygons:p.use_smooth=True
    # Clear wrapping surrounds the sweet and gathers at both ends.
    control=[(-.49,.064,.060),(-.45,.14,.080),(-.36,.255,.120),(-.22,.341,.156),(0,.367,.177),(.22,.341,.156),(.36,.255,.120),(.45,.14,.080),(.49,.064,.060)]
    rings=[]
    for k in range(len(control)-1):
        for j in range(8):
            t=j/8;u=t*t*(3-2*t);a=control[k];b=control[k+1]
            rings.append(tuple(a[i]+(b[i]-a[i])*(t if i==0 else u) for i in range(3)))
    rings.append(control[-1]);N=96;v=[]
    for x,rz,ry in rings:
        for i in range(N):
            a=math.tau*i/N;crease=.0015*math.cos(a*8+x*5)
            v.append((x,(ry+crease)*math.cos(a),.4+(rz+crease)*math.sin(a)))
    f=[]
    for j in range(len(rings)-1):
        for i in range(N):f.append((j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i))
    o=mesh('Thin transparent central wrap',v,f,film);thin(o,.0012)
    # Each end is one folded film fan, twisting and widening out from its gather.
    for sign in [-1,1]:
        v=[];R=40;N=96
        for j in range(R+1):
            t=j/R;rz=.064-.020*math.sin(math.pi*t)*math.exp(-5*t)+.220*max(0,(t-.18)/.82)**.85;ry=.060*(1-t)+.025*t
            twist=sign*(1.2*math.sin(math.pi*t)*math.exp(-3*t)+.08*t)
            for i in range(N):
                a=math.tau*i/N;fold=.010*math.cos(8*a+sign*.5)*t
                yy=(ry+fold*.45)*math.cos(a);zz=(rz+fold)*math.sin(a)
                y=yy*math.cos(twist)-zz*math.sin(twist);z=yy*math.sin(twist)+zz*math.cos(twist)
                x=sign*(.489+.335*t+.018*math.cos(6*a)*t**4)
                v.append((x,y,.40+z))
        f=[]
        for j in range(R):
            for i in range(N):f.append((j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i))
        o=mesh('Twisted gold fan '+str(sign),v,f,foil);thin(o,.0018)
    path=OUT/'item_honey_candy.glb';bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True)
    (OUT/'manifest.json').write_text(json.dumps(dict(id='item_honey_candy',file=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),reference='web/assets/items/packing-v1/items.png [1580,470,410,255]'),indent=2),encoding='utf8')
    floor=mat('Warm studio',(.94,.92,.87),.88);bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.029));bpy.context.object.name='Studio floor';bpy.context.object.data.materials.append(floor)
    bpy.context.scene.world.color=(.3,.3,.3)
    for loc,power,size in [((-3,-4,6),400,4),((3,-2,4),200,3),((0,3,4),350,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.4))-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(1,-4,2.0));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.95
    s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=40;s.cycles.transmission_bounces=10;s.view_settings.view_transform='Standard';s.view_settings.look='None';s.view_settings.exposure=-.35;s.render.resolution_x=1500;s.render.resolution_y=1050;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Honey-candy.blend'))
def render(mode):
    s=bpy.context.scene;cam=s.camera;target=Vector((0,0,.40))
    if mode=='rear':cam.location=(-1,4,2.0)
    if mode=='detail':cam.location=(.7,-3,1.7);cam.data.ortho_scale=.95;target=Vector((.35,0,.40))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(OUT/(mode+'.png'));bpy.ops.render.render(write_still=True)
if '--' in sys.argv:render(sys.argv[sys.argv.index('--')+1])
else:setup();render('preview')
