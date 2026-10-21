"""Soften chair and stool pads while retaining their seat contact heights."""
import bpy
import json
import math
import bmesh
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent

def dome(name,size,loc,mat,power=.44):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=40,radius=1,location=loc)
    obj=bpy.context.object;obj.name=name
    for v in obj.data.vertices:
        v.co=Vector([math.copysign(abs(c)**power,c)*size[i]/2 for i,c in enumerate(v.co)])
    obj.data.materials.append(mat)
    for p in obj.data.polygons:p.use_smooth=True
    return obj

def setup_render(scene,target,scale):
    scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
    scene.render.resolution_x=1000;scene.render.resolution_y=1000
    cam=scene.camera;cam.data.type='ORTHO';cam.data.ortho_scale=scale
    cam.location=(2,-3,1.9)
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'anna-office-chair-v1'/'Anna-office-chair.blend'))
old=bpy.data.objects['Seat_Sage_Cushion'];mat=old.data.materials[0]
bpy.data.objects.remove(old,do_unlink=True)
dome('Seat_Sage_Cushion',(.69,.63,.14),(0,-.025,.495),mat)
old=bpy.data.objects['Sage_Backrest_Pad']
bpy.data.objects.remove(old,do_unlink=True)
# Keep the arch silhouette and add a shallow smooth bulge toward the sitter.
# Concentric arch rings preserve the frame silhouette while doming the face.
radius=.287;spring=.245;bottom=.645;center=Vector((0,bottom+.29))
outline=[(-radius,bottom),(radius,bottom),(radius,bottom+spring)]
outline += [(radius*math.cos(math.pi*i/64),bottom+spring+radius*math.sin(math.pi*i/64))
            for i in range(1,65)]
n=len(outline);rings=16;verts=[];faces=[]
for layer in range(rings+1):
    t=layer/rings
    shrink=1-.96*t
    for x,z in outline:
        px=center.x+(x-center.x)*shrink;pz=center.y+(z-center.y)*shrink
        # Border is close to the frame; center projects softly toward the sitter.
        y=.213-.055*math.sin(t*math.pi/2)
        verts.append((px,y,pz))
for layer in range(rings):
    for i in range(n):
        a=layer*n+i;b=layer*n+(i+1)%n
        faces.append((a,b,b+n,a+n))
faces.append(tuple(range(rings*n,(rings+1)*n)))
back_start=len(verts)
verts.extend([(x,.244,z) for x,z in outline])
faces.append(tuple(range(back_start,back_start+n)))
for i in range(n):faces.append((i,(i+1)%n,back_start+(i+1)%n,back_start+i))
mesh=bpy.data.meshes.new('Arched_Soft_Backrest_Mesh');mesh.from_pydata(verts,[],faces)
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
obj=bpy.data.objects.new('Sage_Backrest_Pad',mesh);bpy.context.collection.objects.link(obj)
obj.data.materials.append(mat)
for polygon in mesh.polygons:polygon.use_smooth=True
asset=[o for o in bpy.context.scene.objects if o.type in ['MESH','EMPTY'] and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Anna-office-chair-soft.glb'),export_format='GLB',use_selection=True)
setup_render(bpy.context.scene,(0,0,.59),1.65)
bpy.context.scene.render.filepath=str(ROOT/'chair.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Anna-office-chair-soft.blend'))

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'somangi-visitor-stool-v1'/'Somangi-visitor-stool.blend'))
old=bpy.data.objects['Round_Sage_Cushion'];mat=old.data.materials[0]
bpy.data.objects.remove(old,do_unlink=True)
# Smooth rounded disk: broad flat contact surface, gently crowned upper face.
bpy.ops.mesh.primitive_uv_sphere_add(segments=96,ring_count=48,radius=1,location=(0,0,.435))
obj=bpy.context.object;obj.name='Round_Sage_Cushion'
for v in obj.data.vertices:
    z=v.co.z
    # Flatten the dome vertically while filling out the side profile.
    radius_factor=max(0,1-z*z)**.20
    xy=Vector((v.co.x,v.co.y,0))
    if xy.length>1e-8:xy.normalize()
    v.co=(xy.x*.30*radius_factor,xy.y*.30*radius_factor,
          math.copysign(abs(z)**.60,z)*.055)
obj.data.materials.append(mat)
for p in obj.data.polygons:p.use_smooth=True
asset=[o for o in bpy.context.scene.objects if o.type in ['MESH','EMPTY'] and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Somangi-visitor-stool-soft.glb'),export_format='GLB',use_selection=True)
setup_render(bpy.context.scene,(0,0,.24),1.2)
bpy.context.scene.render.filepath=str(ROOT/'stool.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Somangi-visitor-stool-soft.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'Softer chair and stool pads; review pending',
    'chair_seat_top':.565,'stool_seat_top':.49,'wood_frames':'preserved',
    'source_models':'preserved','game_changed':False},indent=2),encoding='utf-8')
