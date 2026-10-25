"""Native mesh honey-cookie pack, matched to the current shop illustration."""
import bpy, bmesh, math, random, json, hashlib, sys
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parent
random.seed(2510)
def linear(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def material(name,rgb,rough=.65):
    m=bpy.data.materials.new(name);m.use_nodes=True
    c=tuple(linear(v) for v in rgb);m.diffuse_color=(*c,1)
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough
    return m
def mesh(name,v,f,m,smooth=True):
    d=bpy.data.meshes.new(name);d.from_pydata(v,[],f);d.update()
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.data.materials.append(m)
    for p in d.polygons:p.use_smooth=smooth
    return o
def tube(name,points,r,m):
    d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=3
    s=d.splines.new('POLY');s.points.add(len(points)-1)
    for p,v in zip(s.points,points):p.co=(*v,1)
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);d.materials.append(m);return o
def sphere(name,loc,scale,m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=6,location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(m)
    for p in o.data.polygons:p.use_smooth=True
    return o
def flower_solid(name,r,lobes,height,m,phase=0):
    # Concentric rings make one continuous scalloped biscuit/glaze, with rounded rims.
    profile=[(0,.018),(.82,.018),(.97,.035),(1,.060),(.985,height-.012),(.92,height),(.70,height+.010),(.38,height+.016),(0,height+.018)]
    n=96;v=[];radii=[]
    for i in range(n):
        a=math.tau*i/n;delta=(a+phase/lobes+math.pi/lobes)%(math.tau/lobes)-math.pi/lobes
        radii.append(1.115*(.55*math.cos(delta)+math.sqrt(.45**2-(.55*math.sin(delta))**2)))
    for _ in range(2):radii=[(radii[(i-1)%n]+2*radii[i]+radii[(i+1)%n])/4 for i in range(n)]
    for t,z in profile:
        for i in range(n):
            a=math.tau*i/n;rr=r*t*radii[i]
            v.append((rr*math.cos(a),rr*math.sin(a),z))
    f=[]
    for j in range(len(profile)-1):
        for i in range(n):f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    return mesh(name,v,f,m)
def setup():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    paper=material('Warm cream folded paper',(1,.855,.65))
    edge=material('Paper cut edge',(1,.95,.81));inner=material('Warm paper inside',(.83,.61,.37))
    orange=material('Flat printed orange flower',(.96,.59,.22),.85)
    baked=material('Toasted biscuit edge',(.76,.365,.055),.70)
    dough=material('Golden biscuit face',(1,.715,.265),.64)
    honey=material('Amber flower honey',(1,.59,.015),.21)
    p=honey.node_tree.nodes.get('Principled BSDF');p.inputs['Coat Weight'].default_value=.35;p.inputs['Coat Roughness'].default_value=.16
    rim=material('Dark amber honey edge',(.90,.39,.005),.27)
    crumb=material('Fine biscuit pores',(.84,.49,.12),.8)
    # Shallow mottling uses vertex colour, which survives GLB export.
    attr=dough.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='BakedTint'
    dough.node_tree.links.new(attr.outputs['Color'],dough.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    # Thin tapered paper tray, with actual creases and a wavy cut edge.
    w=1.31;d=1.26;h=.36
    sides=[((-w/2,-d/2),(w/2,-d/2),True),((w/2,-d/2),(w/2,d/2),False),((w/2,d/2),(-w/2,d/2),True),((-w/2,d/2),(-w/2,-d/2),False)]
    for si,(a,b,wide) in enumerate(sides):
        n=48;v=[]
        for j in range(5):
            t=j/4
            for i in range(n+1):
                u=i/n;x=a[0]+(b[0]-a[0])*u;y=a[1]+(b[1]-a[1])*u
                wave=math.cos(u*math.tau*7)
                scale=.88+.12*t+.010*math.cos(u*math.tau*9)*math.sin(t*math.pi/2)
                z=.02+t*(h-.065*(y/d+.5)+.018*wave)
                v.append((x*(scale+.025*wave*t),y*(scale+.025*wave*t),z))
        f=[]
        for j in range(4):
            for i in range(n):f.append((j*(n+1)+i,j*(n+1)+i+1,(j+1)*(n+1)+i+1,(j+1)*(n+1)+i))
        o=mesh('Pleated tapered paper wall '+str(si),v,f,paper)
        o.data.materials.append(inner)
        sol=o.modifiers.new('Actual thin paper','SOLIDIFY');sol.thickness=.008;sol.material_offset=1
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=sol.name)
        tube('Cream wavy paper lip '+str(si),v[-n-1:],.006,edge)
    mesh('Folded paper raised liner floor',[(-.575,-.545,.176),(.575,-.545,.176),(.575,.545,.176),(-.575,.545,.176)],[(0,1,2,3)],paper)
    # Printed flower lies on the front paper face: no green leaf emblem in reference.
    pts=[]
    for i in range(120):
        a=math.tau*i/120;delta=(a-math.pi/10+math.pi/5)%(math.tau/5)-math.pi/5
        r=.104*(.55*math.cos(delta)+math.sqrt(.45**2-(.55*math.sin(delta))**2));z=.175+r*math.sin(a)
        y=-d/2*(.88+.12*(z/h))-.009
        pts.append((r*math.cos(a),y,z))
    o=mesh('Flat five petal flower print',pts,[tuple(range(len(pts)))],orange,False)
    sphere('Cream flower print center',(0,-.604,.175),(.021,.001,.021),edge)
    for row,y in enumerate([-.295,.295]):
        for col,x in enumerate([-.302,.302]):
            before=set(bpy.data.objects);phase=.12+row*.08-col*.04
            base=flower_solid('Continuous toasted six-lobed cookie',.271,6,.105,baked,phase)
            top=flower_solid('Golden domed scalloped face',.255,6,.112,dough,phase);top.location.z=.010
            colors=top.data.color_attributes.new(name='BakedTint',type='FLOAT_COLOR',domain='POINT')
            for i,vert in enumerate(top.data.vertices):
                rad=math.hypot(vert.co.x,vert.co.y)/.28
                tone=.90+.10*random.random()-.14*max(0,rad-.55)
                rgb=(1*tone,.75*tone,.29*tone)
                colors.data[i].color=(*(linear(c) for c in rgb),1)
            glaze=flower_solid('Amber outline of honey flower',.123,5,.045,rim,.45);glaze.location.z=.106
            glaze=flower_solid('Glossy continuous honey flower',.111,5,.045,honey,.45);glaze.location.z=.115
            sphere('Honey center',(0,0,.174),(.034,.034,.010),honey)
            for j in range(35):
                a=random.uniform(0,math.tau);r=random.uniform(.163,.225)
                sphere('Tiny baked pore',(r*math.cos(a),r*math.sin(a),.136),(.0025,.003,.0009),crumb)
            objects=list(set(bpy.data.objects)-before)
            root=bpy.data.objects.new('Cookie '+str(row*2+col+1),None);bpy.context.collection.objects.link(root)
            for o in objects:o.parent=root
            root.location=(x,y,.158);root.rotation_euler=(0,0,math.radians((col*2-1)*3))
    # Export only the product, and convert curves so the GLB includes every paper lip.
    for o in list(bpy.context.scene.objects):
        if o.type=='CURVE':
            bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
    for o in bpy.context.scene.objects:
        if o.type=='MESH':
            bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
            bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
    path=OUT/'item_honey_cookie.glb'
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True)
    (OUT/'manifest.json').write_text(json.dumps(dict(id='item_honey_cookie',file=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),reference='web/assets/items/packing-v1/items.png [20,40,390,350]',cookieCount=4),indent=2),encoding='utf8')
    # Studio lights deliberately keep golden/amber contrast rather than bleaching it.
    floor=material('Ivory studio',(.95,.93,.88))
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.005));bpy.context.object.name='Studio floor';bpy.context.object.data.materials.append(floor)
    bpy.context.scene.world.color=(.23,.23,.23)
    for loc,power,size in [((-3,-4,7),450,4),((4,-1,4),180,3),((0,4,5),300,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.2))-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(.12,-4.3,5.0));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.95
    cam.rotation_euler=(Vector((0,0,.20))-cam.location).to_track_quat('-Z','Y').to_euler()
    s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=48;s.view_settings.view_transform='Standard'
    s.render.resolution_x=1200;s.render.resolution_y=1200;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Honey-cookie.blend'))
def render(mode):
    s=bpy.context.scene;cam=s.camera
    if mode=='detail':cam.location=(.1,-2,3.6);cam.data.ortho_scale=.78;target=Vector((-.302,-.295,.28))
    elif mode=='rear':cam.location=(2.7,3,2.8);cam.data.ortho_scale=2.05;target=Vector((0,0,.22))
    else:target=Vector((0,0,.20))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(OUT/(mode+'.png'));bpy.ops.render.render(write_still=True)
if '--' in sys.argv:
    mode=sys.argv[sys.argv.index('--')+1];render(mode)
else:setup();render('preview')
