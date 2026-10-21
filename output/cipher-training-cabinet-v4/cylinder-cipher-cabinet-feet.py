"""Replace cabinet feet with smooth cylinders and flat ground-contact disks."""
import bpy,math,sys
from pathlib import Path
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-training-cabinet-v4';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'output/cipher-training-cabinet-v3/Cipher-training-cabinet.blend'))
cream=bpy.data.materials['Cabinet_Cream']
for obj in list(bpy.data.objects):
    if obj.name.startswith('Cabinet_Short_Foot'):bpy.data.objects.remove(obj,do_unlink=True)
for x in [-.58,.58]:
    for y in [-.23,.23]:
        # Straight cylindrical sides; small top fillet, planar lower disk.
        n=64;r=.055;levels=[(0,r),(.13,r),(.135,.0535),(.139,.05),(.14,.045)]
        vertices=[(x+radius*math.cos(i*2*math.pi/n),y+radius*math.sin(i*2*math.pi/n),z)
                  for z,radius in levels for i in range(n)]
        faces=[tuple(range(n-1,-1,-1))]
        for row in range(len(levels)-1):
            for i in range(n):faces.append((row*n+i,row*n+(i+1)%n,(row+1)*n+(i+1)%n,(row+1)*n+i))
        faces.append(tuple(range((len(levels)-1)*n,len(levels)*n)))
        mesh=bpy.data.meshes.new('Smooth_Cylinder_Foot');mesh.from_pydata(vertices,[],faces);mesh.update()
        foot=bpy.data.objects.new('Cabinet_Short_Foot_Cylinder',mesh);bpy.context.collection.objects.link(foot);mesh.materials.append(cream)
        for face in mesh.polygons:face.use_smooth=len(face.vertices)==4
        assert min(v.co.z for v in mesh.vertices)==0
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-training-cabinet.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-training-cabinet.glb'),export_format='GLB')
sys.path.insert(0,str(root/'scratch'))
from exterior_geometry import material,box
from mathutils import Vector
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
box('Studio',(200,200,.01),(0,0,-.015),material('Studio',(.60,.61,.63)),0)
bpy.ops.object.light_add(type='AREA',location=(-3,-4,5));bpy.context.object.data.energy=400;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(2.2,-3.6,2.1));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.42))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.15;scene.camera=camera
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'cabinet-preview.png');bpy.ops.render.render(write_still=True)
