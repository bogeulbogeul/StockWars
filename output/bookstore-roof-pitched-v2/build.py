"""Replace only bookstore roof with clipped planar cross gables."""
import bpy, sys, math, json, hashlib
from pathlib import Path
from mathutils import Vector, Matrix
ROOT = Path(__file__).resolve().parent
BASE = ROOT.parent / 'bookstore-exterior-clean-v1'
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import finish, extrude, stroke
bpy.ops.wm.open_mainfile(filepath=str(BASE / 'Bookstore-clean.blend'))
for obj in list(bpy.data.objects):
    if obj.name.startswith(('Sealed_Plum_Roof','Curved_Honey_Roof_Edge','Cream_Gable','Smooth_Plum_Tile')):
        bpy.data.objects.remove(obj, do_unlink=True)
roof=bpy.data.materials['Bookstore_Plum_Tiles']
wood=bpy.data.materials['Bookstore_Honey_Timber']
cream=bpy.data.materials['Bookstore_Cream']
# Seat the existing book plaque within the new straight triangular gable.
center=Vector((-.94,-.935,1.95))
fit=Matrix.Translation(center) @ Matrix.Diagonal((.88,1,.88,1)) @ Matrix.Translation(-center)
for obj in bpy.context.scene.objects:
    if obj.name.startswith('Front_Sign_'):obj.matrix_world=fit @ obj.matrix_world
RIDGE=-.94
def main(x): return 2.47-.95*(x-RIDGE)
def wing(y): return 2.035-.30*abs(y-.015)
def seam(y): return RIDGE+(2.47-wing(y))/.95
def clip(poly, fn):
    result=[]
    for p,q in zip(poly,poly[1:]+poly[:1]):
        a,b=fn(*p),fn(*q)
        if a>=-1e-9: result.append(p)
        if (a>0) != (b>0):
            t=a/(a-b); result.append((p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])))
    return result
def solid(name,poly,h,mat,thick=.07,offset=0,bevel=.004):
    if len(poly)<3:return
    area=sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(poly,poly[1:]+poly[:1]))
    if abs(area)<1e-7:return
    n=len(poly)
    verts=[(x,y,h(x,y)+offset-d) for d in (0,thick) for x,y in poly]
    faces=[tuple(range(n)),tuple(range(2*n-1,n-1,-1))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    # Recalculate winding for reliable GLB normals.
    import bmesh
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    finish(obj,mat,bevel)
    return obj
# Each tile is clipped analytically to the same straight valley on each half.
surfaces=[('Main_Left',lambda x,y:2.47+.95*(x-RIDGE),[lambda x,y:RIDGE-x]),
          ('Main_Right_Front',lambda x,y:main(x),[lambda x,y:x-RIDGE,lambda x,y:.015-y,lambda x,y:seam(y)-x]),
          ('Main_Right_Rear',lambda x,y:main(x),[lambda x,y:x-RIDGE,lambda x,y:y-.015,lambda x,y:seam(y)-x]),
          ('Wing_Front',lambda x,y:wing(y),[lambda x,y:x-seam(y),lambda x,y:.015-y]),
          ('Wing_Rear',lambda x,y:wing(y),[lambda x,y:x-seam(y),lambda x,y:y-.015])]
rect=[(-1.73,-1.03),(1.73,-1.03),(1.73,1.06),(-1.73,1.06)]
for name,h,limits in surfaces:
    poly=rect[:]
    for fn in limits:poly=clip(poly,fn)
    solid('Pitched_Roof_'+name,poly,h,roof)
    for i in range(22):
        for j in range(8):
            x=-1.73+i*3.46/22;y=-1.03+j*2.09/8
            tile=[(x+.004,y+.004),(x+3.46/22-.004,y+.004),
                  (x+3.46/22-.004,y+2.09/8-.004),(x+.004,y+2.09/8-.004)]
            for fn in limits:tile=clip(tile,fn)
            # Valley clearance forms one narrow continuous recessed channel.
            if name.startswith('Main_Right'):tile=clip(tile,lambda x,y:seam(y)-x-.012)
            if name.startswith('Wing'):tile=clip(tile,lambda x,y:x-seam(y)-.012)
            solid('Smooth_Plum_Tile_'+name,tile,h,roof,.022,.012,.003)
for y in (-1.04,1.07):
    pts=[(-1.73,1.7195),(RIDGE,2.47),(seam(y),wing(y)),(1.73,wing(y))]
    extrude('Straight_Honey_Fascia',[(x,z-.035) for x,z in pts]+[(x,z-.12) for x,z in reversed(pts)],y-.018,y+.018,wood,.006)
for y in (-.885,.885):
    pts=[(-1.53,2.47-.95*abs(-1.53-RIDGE)-.09),(RIDGE,2.38),
         (seam(y),wing(y)-.09),(1.43,wing(y)-.09)]
    extrude('Cream_Pitched_Gable',[(-1.53,1.59),(1.43,1.59)]+list(reversed(pts)),y-.018,y+.018,cream,.006)
for x in (1.45,):
    # Right wing gable fills above the existing side wall, without new windows.
    poly=[(x,-.88),(x,.88),(x,.015)]
    verts=[(x,-.88,1.63),(x,.88,1.63),(x,.88,wing(.88)-.09),(x,.015,1.945),(x,-.88,wing(-.88)-.09)]
    mesh=bpy.data.meshes.new('Wing_Gable');mesh.from_pydata(verts,[],[(0,1,2,3,4)])
    obj=bpy.data.objects.new('Cream_Right_Wing_Gable',mesh);bpy.context.collection.objects.link(obj)
    obj.data.materials.append(cream);mod=obj.modifiers.new('Solid','SOLIDIFY');mod.thickness=.04
for x in (-1.73,1.73):
    coords=[(x,-1.03,(2.47-.95*abs(x-RIDGE) if x<0 else wing(-1.03))-.08),
            (x,.015,(2.47-.95*abs(x-RIDGE) if x<0 else wing(.015))-.08),
            (x,1.06,(2.47-.95*abs(x-RIDGE) if x<0 else wing(1.06))-.08)]
    stroke('Honey_Side_Fascia',coords,.045,wood)
def cap(name,a,b):
    stroke(name,[a,b],.043,roof)
for j in range(8):
    a=-1.03+j*2.09/8;b=a+2.09/8-.006
    cap('Main_Ridge_Cap',(RIDGE,a,2.49),(RIDGE,b,2.49))
start=seam(.015)+.025
for i in range(7):
    a=start+(1.73-start)*i/7;b=start+(1.73-start)*(i+1)/7-.006
    cap('Wing_Ridge_Cap',(a,.015,2.055),(b,.015,2.055))
# Export asset only; retain studio camera/lighting in the saved blend.
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.type in ('MESH','CURVE') and not obj.name.startswith('Preview_'):obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bookstore-clean.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.cycles.samples=32
scene.render.resolution_x=1200;scene.render.resolution_y=1000
cam=scene.camera
for name,loc,target,scale in [
    ('front-right',(4,-6,3.5),(-.10,-.08,1.15),4.7),
    ('rear',(4,6,3.5),(-.10,-.08,1.15),4.7),
    ('roof-junction',(3,-5,4),(.03,-.2,2.02),1.65),
    ('front',(0,-7,2.7),(-.10,-.08,1.15),4.7)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bookstore-clean.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'pitched roof; analytically clipped valley tiles',
    'source':str(BASE/'Bookstore-clean.blend'),'sha256':hashlib.sha256((ROOT/'Bookstore-clean.glb').read_bytes()).hexdigest()},indent=2))
