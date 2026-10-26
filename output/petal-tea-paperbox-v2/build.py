"""Thin folded paperboard carton with original printed panels, not raised badges."""
import bpy,bmesh,math,json,hashlib,sys,struct
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parent
def mat(name,rgb):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    rgb=tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in rgb)
    p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Roughness'].default_value=.88
    p.inputs['Specular IOR Level'].default_value=.18
    return m
def printmat(name):
    m=mat('Matte paper print '+name,(1,1,1));im=bpy.data.images.load(str(OUT/f'print-{name}.png'));im.pack()
    t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=im
    m.node_tree.links.new(t.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);return m
def poly(name,vertices,faces,materials,indices=None,thick=0):
    d=bpy.data.meshes.new(name);d.from_pydata(vertices,[],faces);d.update()
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o)
    for m in materials:d.materials.append(m)
    uv=d.uv_layers.new()
    for i,p in enumerate(d.polygons):
        if indices:p.material_index=indices[i]
        coords=[(0,0),(1,0),(1,1),(0,1)] if len(p.vertices)==4 else [(0,0),(1,0),(.5,1)]
        for loop,co in zip(p.loop_indices,coords):uv.data[loop].uv=co
    if thick:
        sol=o.modifiers.new('Thin folded paperboard','SOLIDIFY');sol.thickness=thick;sol.offset=-1
        sol.material_offset=len(materials)-1
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=sol.name)
    return o
def strip(name,a,b,width,m):
    v=Vector(b)-Vector(a);side=v.cross(Vector((0,1,0)))
    if side.length<.00001:side=v.cross(Vector((1,0,0)))
    side.normalize();side*=width/2
    return poly(name,[Vector(a)-side,Vector(b)-side,Vector(b)+side,Vector(a)+side],[(0,1,2,3)],[m])
def setup():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    pink=mat('Uncoated blush paperboard',(1,.54,.59));edge=mat('Light paper cut edges',(1,.84,.76));crease=mat('Compressed pink fold',(.78,.32,.38))
    front,roof,flap,side=[printmat(k) for k in ['front','roof','flap','side']]
    w=.98;d=.60;h=.68
    # Body is one closed box with flat, printed faces and a tiny paper-sized bevel.
    v=[(-w/2,-d/2,0),(w/2,-d/2,0),(w/2,d/2,0),(-w/2,d/2,0),(-w/2,-d/2,h),(w/2,-d/2,h),(w/2,d/2,h),(-w/2,d/2,h)]
    o=poly('Closed printed paperboard body',v,[(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(3,2,1,0),(4,5,6,7)],[front,side,pink,edge],[0,1,2,1,2,2])
    b=o.modifiers.new('Crisp paper corners','BEVEL');b.width=.0025;b.segments=2;b.affect='EDGES'
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name)
    # Front roof plane and back plane fold into a pinched top, as in the reference.
    top=1.00;ridgeY=.035
    poly('Front folded shoulder',[(-w/2,-d/2,h),(w/2,-d/2,h),(w/2,ridgeY,top),(-w/2,ridgeY,top)],[(0,1,2,3)],[roof,edge],thick=.004)
    poly('Back folded shoulder',[(w/2,d/2,h),(-w/2,d/2,h),(-w/2,ridgeY,top),(w/2,ridgeY,top)],[(0,1,2,3)],[pink,edge],thick=.004)
    for x,sgn in [(-w/2,-1),(w/2,1)]:
        poly('Triangular tucked side gusset',[ (x,-d/2,h),(x,d/2,h),(x,ridgeY,top)],[(0,1,2)],[pink,edge],thick=.003)
        # Fold crease remains very thin, unlike a structural beam or a tube.
        poly('Gusset scored fold',[(x+sgn*.002,-d/2,h+.003),(x+sgn*.002,ridgeY,top-.012),(x+sgn*.002,ridgeY+.007,top-.012)],[(0,1,2)],[crease])
    # Broad folded-down seal flap: finite board thickness, two creases and free edge.
    fy=-.015;fz=1.280
    poly('Folded top seal flap',[(-w/2,ridgeY-.007,top+.008),(w/2,ridgeY-.007,top+.008),(w/2,fy,fz),(-w/2,fy,fz)],[(0,1,2,3)],[flap,edge],thick=.005)
    strip('Top flap crease',(-w/2,ridgeY-.009,top+.006),(w/2,ridgeY-.009,top+.006),.0025,crease)
    strip('Shoulder score',(-w/2,-d/2-.001,h+.002),(w/2,-d/2-.001,h+.002),.002,crease)
    # Rear glued overlap and folded bottom construction are visible on inspection.
    poly('Rear narrow glue lap',[(-w/2+.018,d/2+.002,.02),(-w/2+.065,d/2+.002,.02),(-w/2+.065,d/2+.002,h-.01),(-w/2+.018,d/2+.002,h-.01)],[(0,1,2,3)],[pink,edge],thick=.002)
    strip('Rear glue seam',(-w/2+.065,d/2+.004,.02),(-w/2+.065,d/2+.004,h-.01),.0015,crease)
    poly('Bottom folded end flap',[(-w/2+.015,-d/2+.015,-.001),(w/2-.015,-d/2+.015,-.001),(.18,.02,-.001),(-.18,.02,-.001)],[(0,1,2,3)],[pink,edge],thick=.002)
    product=list(bpy.context.scene.objects)
    for o in product:
        if o.type=='MESH':
            bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
    p=OUT/'item_petal_tea.glb';bpy.ops.export_scene.gltf(filepath=str(p),export_format='GLB',export_yup=True)
    (OUT/'manifest.json').write_text(json.dumps(dict(id='item_petal_tea',file=p.name,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),reference='web/assets/items/packing-v1/items.png [440,40,350,350]',paperThickness=.004,material='matte uncoated printed paperboard'),indent=2),encoding='utf8')
    floor=mat('Warm studio',( .95,.93,.89));bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.006));bpy.context.object.name='Studio floor';bpy.context.object.data.materials.append(floor)
    bpy.context.scene.world.color=(.28,.28,.28)
    for loc,power,size in [((-3,-4,6),400,4),((4,-1,4),180,3),((1,3,5),300,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.6))-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(2.2,-5,2.7));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.80
    s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=32;s.view_settings.view_transform='AgX'
    s.render.resolution_x=1100;s.render.resolution_y=1200;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Petal-tea-paperbox.blend'))
def render(mode):
    s=bpy.context.scene;cam=s.camera;target=Vector((0,0,.65))
    if mode=='rear':cam.location=(-2,4,2.8)
    if mode=='detail':cam.location=(1.7,-3,2.7);cam.data.ortho_scale=.95;target=Vector((0,0,1.05))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(OUT/(mode+'.png'));bpy.ops.render.render(write_still=True)
if '--' in sys.argv:render(sys.argv[sys.argv.index('--')+1])
else:setup();render('preview')
