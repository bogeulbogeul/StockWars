import bpy,bmesh,math,sys,json,hashlib
from pathlib import Path
from mathutils import Vector,noise
OUT=Path(__file__).resolve().parent
def lin(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def mat(name,c,rough=.7):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*(lin(x) for x in c),1);p.inputs['Roughness'].default_value=rough;return m
def mesh(name,v,f,m,smooth=True):
    d=bpy.data.meshes.new(name);d.from_pydata(v,[],f);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);d.materials.append(m)
    for p in d.polygons:p.use_smooth=smooth
    return o
def setup():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    crust=mat('Golden orange baked crust',(1,.55,.06),.34);p=crust.node_tree.nodes.get('Principled BSDF');p.inputs['Coat Weight'].default_value=.18;p.inputs['Coat Roughness'].default_value=.26
    attr=crust.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='BakedCrust';crust.node_tree.links.new(attr.outputs['Color'],p.inputs['Base Color'])
    profile=[(-1.12,0),(-1.09,.12),(-1.04,.21),(-.94,.29),(-.72,.35),(-.40,.39),(0,.39),(.38,.34),(.68,.27),(.85,.20),(.98,.11),(1.03,.075),(1.09,.09),(1.15,.085),(1.20,.045),(1.22,0)]
    samples=[]
    for k in range(len(profile)-1):
        p0=profile[max(0,k-1)];p1=profile[k];p2=profile[k+1];p3=profile[min(len(profile)-1,k+2)]
        for step in range(8):
            t=step/8
            x=p1[0]+(p2[0]-p1[0])*t
            r=.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t*t+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t*t*t)
            samples.append((x,max(0,r)))
    samples.append(profile[-1]);n=112;v=[]
    for x,r in samples:
        for i in range(n):
            a=math.tau*i/n;rough=.0006*noise.noise(Vector((x*35,math.cos(a)*20,math.sin(a)*20))) if r>.10 else 0
            v.append((x,(r+rough)*math.cos(a),.368+(r+rough)*.85*math.sin(a)))
    f=[]
    for j in range(len(samples)-1):
        for i in range(n):f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    o=mesh('Whole tapered loaf with continuous rounded tip',v,f,crust)
    colors=o.data.color_attributes.new(name='BakedCrust',type='FLOAT_COLOR',domain='POINT')
    for i,vert in enumerate(o.data.vertices):
        x,y,z=vert.co;coarse=noise.noise(Vector((x*8,y*11,z*13)));fine=noise.noise(Vector((x*80,y*80,z*80)))
        top=max(0,(z-.38)/.33);bake=max(0,min(1,.32+coarse*.55+fine*.15+top*.18))
        rgb=(1-.11*bake,.68-.28*bake,.17-.14*bake)
        colors.data[i].color=(*(lin(c) for c in rgb),1)
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
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(OUT/(mode+'.png'));bpy.ops.render.render(write_still=True)
if '--' in sys.argv:render(sys.argv[sys.argv.index('--')+1])
else:setup();render('preview')
