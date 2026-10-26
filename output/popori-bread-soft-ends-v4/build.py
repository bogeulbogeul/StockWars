import bpy,bmesh,math,sys,json,hashlib,tempfile
from pathlib import Path
from mathutils import Vector,noise
OUT=Path(__file__).resolve().parent
(OUT/'export-temp').mkdir(exist_ok=True);tempfile.tempdir=str(OUT/'export-temp')
def lin(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def mat(name,c,rough=.7):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*(lin(x) for x in c),1);p.inputs['Roughness'].default_value=rough;return m
def mesh(name,v,f,m,smooth=True):
    d=bpy.data.meshes.new(name);d.from_pydata(v,[],f);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);d.materials.append(m)
    for p in d.polygons:p.use_smooth=smooth
    return o
def setup():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    crust=mat('Freshly baked golden crust',(1,.55,.06),.40);p=crust.node_tree.nodes.get('Principled BSDF');p.inputs['Coat Weight'].default_value=.12;p.inputs['Coat Roughness'].default_value=.30
    for name,socket in [('color','Base Color'),('roughness','Roughness'),('normal',None)]:
        im=bpy.data.images.load(str(OUT/f'crust-{name}.png'));im.pack()
        if name!='color':im.colorspace_settings.name='Non-Color'
        tex=crust.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im
        if socket:crust.node_tree.links.new(tex.outputs['Color'],p.inputs[socket])
        else:
            normal=crust.node_tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.25
            crust.node_tree.links.new(tex.outputs['Color'],normal.inputs['Color']);crust.node_tree.links.new(normal.outputs['Normal'],p.inputs['Normal'])
    # Angle sampling produces rounded poles, unlike linearly sampled radial caps.
    # A single monotone taper replaces the previous pinched neck and terminal ball.
    samples=[]
    for k in range(193):
        t=math.pi*k/192
        samples.append((.025-1.145*math.cos(t),.38*math.sin(t)*(1+.24*math.cos(t))))
    n=112;v=[]
    for x,r in samples:
        for i in range(n):
            a=math.tau*i/n;rough=.0006*noise.noise(Vector((x*35,math.cos(a)*20,math.sin(a)*20))) if r>.10 else 0
            natural=.002*math.sin(a*3+x*2.1)*(r/.39)**2
            v.append((x,(r+rough+natural)*math.cos(a),max(.036,.368+(r+rough+natural)*.85*math.sin(a))))
    f=[]
    for j in range(len(samples)-1):
        for i in range(n):f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    o=mesh('Whole loaf with softly rounded unpinched ends',v,f,crust)
    uv=o.data.uv_layers.new()
    for face in o.data.polygons:
        j,i=divmod(face.index,n);u0=j/(len(samples)-1);u1=(j+1)/(len(samples)-1);v0=i/n;v1=(i+1)/n
        for loop,co in zip(face.loop_indices,[(u0,v0),(u0,v1),(u1,v1),(u1,v0)]):uv.data[loop].uv=co
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
    paper=mat('Cream folded baking paper',(1,.90,.74),.90);cut=mat('Pale paper edge',(1,.96,.85),.9)
    printed=mat('Flat flower and leaf paper print',(1,1,1),.9);im=bpy.data.images.load(str(OUT/'paper-print.png'));im.pack();t=printed.node_tree.nodes.new('ShaderNodeTexImage');t.image=im;printed.node_tree.links.new(t.outputs['Color'],printed.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    w=2.53;d=.97;h=.265
    for side,(a,b) in enumerate([((-w/2,-d/2),(w/2,-d/2)),((w/2,-d/2),(w/2,d/2)),((w/2,d/2),(-w/2,d/2)),((-w/2,d/2),(-w/2,-d/2))]):
        nwall=64;rows=4;vv=[]
        for j in range(rows+1):
            t=j/rows
            for i in range(nwall+1):
                u=i/nwall;x=a[0]+(b[0]-a[0])*u;y=a[1]+(b[1]-a[1])*u
                fold=math.cos(math.tau*u*(7 if side%2==0 else 3));s=.91+.09*t+.007*fold*t
                vv.append((x*s,y*s,.025+t*(h+.008*fold)))
        ff=[]
        for j in range(rows):
            for i in range(nwall):ff.append((j*(nwall+1)+i,j*(nwall+1)+i+1,(j+1)*(nwall+1)+i+1,(j+1)*(nwall+1)+i))
        wall=mesh('Thin folded paper wall '+str(side),vv,ff,printed if side==0 else paper)
        uv=wall.data.uv_layers.new()
        for face in wall.data.polygons:
            for loop in face.loop_indices:
                vi=wall.data.loops[loop].vertex_index;uv.data[loop].uv=(vi%(nwall+1)/nwall,vi//(nwall+1)/rows)
        wall.data.materials.append(paper);s=wall.modifiers.new('Actual paper thickness','SOLIDIFY');s.thickness=.005;s.material_offset=1
        bpy.context.view_layer.objects.active=wall;bpy.ops.object.modifier_apply(modifier=s.name)
        curve=bpy.data.curves.new('Paper cut rim','CURVE');curve.dimensions='3D';curve.bevel_depth=.0035;curve.bevel_resolution=2
        spline=curve.splines.new('POLY');spline.points.add(nwall)
        for p,co in zip(spline.points,vv[-nwall-1:]):p.co=(*co,1)
        rim=bpy.data.objects.new('Fine paper cut rim '+str(side),curve);bpy.context.collection.objects.link(rim);curve.materials.append(cut)
        bpy.ops.object.select_all(action='DESELECT');rim.select_set(True);bpy.context.view_layer.objects.active=rim;bpy.ops.object.convert(target='MESH')
    mesh('Baking paper floor',[(-1.16,-.44,.035),(1.16,-.44,.035),(1.16,.44,.035),(-1.16,.44,.035)],[(0,1,2,3)],paper)
    path=OUT/'item_popori_bread.glb';bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True)
    (OUT/'manifest.json').write_text(json.dumps(dict(id='item_popori_bread',file=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),reference='web/assets/items/packing-v1/popori-bread-v2.png',wholeLoaf=True),indent=2),encoding='utf8')
    floor=mat('Warm ivory studio',(.94,.92,.87),.9);bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.015));bpy.context.object.name='Studio floor';bpy.context.object.data.materials.append(floor)
    bpy.context.scene.world.color=(.3,.3,.3)
    for loc,power,size in [((-3,-4,6),500,4),((3,-1,4),180,3),((0,4,5),350,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.3))-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(-3,-5,3.6));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=3.05
    s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=40;s.view_settings.view_transform='Standard';s.view_settings.look='None';s.view_settings.exposure=-.35
    s.render.resolution_x=1500;s.render.resolution_y=1050;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Popori-bread.blend'))
def render(mode):
    s=bpy.context.scene;cam=s.camera;target=Vector((0,0,.34))
    if mode=='rear':cam.location=(-3,5,3.5)
    if mode=='detail':cam.location=(1,-3,2.5);cam.data.ortho_scale=1.45;target=Vector((.35,-.14,.35))
    if mode=='left-end':cam.location=(-3,-4,2.5);cam.data.ortho_scale=1.15;target=Vector((-.80,0,.33))
    if mode=='right-end':cam.location=(3,-4,2.5);cam.data.ortho_scale=1.15;target=Vector((.82,0,.33))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(OUT/(mode+'.png'));bpy.ops.render.render(write_still=True)
if '--' in sys.argv:render(sys.argv[sys.argv.index('--')+1])
else:setup();render('preview')
