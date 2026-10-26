"""Lower the complete connected roof mass, not just the ridge profiles."""
import bpy,sys,json,hashlib,math
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-pressed-ridge-v15'/'CipherSecurities-pressed-ridge.blend'))
scene=bpy.context.scene;cam=scene.camera
BASE=1.72;FACTOR=.72
def height(z):return BASE+(z-BASE)*FACTOR if z>BASE else z
camera=(cam.location.copy(),cam.rotation_euler.copy(),cam.data.type,cam.data.lens)
scene.render.resolution_x=803;scene.render.resolution_y=675;scene.cycles.samples=24
scene.render.filepath=str(ROOT/'before.png');bpy.ops.render.render(write_still=True)

# Preserve round clock geometry while seating it inside the lower gable.
clock_center=Vector((0,-1.54,2.51))
new_center=clock_center.copy();new_center.z=height(clock_center.z)
clock_transform=Matrix.Translation(new_center)@Matrix.Diagonal((.86,1,.86,1))@Matrix.Translation(-clock_center)
changed=[]
for obj in list(scene.objects):
    if obj.name.startswith(('Preview_','Studio_')) or obj.type not in ('MESH','CURVE'):continue
    if obj.name.startswith(('Clock_','Grand_Clock_Brass_Rim')):
        obj.matrix_world=clock_transform@obj.matrix_world
        continue
    if obj.name.startswith(('Reference_Chart','Reference_Rising_Chart','Cipher_Logo')):
        points=[obj.matrix_world@Vector(c) for c in obj.bound_box]
        z=sum(p.z for p in points)/8
        obj.matrix_world=Matrix.Translation((0,0,height(z)-z))@obj.matrix_world
        continue
    points=[obj.matrix_world@Vector(c) for c in obj.bound_box]
    if max(p.z for p in points)<=BASE:continue
    if obj.type=='CURVE':
        evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh=bpy.data.meshes.new_from_object(evaluated)
        replacement=bpy.data.objects.new(obj.name+'_Mesh',mesh)
        bpy.context.collection.objects.link(replacement);replacement.matrix_world=obj.matrix_world.copy()
        name=obj.name;bpy.data.objects.remove(obj,do_unlink=True);replacement.name=name;obj=replacement
    obj.data=obj.data.copy();mesh=obj.data
    old_normals=[n.vector.copy() for n in mesh.corner_normals]
    above=[(obj.matrix_world@v.co).z>BASE for v in mesh.vertices]
    inverse=obj.matrix_world.inverted()
    normal_matrix=obj.matrix_world.to_3x3().inverted().transposed()
    normal_inverse=normal_matrix.inverted()
    for v in mesh.vertices:
        world=obj.matrix_world@v.co;world.z=height(world.z);v.co=inverse@world
    mesh.update()
    normals=[]
    for loop,n in zip(mesh.loops,old_normals):
        if above[loop.vertex_index]:
            world=normal_matrix@n;world.z/=FACTOR;n=(normal_inverse@world).normalized()
        normals.append(n)
    mesh.normals_split_custom_set(normals)
    changed.append(obj.name)

scene.frame_set(1);bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type in ('MESH','CURVE','EMPTY') and not obj.name.startswith(('Preview_','Studio_')):obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
scene.render.filepath=str(ROOT/'after.png');bpy.ops.render.render(write_still=True)
cam.data.type='ORTHO';cam.data.ortho_scale=6.7;cam.location=(4,-10,4.1)
cam.rotation_euler=(Vector((0,-.05,2.15))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1536;scene.render.resolution_y=576
scene.render.filepath=str(ROOT/'roof-overview.png');bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=2.4;cam.location=(3.5,-7,3.35)
cam.rotation_euler=(Vector((2.05,0,2.12))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1200;scene.render.resolution_y=700
scene.render.filepath=str(ROOT/'wing-close.png');bpy.ops.render.render(write_still=True)
cam.location,cam.rotation_euler,cam.data.type,cam.data.lens=camera
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-low-roof.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest(),
    'upperRoofHeightFactor':FACTOR,'transitionHeight':BASE,
    'wingRoofRiseBefore':.43,'wingRoofRiseAfter':.43*FACTOR,
    'centralRoofRiseBefore':.75,'centralRoofRiseAfter':.75*FACTOR,
    'wingSlopeBeforeDegrees':math.degrees(math.atan(.43/1.08)),
    'wingSlopeAfterDegrees':math.degrees(math.atan(.43*FACTOR/1.08)),
    'centralSlopeBeforeDegrees':math.degrees(math.atan(.75/1.17)),
    'centralSlopeAfterDegrees':math.degrees(math.atan(.75*FACTOR/1.17)),
    'changedObjects':changed,'clockRemainsRound':True,'gameApplied':False},indent=2))
