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
    juice=mat('Golden apple juice',(1,.68,.012),.10);p=juice.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=.85;p.inputs['IOR'].default_value=1.34
    p.inputs['Emission Color'].default_value=(1,.32,.001,1);p.inputs['Emission Strength'].default_value=.08
    green=mat('Leaf green screw cap',(.34,.48,.13),.53);light=mat('Cap inset top',(.52,.65,.27),.55)
    collar=mat('Golden tamper band',(.94,.66,.21),.40);ivory=mat('Cream neck seal',(1,.88,.61),.6)
    outer=[(0,0),(0,.188),(.008,.210),(.025,.229),(.055,.242),(.12,.245),(.78,.245),(.86,.240),(.91,.225),(.98,.195),(1.05,.16),(1.11,.13),(1.16,.122),(1.24,.122)]
    inner=[(1.24,.113),(1.16,.113),(1.11,.121),(1.05,.151),(.98,.186),(.91,.216),(.86,.231),(.78,.236),(.12,.236),(.060,.231),(.035,.207),(.031,0)]
    lathe('Hollow smooth glass bottle',outer+inner,glass)
    lathe('Juice inside glass',[(.032,0),(.032,.18),(.045,.214),(.07,.231),(.12,.234),(.78,.234),(.86,.229),(.91,.213),(.98,.183),(1.05,.148),(1.11,.118),(1.145,.109),(1.145,0)],juice)
    lathe('Gold tamper neck ring',[(1.164,0),(1.164,.132),(1.17,.146),(1.188,.146),(1.196,.135),(1.196,0)],collar)
    lathe('Cream seal under cap',[(1.198,0),(1.198,.137),(1.208,.142),(1.218,.138),(1.218,0)],ivory)
    lathe('Fine ribbed green cap',[(1.215,0),(1.215,.156),(1.223,.174),(1.245,.178),(1.352,.178),(1.37,.169),(1.375,.151),(1.375,0)],green,.009)
    lathe('Inset green cap top',[(1.374,0),(1.374,.143),(1.378,.145),(1.383,.135),(1.383,0)],light)
    # Label follows the glass, has its own thin paper edge and printed apple/leaf art.
    label=mat('Matte cream paper apple print',(1,1,1),.80)
    im=bpy.data.images.load(str(OUT/'apple-label.png'));im.pack();t=label.node_tree.nodes.new('ShaderNodeTexImage');t.image=im
    label.node_tree.links.new(t.outputs['Color'],label.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    label.node_tree.links.new(t.outputs['Alpha'],label.node_tree.nodes.get('Principled BSDF').inputs['Alpha'])
    v=[];n=64;rows=12
    for j in range(rows+1):
        vv=j/rows
        for i in range(n+1):
            u=i/n;a=(u-.5)*math.radians(110)
            bottom=.225+.025*(2*u-1)**2;top=.875-.045*(2*u-1)**2
            z=bottom+(top-bottom)*vv;r=.2468 if z<.78 else .2468-(z-.78)*.065
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
    path=OUT/'item_apple_juice.glb';bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True)
    (OUT/'manifest.json').write_text(json.dumps(dict(id='item_apple_juice',file=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),reference='web/assets/items/packing-v1/items.png [920,35,155,355]'),indent=2),encoding='utf8')
    floor=mat('Warm ivory studio',(.94,.92,.87),.85);bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.003));bpy.context.object.name='Studio floor';bpy.context.object.data.materials.append(floor)
    bpy.context.scene.world.color=(.35,.35,.35)
    for loc,power,size in [((-3,-4,6),500,4),((3,-2,3),220,2),((0,3,4),500,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.65))-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(.8,-4,2.0));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.65
    s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=48;s.cycles.transmission_bounces=8;s.view_settings.view_transform='AgX'
    s.render.resolution_x=950;s.render.resolution_y=1250;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Apple-juice.blend'))
def render(mode):
    s=bpy.context.scene;cam=s.camera;target=Vector((0,0,.69))
    if mode=='rear':cam.location=(1,4,2)
    if mode=='detail':cam.location=(.7,-3,2);cam.data.ortho_scale=.65;target=Vector((0,0,1.13))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(OUT/(mode+'.png'));bpy.ops.render.render(write_still=True)
if '--' in sys.argv:render(sys.argv[sys.argv.index('--')+1])
else:setup();render('preview')
