import bpy
import bmesh
import math
import sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import material,finish,box
out=Path('C:/GitHub/StockWars/output/cipher-cozy-mat-v2')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
points=[];w=1.8;d=.95;r=.095;h=.015
for cx,cy,start in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]:
    for i in range(17):
        a=math.radians(start+i*90/16);points.append((cx+r*math.cos(a),cy+r*math.sin(a)))
n=len(points);verts=[(x,y,z) for z in [0,h] for x,y in points]
faces=[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
mesh=bpy.data.meshes.new('Rounded_Mat');mesh.from_pydata(verts,[],faces)
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
obj=bpy.data.objects.new('Cipher_Rounded_Entry_Mat',mesh);bpy.context.collection.objects.link(obj)
finish(obj,material('Mat_Blue_Fabric',(.03,.1,.2),1),.003)
paint=material('Mat_Printed_Logo',(1,1,1),1)
image=bpy.data.images.load(str(out/'mat-texture.png'));image.pack()
node=paint.node_tree.nodes.new('ShaderNodeTexImage');node.image=image
paint.node_tree.links.new(node.outputs['Color'],paint.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
mesh.materials.append(paint);uv=mesh.uv_layers.new()
for polygon in mesh.polygons:
    if polygon.normal.z>.5:
        polygon.material_index=1
        for loop in polygon.loop_indices:
            p=mesh.vertices[mesh.loops[loop].vertex_index].co;uv.data[loop].uv=(p.x/w+.5,p.y/d+.5)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-entry-mat.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-entry-mat.glb'),export_format='GLB')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
box('Ground',(200,200,.01),(0,0,-.015),material('Ground',(.60,.61,.63)),0)
bpy.ops.object.light_add(type='AREA',location=(-2,-3,4));bpy.context.object.data.energy=300;bpy.context.object.data.size=4
bpy.ops.object.camera_add(location=(1.3,-2,2.8));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=2.5;scene.camera=camera
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'mat-preview.png');bpy.ops.render.render(write_still=True)
