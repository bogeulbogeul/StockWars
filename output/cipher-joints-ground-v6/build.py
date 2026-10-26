"""Clean stair solid, grounded column bases and closed roof edge trim."""
import bpy,bmesh,sys,math,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,extrude,finish
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-door-detail-v5'/'CipherSecurities-door-detail.blend'))
scene=bpy.context.scene;cream=bpy.data.materials['Trim_Cream'];blue=bpy.data.materials['Roof_Blue']
for o in list(scene.objects):
    if o.name.startswith(('Grand_Entry_Step','Portico_Landing','Continuous_Cream_Pediment_Frame','Portico_Entablature','Central_Continuous_Side_Cornice')):
        bpy.data.objects.remove(o,do_unlink=True)
# One watertight stair profile, equal 0.10 rises, aligned constant-width sides.
profile=[(-.80,0),(-2.11,0),(-2.11,.10),(-1.83,.10),(-1.83,.20),(-1.55,.20),(-1.55,.30),(-.80,.30)]
stairs=extrude('Entry_Continuous_Three_Step_Solid',profile,-1.46,1.46,cream,.008)
stairs.rotation_euler.z=math.pi/2
# Preserve every base's top and footprint; extend its underside exactly to ground.
grounded=[]
for o in list(scene.objects):
    if o.name.startswith(('Portico_Column_Plinth','Wing_Corner_Foot')):
        p=[o.matrix_world @ Vector(c) for c in o.bound_box]
        lo=Vector(tuple(min(v[i] for v in p) for i in range(3)));hi=Vector(tuple(max(v[i] for v in p) for i in range(3)))
        name=o.name;bpy.data.objects.remove(o,do_unlink=True)
        new=box(name,(hi.x-lo.x,hi.y-lo.y,hi.z),((lo.x+hi.x)/2,(lo.y+hi.y)/2,hi.z/2),cream,.008)
        grounded.append(name)
# Single triangular frame merges the sloping borders and horizontal base.
for y in (-1.49,1.08):
    outer=[(-1.17,2.155),(1.17,2.155),(0,2.985)]
    inner=[(-.985,2.255),(.985,2.255),(0,2.88)]
    verts=[(x,yy,z) for yy in (y-.023,y+.065) for p in (outer,inner) for x,z in p]
    faces=[]
    for i in range(3):
        j=(i+1)%3;faces += [(i,j,3+j,3+i),(6+i,9+i,9+j,6+j),
            (i,6+i,6+j,j),(3+i,3+j,9+j,9+i)]
    mesh=bpy.data.meshes.new('Unified_Pediment');mesh.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    o=bpy.data.objects.new('Continuous_Cream_Pediment_Frame',mesh);bpy.context.collection.objects.link(o);finish(o,cream,.006)
for side in (-1,1):
    # Close roof underside with one inset strip, kept off the roof end plane.
    box('Central_Sealed_Side_Cornice',(.095,2.55,.12),(side*1.10,-.20,2.16),cream,.005)
    box('Central_Blue_Straight_Eave',(.044,2.56,.062),(side*1.165,-.20,2.215),blue,.004)
scene.frame_set(1);bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith(('Preview_','Studio_')):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
cam=scene.camera;scene.cycles.samples=24
for name,loc,target,scale in [('front-right',(5,-9,4.6),(0,-.18,1.4),7.6),
    ('stairs-detail',(3,-5,2.4),(.6,-1.35,.30),3.1),
    ('roof-detail',(4,-6,4),(1,-.3,2.24),2.7),
    ('column-base-detail',(5,-4,1.3),(2.92,-.80,.32),1.6)]:
    cam.location=loc;cam.data.ortho_scale=scale;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-clean-joints.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'groundedBases':grounded,'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest()},indent=2))
