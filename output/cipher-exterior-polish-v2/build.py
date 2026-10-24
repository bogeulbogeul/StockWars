"""Brokerage roof and window finish, preserving the clock and door contracts."""
import bpy, bmesh, sys, math, json, hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cipher-exterior-clock-v1'/'CipherSecurities-clock.blend'
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,extrude,stroke,finish,material
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
scene=bpy.context.scene
before={o.name:tuple(o.matrix_world @ Vector(c) for c in o.bound_box)
        for o in scene.objects if o.name in ('Door_Assembly','Clock_Hour','Clock_Minute','Clock_Face')}
for o in list(scene.objects):
    if o.name.startswith(('Roof_','Front_Gable','Rear_Gable','Back_Gable_Join_Trim',
                          'Front_Window_Frame','Window_Cross_')):
        bpy.data.objects.remove(o,do_unlink=True)
blue=bpy.data.materials['Roof_Blue'];edge=bpy.data.materials['Roof_Edge_Blue']
ivory=bpy.data.materials['Wall_Ivory'];cream=bpy.data.materials['Trim_Cream']
def height(x):return 2.12-.78*abs(x)/1.34
for side in (-1,1):
    a,b=sorted((0,side*1.34))
    poly=[(a,height(a)),(b,height(b)),(b,height(b)-.075),(a,height(a)-.075)]
    extrude('Pitched_Blue_Roof',poly,-1.04,1.04,blue,.006)
    for i in range(8):
        xa=a+(b-a)*i/8+.003;xb=a+(b-a)*(i+1)/8-.003
        p=[(xa,height(xa)+.012),(xb,height(xb)+.012),
           (xb,height(xb)-.014),(xa,height(xa)-.014)]
        for j in range(8):
            ya=-1.04+2.08*j/8+.004;yb=-1.04+2.08*(j+1)/8-.004
            extrude('Blue_Clay_Roof_Tile',p,ya,yb,blue,.003)
for y in (-1.035,1.035):
    # Closed single contour: continuous gable fascia, no crossing end caps.
    extrude('Continuous_Blue_Gable_Fascia',
        [(-1.34,height(-1.34)-.015),(0,2.105),(1.34,height(1.34)-.015),
         (1.34,height(1.34)-.095),(0,2.025),(-1.34,height(-1.34)-.095)],
        y-.024,y+.024,edge,.005)
for x in (-1.315,1.315):
    box('Straight_Blue_Eave',(.065,2.08,.073),(x,0,height(x)-.055),edge,.006)
for j in range(8):
    a=-1.055+j*2.11/8;b=-1.055+(j+1)*2.11/8-.004
    # Half-round ridge cap, with sealed underside and consistent thickness.
    contour=[(.044*math.cos(t),2.115+.044*math.sin(t))
             for t in [math.pi*k/24 for k in range(25)]]
    extrude('Blue_Ridge_Cap',contour,a,b,blue,.003)
for name,ya,yb in [('Front_Pitched_Gable',-.895,-.77),('Rear_Pitched_Gable',.77,.895)]:
    extrude(name,[(-1.15,1.28),(1.15,1.28),(1.15,height(1.15)-.09),
                 (0,2.03),(-1.15,height(-1.15)-.09)],ya,yb,ivory,.005)
box('Front_Gable_Join_Trim',(2.3,.055,.04),(0,-.918,1.30),cream,.009)
box('Back_Gable_Join_Trim',(2.3,.055,.04),(0,.918,1.30),cream,.009)
def ring(name,cx):
    r=.17;w=.047;bottom=.39;spring=.68
    # Continuous closed arch ring including jambs and bottom, equal profile depth.
    def contour(radius,base):
        return [(cx-radius,base),(cx+radius,base),(cx+radius,spring)]+[
            (cx+radius*math.cos(math.pi*i/48),spring+radius*math.sin(math.pi*i/48)) for i in range(1,49)]
    inner=contour(r,bottom);outer=contour(r+w,bottom-w);n=len(inner)
    verts=[(x,y,z) for y in (-.957,-.88) for p in (outer,inner) for x,z in p]
    faces=[]
    for i in range(n):
        k=(i+1)%n
        faces.extend([(i,k,n+k,n+i),(2*n+i,3*n+i,3*n+k,2*n+k),
                      (i,2*n+i,2*n+k,k),(n+i,n+k,3*n+k,3*n+i)])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);finish(obj,cream,.005)
    # One cross-shaped solid removes coincident faces at the intersection.
    x=cx;z=.645;hw=.0115;hh=.0115
    p=[(x-hw,.392),(x+hw,.392),(x+hw,z-hh),(x+.172,z-hh),
       (x+.172,z+hh),(x+hw,z+hh),(x+hw,.801),(x-hw,.801),
       (x-hw,z+hh),(x-.172,z+hh),(x-.172,z-hh),(x-hw,z-hh)]
    extrude('Window_Unified_Recessed_Cross',p,-.946,-.924,cream,.004)
for x in (-.77,.77):ring('Window_Continuous_Arch_Frame',x)
scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith(('Studio_','Preview_')):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',
    use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
# Add studio only after asset export.
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.80,.84,.90,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Preview_Gray',(.72,.74,.77)),0)
for loc,power,size in [((-3,-4,6),350,5),((4,1,5),200,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc);lamp=bpy.context.object
    lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,1))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam
scene.render.resolution_x=1200;scene.render.resolution_y=1000
scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG'
for name,loc,target,scale in [
    ('front-right',(4,-6,3.5),(0,-.03,1.03),3.65),
    ('front',(0,-7,2.8),(0,-.03,1.03),3.65),
    ('rear',(4,6,3.5),(0,-.03,1.03),3.65),
    ('roof-detail',(3,-5,3.3),(.6,-.8,1.78),1.75),
    ('window-detail',(-2,-4,1.6),(-.77,-.94,.63),.85)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-clock.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'source':str(SOURCE),'roof':'pitched blue clay tiles',
    'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest(),
    'preserved':['Clock_Hour','Clock_Minute','Door_Assembly']},indent=2))
