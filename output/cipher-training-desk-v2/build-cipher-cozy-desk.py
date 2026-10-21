import bpy
import bmesh
import math
import sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import material, finish, box, stroke

out=Path('C:/GitHub/StockWars/output/cipher-cozy-desk-v1');out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
blue=material('Desk_Muted_Blue',(.065,.16,.25))
cream=material('Desk_Cream',(.92,.865,.75))
base=material('Desk_Base_Blue',(.04,.10,.17))

def rounded_slab(name,width,depth,radius,bottom,height,mat):
    points=[]
    for cx,cy,start in [(width/2-radius,depth/2-radius,0),(-width/2+radius,depth/2-radius,90),
                         (-width/2+radius,-depth/2+radius,180),(width/2-radius,-depth/2+radius,270)]:
        for i in range(13):
            a=math.radians(start+i*90/12)
            points.append((cx+radius*math.cos(a),cy+radius*math.sin(a)))
    n=len(points)
    verts=[(x,y,z) for z in [bottom,bottom+height] for x,y in points]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    for polygon in mesh.polygons: polygon.use_smooth=polygon.index>=2
    finish(obj,mat,.025)
    return obj

rounded_slab('Desk_Rounded_Plinth',3.00,.92,.40,0,.08,cream)
rounded_slab('Desk_Blue_Body',2.98,.90,.40,.08,.54,blue)
rounded_slab('Desk_Thick_Cream_Top',3.10,1.00,.44,.62,.10,cream)
bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=(0,-.46,.34))
badge=bpy.context.object;badge.name='Desk_Ivory_Oval_Badge';badge.scale=(.49,.035,.20)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
badge.data.materials.append(cream)
for polygon in badge.data.polygons: polygon.use_smooth=True
for x,h in [(-.11,.035),(-.035,.062),(.04,.092)]:
    box('Desk_Logo_Bar',(.039*1.8,.018,h*1.8),(x*1.8,-.503,.235+h*.9),blue,.008)
def pts(values):return [(x*1.8,-.517,.235+y*1.8) for x,y in values]
stroke('Desk_Logo_Rise',pts([(-.13,.048),(-.045,.087),(.025,.075),(.13,.123)]),.012,blue)
stroke('Desk_Logo_Arrow',pts([(.088,.122),(.13,.123),(.113,.085)]),.012,blue)
for obj in list(bpy.context.scene.objects):
    if obj.type=='CURVE':
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-cozy-desk.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-cozy-desk.glb'),export_format='GLB')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
box('Studio_Ground',(200,200,.01),(0,0,-.015),material('Ground',(.60,.61,.63)),0)
bpy.ops.object.light_add(type='AREA',location=(-3,-4,6));bpy.context.object.data.energy=450;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(3,-5,3))
camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,.35))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=3.9;scene.camera=camera
scene.render.resolution_x=1300;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'desk-preview.png');bpy.ops.render.render(write_still=True)
