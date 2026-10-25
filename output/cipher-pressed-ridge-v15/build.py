"""Broad low flat-crowned ridge tiles instead of round barrel profiles."""
import bpy,bmesh,sys,math,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import finish
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-reference-match-v14'/'CipherSecurities-reference-match.blend'))
scene=bpy.context.scene;cam=scene.camera;blue=bpy.data.materials['Roof_Blue']
full=(cam.location.copy(),cam.rotation_euler.copy(),cam.data.type,cam.data.lens)

def close_render(name):
    cam.data.type='ORTHO';cam.data.ortho_scale=2.4
    cam.location=(3.5,-7,3.65)
    cam.rotation_euler=(Vector((2.05,0,2.30))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.resolution_x=1200;scene.render.resolution_y=700
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)

scene.cycles.samples=24
close_render('before-close')
for obj in list(scene.objects):
    if obj.name.startswith(('Wing_Horizontal_Ridge_Cap','Wing_Outer_Hip_Cap','Wing_Closed_Threeway_Junction')):
        bpy.data.objects.remove(obj,do_unlink=True)

def caps(name,start,end,width=.095,seat=.039,segment=True):
    start,end=Vector(start)+Vector((0,0,.012)),Vector(end)+Vector((0,0,.012))
    axis=(end-start).normalized();length=(end-start).length
    up=(Vector((0,0,1))-axis*axis.z).normalized();across=axis.cross(up).normalized()
    # A visibly FLAT crown with short rounded shoulders, not a scaled circle.
    profile=[(-1,-seat),(-.83,.004),(-.60,.014),(.60,.014),(.83,.004),(1,-seat),(0,-.010)]
    pieces=[];step=.24 if segment else length
    for i in range(math.ceil(length/step)):
        lo=i*step;hi=min(length,(i+1)*step)
        a=start+axis*(lo+(.0015 if segment else 0));b=start+axis*(hi-(.0015 if segment else 0))
        cross=[across*(u*width)+up*z for u,z in profile];n=len(cross)
        vertices=[tuple(p+v) for p in (a,b) for v in cross]
        faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
        faces += [(j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)]
        mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces)
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
        obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);finish(obj,blue,.003)
        pieces.append(obj)
    return pieces

def hip(side,sy,t):return Vector((side*(2.53+.60*t),sy*1.08*t,2.382-.43*t))

for side in (-1,1):
    caps('Wing_Pressed_Horizontal_Cap',(side*.94,0,2.382),(side*2.416,0,2.382))
    for sy in (-1,1):
        caps('Wing_Pressed_Hip_Cap',hip(side,sy,.113),hip(side,sy,1),.083,.036)
    pieces=caps('Wing_Pressed_Junction',(side*2.415,0,2.382),(side*2.565,0,2.382),segment=False)
    for sy in (-1,1):pieces+=caps('Wing_Pressed_Junction',hip(side,sy,-.025),hip(side,sy,.115),.083,.036,False)
    base=pieces[0]
    for obj in pieces[1:]:
        bpy.context.view_layer.objects.active=base
        modifier=base.modifiers.new('Continuous_Union','BOOLEAN');modifier.operation='UNION';modifier.object=obj
        bpy.ops.object.modifier_apply(modifier=modifier.name);bpy.data.objects.remove(obj,do_unlink=True)
    bpy.context.view_layer.objects.active=base
    modifier=base.modifiers.new('Junction_Polish','REMESH');modifier.mode='VOXEL';modifier.voxel_size=.003
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    modifier=base.modifiers.new('Small_Edge_Polish','SMOOTH');modifier.factor=.30;modifier.iterations=2
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    for face in base.data.polygons:face.use_smooth=True
    bm=bmesh.new();bm.from_mesh(base.data);assert all(e.is_manifold for e in bm.edges);bm.free()

bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type in ('MESH','CURVE','EMPTY') and not obj.name.startswith(('Preview_','Studio_')):obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
close_render('after-close')
cam.location,cam.rotation_euler,cam.data.type,cam.data.lens=full
scene.render.resolution_x=803;scene.render.resolution_y=675
scene.render.filepath=str(ROOT/'matched.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-pressed-ridge.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest(),
    'horizontalCapWidth':.190,'flatCrownWidth':.114,'crownRise':.014,
    'hipCapWidth':.166,'junctionManifold':True,'gameApplied':False},indent=2))
