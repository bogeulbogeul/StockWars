import bpy,bmesh,math,json,hashlib,sys
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parent
def mat(name,c,rough=.5):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
    c=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c)
    p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;return m
def mesh(name,v,f,m,smooth=True):
    d=bpy.data.meshes.new(name);d.from_pydata(v,[],f);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);d.materials.append(m)
    for p in d.polygons:p.use_smooth=smooth
    return o
def lathe(name,profile,m,ribs=0):
    n=96;v=[]
    for z,r in profile:
        for i in range(n):
            a=math.tau*i/n;rr=r*(1+ribs*math.cos(a*32));v.append((rr*math.cos(a),rr*math.sin(a),z))
    f=[]
    for j in range(len(profile)-1):
        for i in range(n):f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    o=mesh(name,v,f,m);bm=bmesh.new();bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();return o
def setup():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    glass=mat('Clear bottle glass',(1,1,1),.065);p=glass.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=1;p.inputs['IOR'].default_value=1.45
    juice=mat('Ruby berry juice',(.88,.06,.24),.11);p=juice.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=.70;p.inputs['IOR'].default_value=1.34
    p.inputs['Emission Color'].default_value=(.65,.008,.035,1);p.inputs['Emission Strength'].default_value=.12
    green=mat('Leaf green screw cap',(.34,.48,.13),.53);light=mat('Cap inset top',(.52,.65,.27),.55)
    collar=mat('Golden tamper band',(.94,.66,.21),.40);ivory=mat('Cream neck seal',(1,.88,.61),.6)
    control=[(0,.28),(.02,.33),(.065,.375),(.14,.415),(.26,.45),(.40,.46),(.53,.45),(.66,.418),(.78,.36),(.87,.29),(.94,.224),(.98,.20),(1.10,.20)]
    def radius(z):
        for k in range(len(control)-1):
            if z<=control[k+1][0]:
                a=control[max(0,k-1)];b=control[k];c=control[k+1];e=control[min(len(control)-1,k+2)];t=(z-b[0])/(c[0]-b[0])
                return .5*(2*b[1]+(-a[1]+c[1])*t+(2*a[1]-5*b[1]+4*c[1]-e[1])*t*t+(-a[1]+3*b[1]-3*c[1]+e[1])*t*t*t)
        return control[-1][1]
    dense=[(1.10*k/160,radius(1.10*k/160)) for k in range(161)]
    outer=[(0,0)]+dense
    inner=[(z,r-.009) for z,r in reversed(dense) if z>=.034]+[(.03,0)]
    lathe('Hollow smooth glass bottle',outer+inner,glass)
    lathe('Juice inside glass',[(.032,0)]+[(z,r-.012) for z,r in dense if .034<=z<=1.025]+[(1.025,0)],juice)
    cloth=mat('Matte leaf green gathered neck cover',(.49,.59,.24),.82)
    vv=[];N=96;profile=[(1.076,.205),(1.047,.235),(1.015,.272),(.985,.296),(.979,.296),(.994,.276),(1.048,.22),(1.076,.198)]
    for z,r in profile:
        for i in range(N):
            a=math.tau*i/N;gather=max(0,min(1,(1.076-z)/.097));wave=math.cos(12*a)
            rr=r+.018*wave*gather;zz=z+.010*wave*gather
            vv.append((rr*math.cos(a),rr*math.sin(a),zz))
    ff=[]
    for j in range(len(profile)):
        for i in range(N):ff.append((j*N+i,j*N+(i+1)%N,((j+1)%len(profile))*N+(i+1)%N,((j+1)%len(profile))*N+i))
    skirt=mesh('Continuous scalloped gathered neck skirt',vv,ff,cloth)
    bm=bmesh.new();bm.from_mesh(skirt.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(skirt.data);bm.free()
    lathe('Gold neck tie ring',[(1.06,0),(1.06,.21),(1.068,.23),(1.084,.23),(1.09,.214),(1.09,0)],collar)
    lathe('Cream seal under cap',[(1.09,0),(1.09,.208),(1.098,.213),(1.105,.208),(1.105,0)],ivory)
    lathe('Fine ribbed green cap',[(1.105,0),(1.105,.224),(1.115,.242),(1.205,.242),(1.22,.232),(1.225,.214),(1.225,0)],green,.007)
    lathe('Inset green cap top',[(1.224,0),(1.224,.211),(1.228,.214),(1.234,.202),(1.234,0)],light)
    # Label follows the glass, has its own thin paper edge and printed apple/leaf art.
    label=mat('Matte cream paper berry print',(1,1,1),.80)
    im=bpy.data.images.load(str(OUT/'berry-label.png'));im.pack();t=label.node_tree.nodes.new('ShaderNodeTexImage');t.image=im
    label.node_tree.links.new(t.outputs['Color'],label.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    label.node_tree.links.new(t.outputs['Alpha'],label.node_tree.nodes.get('Principled BSDF').inputs['Alpha'])
    v=[];n=64;rows=64
    for j in range(rows+1):
        vv=j/rows
        for i in range(n+1):
            u=i/n;a=(u-.5)*math.radians(110)
            bottom=.225+.030*(2*u-1)**2;top=.715-.040*(2*u-1)**2
            z=bottom+(top-bottom)*vv
            r=radius(z)+.003
            v.append((r*math.sin(a),-r*math.cos(a),z))
    f=[]
    for j in range(rows):
        for i in range(n):f.append((j*(n+1)+i,j*(n+1)+i+1,(j+1)*(n+1)+i+1,(j+1)*(n+1)+i))
    o=mesh('Curved printed paper label',v,f,label);uv=o.data.uv_layers.new()
    for face in o.data.polygons:
        for loop in face.loop_indices:
            vi=o.data.loops[loop].vertex_index;uv.data[loop].uv=(vi%(n+1)/n,vi//(n+1)/rows)
    sol=o.modifiers.new('Thin label paper','SOLIDIFY');sol.thickness=.0007;sol.offset=1
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=sol.name)
    path=OUT/'item_berry_juice.glb';bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True)
    (OUT/'manifest.json').write_text(json.dumps(dict(id='item_berry_juice',file=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),reference='web/assets/items/packing-v1/items.png [1665,25,275,370]'),indent=2),encoding='utf8')
    floor=mat('Warm ivory studio',(.94,.92,.87),.85);bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.003));bpy.context.object.name='Studio floor';bpy.context.object.data.materials.append(floor)
    bpy.context.scene.world.color=(.35,.35,.35)
    for loc,power,size in [((-3,-4,6),500,4),((3,-2,3),220,2),((0,3,4),500,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.65))-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(.7,-4,2.0));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.55
    s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=48;s.cycles.transmission_bounces=8;s.view_settings.view_transform='AgX'
    s.render.resolution_x=950;s.render.resolution_y=1250;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Berry-juice.blend'))
def render(mode):
    s=bpy.context.scene;cam=s.camera;target=Vector((0,0,.60))
    if mode=='rear':cam.location=(1,4,2)
    if mode=='detail':cam.location=(.30,-3,1.3);cam.data.ortho_scale=1.02;target=Vector((0,-.20,.48))
    if mode=='neck':cam.location=(1,-3,2);cam.data.ortho_scale=.84;target=Vector((0,0,1.05))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(OUT/(mode+'.png'));bpy.ops.render.render(write_still=True)
if '--' in sys.argv:render(sys.argv[sys.argv.index('--')+1])
else:setup();render('preview')
