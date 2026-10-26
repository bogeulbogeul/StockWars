"""Bake a dedicated seated Chagok and inspect it on the actual bank chair."""
import bpy, math, json, hashlib
from pathlib import Path
from mathutils import Vector, Matrix
P=Path(__file__).resolve().parent
source=P.parent/'chagok-somangi-base-v1/chagok.blend'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
scene=bpy.context.scene
rig=bpy.data.objects['Somangi_WholeArmRig']
rig.animation_data_clear()
for pb in rig.pose.bones:
    pb.matrix_basis=Matrix.Identity(4)
for name,angle in [('Leg.L',-110),('Leg.R',-110),('Arm.L',-35),('Arm.R',-35)]:
    pb=rig.pose.bones[name];rest=pb.bone.matrix_local; pivot=rest.translation
    pb.matrix=Matrix.Translation(pivot)@Matrix.Rotation(math.radians(angle),4,'X')@Matrix.Translation(-pivot)@rest
bpy.context.view_layer.update()
body=bpy.data.objects['Somangi_SmoothBody']
# The torso/pelvis underside bears on the cushion; feet extend forwards.
deps=bpy.context.evaluated_depsgraph_get()
evaluated=body.evaluated_get(deps); mesh=evaluated.to_mesh()
group=body.vertex_groups['Body'].index
indices=[v.index for v in body.data.vertices if any(g.group==group and g.weight>.99 for g in v.groups)]
pelvis=min(mesh.vertices[i].co.z for i in indices)
evaluated.to_mesh_clear()
objects=[o for o in scene.objects if o.type=='MESH']
for ob in objects:
    baked=bpy.data.meshes.new_from_object(ob.evaluated_get(deps),depsgraph=deps)
    ob.data=baked
    ob.modifiers.clear(); ob.parent=None; ob.matrix_world=Matrix.Identity(4)
    for v in ob.data.vertices:v.co.z-=pelvis
    if ob.name == 'Somangi_SmoothBody':
        # Shape only the seated underside over the cushion. Beyond its front
        # edge the short feet remain free to hang; torso/head stay untouched.
        for v in ob.data.vertices:
            if v.co.z > .08: continue
            t=max(0,min(1,(v.co.y+.50)/.14))
            t=t*t*(3-2*t)
            if not t: continue
            z=v.co.z; floor=.002; k=.012
            supported=(z+floor+math.sqrt((z-floor)**2+k*k))/2
            fade=max(0,min(1,(.08-z)/.04));fade=fade*fade*(3-2*fade)
            v.co.z += (supported-z)*t*fade
for ob in list(scene.objects):
    if ob not in objects:bpy.data.objects.remove(ob,do_unlink=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(P/'chagok-seated.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'chagok-seated.glb'),use_selection=True,
    export_format='GLB',export_animations=False,export_cameras=False,export_lights=False)
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
# Reimport both delivered assets and render the actual chair contact.
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'chagok-seated.glb'))
character=[o for o in bpy.context.scene.objects if o.type=='MESH']
scale=1/1.9000606
seat_top=.6640000343-.024
for ob in character:
    ob.scale=(scale,)*3; ob.location=(0,1.10,seat_top)
bpy.ops.import_scene.gltf(filepath=str(P.parents[1]/'web/assets/office/3d/Bank-furnished-room.glb'))
chair=[]
for ob in list(bpy.context.scene.objects):
    if ob in character:continue
    if ob.type=='MESH' and ob.name.startswith('Executive'):
        ob.location.z-=.024;chair.append(ob)
    else:bpy.data.objects.remove(ob,do_unlink=True)
scene=bpy.context.scene
world=bpy.data.worlds.new('Studio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.65,.65,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.7;scene.world=world
target=Vector((0,1.2,1.05))
for pos,energy in [((-3,-4,5),400),((4,3,4),300)]:
    bpy.ops.object.light_add(type='AREA',location=pos)
    light=bpy.context.object;light.data.energy=energy;light.data.size=4
    light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.3;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=850;scene.render.resolution_y=900
scene.view_settings.view_transform='AgX'
for name,pos in [('front',(0,-5,1.2)),('side',(6,1.2,1.05)),('angle',(3,-5,3))]:
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
(P/'verification.json').write_text(json.dumps(dict(sourceSHA256=digest,sourceUnchanged=True,
    poseDegrees=dict(legs=-110,arms=-35),pelvisOriginalZ=pelvis,
    seatWorldY=seat_top*100,position=dict(x=0,z=-110),bodyScale=100/1.9000606,
    staticBakedPose=True,views=['front','side','angle']),indent=2))

