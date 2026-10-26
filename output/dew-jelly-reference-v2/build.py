import bpy,bmesh,math,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parent
def lin(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def mat(name,color,rough):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*(lin(c) for c in color),1);p.inputs['Roughness'].default_value=rough;return m
def mesh(name,v,f,materials,smooth=True):
    d=bpy.data.meshes.new(name);d.from_pydata(v,[],f);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o)
    for m in materials:d.materials.append(m)
    for p in d.polygons:p.use_smooth=smooth
    return o
def clean(o):
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
def setup():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    jelly=mat('Clear turquoise dew jelly',(.12,.80,.80),.13);p=jelly.node_tree.nodes.get('Principled BSDF')
    p.inputs['Transmission Weight'].default_value=.65;p.inputs['IOR'].default_value=1.34;p.inputs['Coat Weight'].default_value=.23;p.inputs['Coat Roughness'].default_value=.11
    p.inputs['Emission Color'].default_value=(.04,.5,.35,1);p.inputs['Emission Strength'].default_value=.035
    colors=jelly.node_tree.nodes.new('ShaderNodeVertexColor');colors.layer_name='DewGradient';jelly.node_tree.links.new(colors.outputs['Color'],p.inputs['Base Color'])
    profile=[(0,.055)]
    def bez(a,b,c,d,n):
        for k in range(1,n+1):
            t=k/n;u=1-t;profile.append(tuple(u**3*a[i]+3*u*u*t*b[i]+3*u*t*t*c[i]+t**3*d[i] for i in range(2)))
    # r,z outline: rounded belly, continuous narrowing, tiny softened droplet tip.
    bez((0,.055),(.22,.055),(.34,.12),(.365,.26),32)
    bez((.365,.26),(.405,.46),(.26,.67),(.135,.82),42)
    bez((.135,.82),(.080,.886),(.026,.947),(.012,.962),24)
    bez((.012,.962),(.008,.968),(.004,.970),(0,.970),12)
    N=96;v=[]
    for r,z in profile:
        for i in range(N):
            a=math.tau*i/N;lean=.018*max(0,(z-.35)/.62)**2
            v.append((r*math.cos(a)+lean,r*math.sin(a)*.96,z))
    f=[]
    for j in range(len(profile)-1):
        for i in range(N):f.append((j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i))
    o=mesh('Continuous soft teardrop jelly',v,f,[jelly]);attr=o.data.color_attributes.new(name='DewGradient',type='FLOAT_COLOR',domain='POINT')
    for i,vert in enumerate(o.data.vertices):
        t=max(0,min(1,(vert.co.z-.06)/.8));t=t*t*(3-2*t)
        low=(.72,.97,.83);high=(.035,.72,.80);rgb=tuple(a+(b-a)*t for a,b in zip(low,high));attr.data[i].color=(*(lin(c) for c in rgb),1)
    clean(o)
    paper=mat('Warm cream pleated paper',(1,.93,.81),.88);light=mat('Light folded paper',(1,.97,.90),.90)
    # The paper cup has a real closed bottom and thin inner/outer walls.
    profile=[(0,.035),(.30,.035),(.312,.045),(.35,.10),(.46,.23),(.50,.290),(.493,.290),(.454,.23),(.344,.10),(.304,.055),(0,.055)]
    N=144;v=[]
    for r,z in profile:
        for i in range(N):
            a=math.tau*i/N;t=max(0,min(1,(z-.045)/.245));pleat=math.cos(18*a)
            rr=r+(.018*pleat*t if r>0 else 0);zz=z+(.006*pleat*t if r>0 else 0)
            v.append((rr*math.cos(a),rr*math.sin(a),zz))
    f=[]
    for j in range(len(profile)-1):
        for i in range(N):f.append((j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i))
    cup=mesh('Thin eighteen-pleat cream paper cup',v,f,[paper,light],False)
    for face in cup.data.polygons:
        face.material_index=1 if (face.index%N)//4%2==0 else 0
    clean(cup)
    path=OUT/'item_dew_jelly.glb';bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True)
    (OUT/'manifest.json').write_text(json.dumps(dict(id='item_dew_jelly',file=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),reference='web/assets/items/packing-v1/items.png [1210,430,340,330]',paperPleats=18),indent=2),encoding='utf8')
    floor=mat('Warm ivory studio',(.94,.92,.87),.88);bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.030));bpy.context.object.name='Studio floor';bpy.context.object.data.materials.append(floor)
    bpy.context.scene.world.color=(.3,.3,.3)
    for loc,power,size in [((-3,-4,5),420,3),((3,-2,3),180,3),((0,3,4),400,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size
        if loc[0]<0:o.data.shape='RECTANGLE';o.data.size=.85;o.data.size_y=3.2
        o.rotation_euler=(Vector((0,0,.45))-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(1.3,-4,2.0));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.35
    s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=48;s.cycles.transmission_bounces=8;s.view_settings.view_transform='AgX';s.render.resolution_x=1100;s.render.resolution_y=1200;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Dew-jelly.blend'))
def render(mode):
    s=bpy.context.scene;cam=s.camera;target=Vector((0,0,.46))
    if mode=='rear':cam.location=(-1.4,4,2.0)
    if mode=='detail':cam.location=(1,-3,1.7);cam.data.ortho_scale=.96;target=Vector((0,0,.29))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(OUT/(mode+'.png'));bpy.ops.render.render(write_still=True)
if '--' in sys.argv:render(sys.argv[sys.argv.index('--')+1])
else:setup();render('preview')
