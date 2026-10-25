"""Derive an unclothed Bongbong from the accepted Somangi mesh."""
import bpy, json, math, hashlib
import numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils import Matrix

P = Path(__file__).resolve().parent
source = P.parent/'somangi-game-v1/somangi-walk.blend'
digest = hashlib.sha256(source.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
scene = bpy.context.scene
body = bpy.data.objects['Somangi_SmoothBody']
rig = bpy.data.objects['Somangi_WholeArmRig']
original = np.array([v.co[:] for v in body.data.vertices])
scene.frame_set(1)
skin = np.array([255, 195, 148], dtype=np.float32)/255
linear = np.where(skin <= .04045, skin/12.92, ((skin+.055)/1.055)**2.4)
images = {}
for mat in bpy.data.materials:
    if not mat.use_nodes: continue
    for bsdf in [n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED']:
        if not bsdf.inputs['Base Color'].links and 'skin' in mat.name.lower():
            bsdf.inputs['Base Color'].default_value = (*linear, 1)
        for link in list(bsdf.inputs['Base Color'].links):
            node = link.from_node
            if node.type != 'TEX_IMAGE' or not node.image: continue
            src = node.image
            if src.name not in images:
                dst = src.copy(); dst.name = 'Bongbong_' + src.name
                pixels = np.empty(len(src.pixels), dtype=np.float32)
                src.pixels.foreach_get(pixels)
                rgba = pixels.reshape(-1, 4)
                rgba[rgba[:, :3].min(axis=1) > .72, :3] = skin
                dst.pixels.foreach_set(pixels); dst.pack()
                images[src.name] = dst
            node.image = images[src.name]

coral = bpy.data.materials.new('Bongbong coral bud')
coral.use_nodes = True
rgb = np.array([249, 117, 102])/255
rgb = np.where(rgb <= .04045, rgb/12.92, ((rgb+.055)/1.055)**2.4)
shader = coral.node_tree.nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value = (*rgb, 1)
shader.inputs['Roughness'].default_value = .7
petals = []
# Three closed teardrop petals, their rounded bases embedded into the crown.
for name, base, axis, width, depth in [
    ('Centre', (0,.055,.91), (0,0,.39), .145,.10),
    ('Left', (-.015,-.065,.91), (-.245,0,.265), .105,.095),
    ('Right', (.015,-.065,.91), (.245,0,.265), .105,.095)]:
    base, axis = Vector(base), Vector(axis)
    across = Vector((axis.z,0,-axis.x)).normalized()
    verts, faces = [], []
    rings, sides = 48, 48
    for i in range(rings+1):
        t=i/rings
        radius=max(.00005, math.sin(math.pi*t)**.83)
        for j in range(sides):
            a=2*math.pi*j/sides
            verts.append(tuple(base+axis*t+across*(width*radius*math.cos(a))+
                               Vector((0,depth*radius*math.sin(a),0))))
    for i in range(rings):
        for j in range(sides):
            k=i*sides+j; n=i*sides+(j+1)%sides
            faces.append((k,n,n+sides,k+sides))
    faces.extend([tuple(reversed(range(sides))),tuple(rings*sides+j for j in range(sides))])
    mesh=bpy.data.meshes.new('Closed bud '+name);mesh.from_pydata(verts,[],faces);mesh.update()
    ob=bpy.data.objects.new('Bongbong_Bud_'+name,mesh);scene.collection.objects.link(ob)
    ob.data.materials.append(coral)
    for poly in mesh.polygons: poly.use_smooth=True
    ob.vertex_groups.new(name='Head').add(list(range(len(verts))),1,'REPLACE')
    ob.modifiers.new('Follow head','ARMATURE').object=rig;ob.parent=rig
    petals.append(ob)
assert np.array_equal(original,np.array([v.co[:] for v in body.data.vertices]))
objects=[body,rig,*petals]
for ob in list(scene.objects):
    if ob not in objects: bpy.data.objects.remove(ob,do_unlink=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(P/'bongbong.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'bongbong.glb'),use_selection=True,
    export_format='GLB',export_animations=True,export_animation_mode='SCENE',
    export_frame_range=True,export_cameras=False,export_lights=False)
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
(P/'verification.json').write_text(json.dumps(dict(source=str(source),sourceSHA256=digest,
    vertices=len(original),maximumBodyVertexChange=0,skinSRGB='#FFC394',budSRGB='#F97566',
    clothes=False,gameInstalled=False,walkPreserved=True),indent=2))

# Verify and photograph the delivered GLB in its authored rest pose.
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'bongbong.glb'))
scene=bpy.context.scene
for ob in scene.objects:
    if ob.animation_data:
        ob.animation_data.action=None
        for track in ob.animation_data.nla_tracks: track.mute=True
    if ob.type == 'ARMATURE':
        for bone in ob.pose.bones: bone.matrix_basis=Matrix.Identity(4)
scene.frame_set(1)
world=bpy.data.worlds.new('Neutral studio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.7,.7,.7,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.65;scene.world=world
target=Vector((0,0,.15))
for pos,energy in [((-3,-4,5),400),((4,3,4),300),((4,-3,1),130)]:
    bpy.ops.object.light_add(type='AREA',location=pos)
    light=bpy.context.object;light.data.energy=energy;light.data.size=4
    light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-6,.15))
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.7;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=720;scene.render.resolution_y=800
scene.view_settings.view_transform='AgX'
for name,pos in [('front',(0,-6,.15)),('right',(6,0,.15)),('back',(0,6,.15))]:
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
