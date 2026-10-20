import bpy, bmesh, math, sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import material, box
out=Path('C:/GitHub/StockWars/output/cipher-cozy-mat-v5');out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
blue=material('Uniform_Blue',(.0307,.107,.216),1)
cream=material('Uniform_Ivory',(.896,.823,.694),1)
def rounded(w,d,r):
    result=[]
    for x,y,a in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]:
        result += [(x+r*math.cos(math.radians(a+i*90/32)),y+r*math.sin(math.radians(a+i*90/32))) for i in range(33)]
    return result
def prism(name,points,z0,z1):
    n=len(points);verts=[(x,y,z) for z in (z0,z1) for x,y in points]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    obj.data.materials.append(blue);obj.data.materials.append(cream)
    return obj
def boolean(target,cutter,operation='DIFFERENCE'):
    bpy.context.view_layer.objects.active=target
    mod=target.modifiers.new(operation,'BOOLEAN');mod.operation=operation;mod.solver='EXACT';mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
body=prism('Clean_Debossed_Mat',rounded(1.8,.95,.095),0,.015)
cutters=[]
ring=prism('Border_Groove',rounded(1.698,.848,.063),.010,.04)
boolean(ring,prism('Border_Inside',rounded(1.659,.809,.0435),.005,.045))
cutters.append(ring)
def transform(x,y):return (x*3.15,-.18+y*3.156)
for x,h in [(-.11,.035),(-.035,.062),(.04,.092)]:
    points=[(px+x*3.15,py-.18+h*3.156/2) for px,py in rounded(.039*3.15,h*3.156,.006)]
    cutters.append(prism('Bar_Groove',points,.010,.04))
def segment(a,b):
    a=Vector(transform(*a));b=Vector(transform(*b));v=b-a;n=Vector((-v.y,v.x)).normalized()*.0135
    cutters.append(prism('Arrow_Groove',[tuple(a+n),tuple(a-n),tuple(b-n),tuple(b+n)],.010,.04))
path=[(-.13,.048),(-.045,.087),(.025,.075),(.13,.123)]
for a,b in zip(path,path[1:]):segment(a,b)
segment((.088,.122),(.13,.123));segment((.13,.123),(.113,.085))
cut=cutters.pop(0)
for part in cutters:boolean(cut,part,'UNION')
for face in cut.data.polygons:face.material_index=1
boolean(body,cut)
# Keep broad faces flat: no smoothed normals bleeding across the groove walls.
for face in body.data.polygons:face.use_smooth=False
bpy.context.view_layer.objects.active=body
bevel=body.modifiers.new('Tiny_Soft_Edges','BEVEL');bevel.width=.0006;bevel.segments=3
bpy.ops.object.modifier_apply(modifier=bevel.name)
norm=body.modifiers.new('Flat_Surface_Normals','WEIGHTED_NORMAL');norm.keep_sharp=True
bpy.ops.object.modifier_apply(modifier=norm.name)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-entry-mat.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-entry-mat.glb'),export_format='GLB')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
box('Studio',(200,200,.01),(0,0,-.015),material('Studio',(.60,.61,.63)),0)
bpy.ops.object.light_add(type='AREA',location=(-2,-3,4));bpy.context.object.data.energy=300;bpy.context.object.data.size=2
bpy.ops.object.camera_add(location=(1.3,-2,2.8));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=2.5;scene.camera=camera
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'mat-preview.png');bpy.ops.render.render(write_still=True)
camera.location=(.65,-1.3,.9);camera.rotation_euler=(Vector((0,-.05,.01))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=.92
scene.render.filepath=str(out/'logo-detail.png');bpy.ops.render.render(write_still=True)
