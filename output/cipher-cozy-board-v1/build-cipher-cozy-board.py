import bpy
import bmesh
import math
import sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import material,finish,box

out=Path('C:/GitHub/StockWars/output/cipher-cozy-board-v1');out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
cream=material('Board_Cream',(.92,.865,.75))
blue=material('Board_Blue',(.045,.13,.24))

def outline(w,h,r):
    points=[]
    for cx,cz,start in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
        for i in range(13):
            a=math.radians(start+i*90/12);points.append((cx+r*math.cos(a),cz+r*math.sin(a)))
    return points

def ring(name,outer,inner,front,back,mat):
    a=outline(*outer);b=outline(*inner);n=len(a)
    vertices=[(x,y,z) for y in [front,back] for line in [a,b] for x,z in line]
    faces=[]
    for i in range(n):
        j=(i+1)%n
        faces.extend([(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),
            (i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);finish(obj,mat,.018)

ring('Board_Rounded_Ivory_Frame',(4.84,2.03,.23),(4.57,1.77,.16),-.12,.025,cream)
ring('Board_Rounded_Blue_Bezel',(4.60,1.80,.17),(4.40,1.60,.105),-.155,-.04,blue)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-cozy-index-board.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-cozy-index-board.glb'),export_format='GLB')
# Concept render with a placeholder screen; runtime supplies the live Canvas display.
box('Preview_Screen',(4.40,.015,1.60),(0,-.13,0),material('Screen',(.02,.055,.075)),.01)
box('Preview_Wall',(7,.1,3),(0,.15,0),material('Wall',(.83,.785,.68)),.02)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
bpy.ops.object.light_add(type='AREA',location=(-3,-4,5));bpy.context.object.data.energy=400;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(1,-6,1));camera=bpy.context.object
camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=5.6;scene.camera=camera
scene.render.resolution_x=1400;scene.render.resolution_y=850;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'frame-preview.png');bpy.ops.render.render(write_still=True)
