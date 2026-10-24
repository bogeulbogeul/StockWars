"""Refine panel corners, glazing bead and brass pull only."""
import bpy,bmesh,sys,math,hashlib,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,finish,stroke,disk
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-wide-v4'/'VivianStore-wide.blend'))
scene=bpy.context.scene;wood=bpy.data.materials['Vivian_Honey_Wood'];gold=bpy.data.materials['Vivian_Gold']
for o in list(scene.objects):
    if o.name.startswith(('Door_Lower_Panel_','Door_Glass_Rebate','Door_Glass_Bottom_Rebate','Door_Brass_Pull_Mount','Door_Brass_Curved_Pull')):bpy.data.objects.remove(o,do_unlink=True)
def rounded(w,h,r,z):
    pts=[]
    for x0,z0,start in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
        for i in range(17):
            a=math.radians(start+90*i/16);pts.append((x0+r*math.cos(a),z+z0+r*math.sin(a)))
    return pts
def ring(name,outer,inner,front,back):
    n=len(outer);assert n==len(inner)
    verts=[(x,y,z) for y in (front,back) for poly in (outer,inner) for x,z in poly];faces=[]
    for i in range(n):
        j=(i+1)%n;faces += [(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));assert all(e.is_manifold for e in bm.edges);bm.to_mesh(mesh);bm.free()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,wood,.002)
ring('Door_Lower_Panel_Continuous_Moulding',rounded(.344,.314,.012,.345),rounded(.303,.273,.009,.345),-.979,-.960)
box('Door_Lower_Panel_Clean_Inset',(.309,.009,.279),(0,-.958,.345),wood,.008)
def arch(r,bottom):return [(-r,bottom),(r,bottom),(r,.74)]+[(r*math.cos(math.pi*i/64),.74+r*math.sin(math.pi*i/64)) for i in range(1,65)]
ring('Door_Glass_Continuous_Rebate',arch(.197,.550),arch(.176,.572),-.989,-.944)
for z in (.38,.53):disk('Door_Brass_Round_Pull_Rosette',-.185,-1.002,z,.011,.012,gold)
stroke('Door_Brass_Smooth_Pull',[(-.185,-1.010-.027*math.sin(math.pi*t)**.6,.38+.15*t) for t in [i/48 for i in range(49)]],.0065,gold)
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and not o.get('preview_only',False) and not o.name.startswith('Preview_'):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'VivianStore-clean.glb'),export_format='GLB',use_selection=True)
cam=scene.camera;scene.cycles.samples=32
for name,loc,target,scale in [('door-detail',(.8,-4,1.6),(0,-.98,.57),1.60),('front-right',(4,-6,3.5),(0,-.08,1.1),4.7)]:
    cam.location=loc;cam.data.ortho_scale=scale;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'VivianStore-door-polish.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'sha256':hashlib.sha256((ROOT/'VivianStore-clean.glb').read_bytes()).hexdigest(),'source':'vivian-wide-v4','panelAndGlassRings':'closed manifold solids'},indent=2))
