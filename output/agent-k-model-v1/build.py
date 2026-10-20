import bpy, math, json, hashlib, struct
from pathlib import Path
from mathutils import Vector

P = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-walk-v4/somangi-walk.blend'))
s = bpy.context.scene
rig = bpy.data.objects['Somangi_Rig']
base_names = ['Somangi_Body', 'Eating_Torso', 'Rigid_Arm.L', 'Rigid_Arm.R']
def digest(o):
    return hashlib.sha256(b''.join(struct.pack('3f', *v.co) for v in o.data.vertices)).hexdigest()
before = {n: digest(bpy.data.objects[n]) for n in base_names}
def linear(v):
    return ((v+.055)/1.055)**2.4 if v > .04045 else v/12.92
def material(name, rgb, rough=.75):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = tuple(map(linear, rgb))+(1,)
    b.inputs['Roughness'].default_value = rough
    return m
skin = (.72, .76, .85)
for n in base_names:
    o = bpy.data.objects[n]
    for slot in o.material_slots:
        slot.material = slot.material.copy()
        m = slot.material; bs = m.node_tree.nodes.get('Principled BSDF')
        inp = bs.inputs['Base Color']
        if inp.is_linked:
            source = inp.links[0].from_socket
            mix = m.node_tree.nodes.new('ShaderNodeMixRGB'); mix.blend_type = 'MULTIPLY'
            mix.inputs[0].default_value = 1
            mix.inputs[2].default_value = tuple(map(linear, skin))+(1,)
            m.node_tree.links.new(source, mix.inputs[1]); m.node_tree.links.new(mix.outputs[0], inp)
        else:
            inp.default_value = tuple(map(linear, skin))+(1,)
        bs.inputs['Roughness'].default_value = .8
# Reuse Anna's actual latest vest mesh, retaining its shape and Body weights.
with bpy.data.libraries.load(str(P.parent/'anna-meshy-short-vest-v7/Anna-meshy-short-vest.blend'), link=False) as (src, dst):
    dst.objects = ['Anna_Vest']
vest = dst.objects[0]; bpy.context.collection.objects.link(vest)
vest.name = 'AgentK_Vest'; vest.parent = rig
for mod in vest.modifiers:
    if mod.type == 'ARMATURE': mod.object = rig
vest_source_hash = digest(vest)
vest.data.materials.clear(); vest.data.materials.append(material('K navy vest', (.25,.30,.44)))
black = material('K charcoal glasses', (.16,.17,.20), .5)
blue = material('K blue crystal', (.43,.66,.94), .32)
base = material('K crystal collar', (.32,.46,.72), .55)
props = []
def bind(o, bone):
    o.parent = rig
    g = o.vertex_groups.new(name=bone); g.add(list(range(len(o.data.vertices))), 1, 'REPLACE')
    mod = o.modifiers.new('Shared rig', 'ARMATURE'); mod.object = rig
    props.append(o)
def tube(name, points, radius, mat):
    c = bpy.data.curves.new(name, 'CURVE'); c.dimensions='3D'
    c.bevel_depth=radius; c.bevel_resolution=4
    sp=c.splines.new('POLY'); sp.points.add(len(points)-1)
    for p, co in zip(sp.points, points): p.co=(*co,1)
    o=bpy.data.objects.new(name,c); bpy.context.collection.objects.link(o); c.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH'); bind(o,'Head')
    return o
for sign in [-1,1]:
    x = sign*.22
    tube('Glasses rim '+str(sign), [(x+.167*math.cos(a),-.536,.39+.173*math.sin(a)) for a in [i*math.tau/96 for i in range(97)]], .019, black)
    tube('Glasses temple '+str(sign), [(sign*.382,-.536,.42),(sign*.47,-.42,.43),(sign*.505,-.20,.42),(sign*.50,.03,.37)], .014, black)
tube('Glasses bridge', [(-.053,-.54,.41),(0,-.56,.43),(.053,-.54,.41)], .016, black)
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=.15, depth=.045, location=(0,0,.965))
o=bpy.context.object; o.name='Crystal collar'; o.data.materials.append(base)
bevel=o.modifiers.new('Soft collar edge','BEVEL'); bevel.width=.014; bevel.segments=3
bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=bevel.name)
bind(o,'Head')
verts=[(0,0,1.55)]
for i in range(6):
    a=math.tau*i/6; verts.append((.235*math.cos(a), .19*math.sin(a),1.19))
verts.append((0,0,.98))
faces=[]
for i in range(6):
    j=(i+1)%6; faces.extend([(0,i+1,j+1),(7,j+1,i+1)])
mesh=bpy.data.meshes.new('Faceted crystal'); mesh.from_pydata(verts,[],faces); mesh.materials.append(blue)
o=bpy.data.objects.new('AgentK_Crystal',mesh); bpy.context.collection.objects.link(o); bind(o,'Head')
# Texture multiplication is baked into the copied base image for portable glTF.
for m in list(bpy.data.materials):
    if not m.use_nodes: continue
    bs=m.node_tree.nodes.get('Principled BSDF')
    if not bs or not bs.inputs['Base Color'].is_linked: continue
    node=bs.inputs['Base Color'].links[0].from_node
    if node.type != 'MIX_RGB': continue
    tex=node.inputs[1].links[0].from_node
    im=tex.image.copy(); im.name='AgentK_face_body'
    import numpy as np
    px=np.array(im.pixels[:],dtype=np.float32).reshape(-1,4)
    px[:,:3]*=np.array(skin)
    im.pixels.foreach_set(px.ravel()); im.pack(); tex.image=im
    m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
rig.animation_data.action=None
for pb in rig.pose.bones:
    pb.location=(0,0,0); pb.rotation_quaternion=(1,0,0,0); pb.scale=(1,1,1)
s.frame_set(1); bpy.context.view_layer.update()
export=[rig,vest]+[bpy.data.objects[n] for n in base_names]+props
bpy.ops.object.select_all(action='DESELECT')
for o in export: o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Agent-K.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Agent-K.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
report={'body_vertex_coordinates_unchanged':before=={n:digest(bpy.data.objects[n]) for n in base_names},'anna_v7_vest_geometry_unchanged':digest(vest)==vest_source_hash,'bones':[b.name for b in rig.data.bones],'game_changed':False}
assert report['body_vertex_coordinates_unchanged'] and report['anna_v7_vest_geometry_unchanged']
s.render.resolution_x=800; s.render.resolution_y=900; s.render.resolution_percentage=100
s.cycles.samples=24
cam=s.camera; cam.data.ortho_scale=2.9; target=Vector((0,0,.25))
for name,pos in [('front',(0,-6,.32)),('three-quarter',(3,-6,.7)),('side',(6,0,.32)),('back',(0,6,.32))]:
    cam.location=pos; cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'.png')); bpy.ops.render.render(write_still=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'Agent-K.glb'))
report['reimport_meshes']=[o.name for o in bpy.data.objects if o.type=='MESH']
report['reimport_actions']=[a.name for a in bpy.data.actions]
assert any(o.type=='ARMATURE' for o in bpy.data.objects)
assert any('Crystal' in o.name for o in bpy.data.objects)
(P/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
