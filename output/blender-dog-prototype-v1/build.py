"""Standalone procedural puppy prototype; Blender background Python."""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

OUT = Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
ORANGE = (0.95, 0.48, 0.16, 1)
CREAM = (1.0, 0.88, 0.67, 1)
DARK = (0.10, 0.035, 0.015, 1)

def material(name, color):
    m = bpy.data.materials.new(name)
    m.diffuse_color = color
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = tuple(((c/12.92) if c <= .04045 else ((c+.055)/1.055)**2.4) for c in color[:3]) + (1,)
    bs.inputs['Roughness'].default_value = 0.88
    return m

orange = material('Orange matte', ORANGE)
cream = material('Cream matte', CREAM)
dark = material('Nose matte', DARK)

def ellipsoid(name, loc, scale, mat=orange, rotation=0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.rotation_euler[1] = rotation
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj

def merge_smooth(parts, name, voxel):
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    obj = parts[0]
    obj.name = name
    mod = obj.modifiers.new('Continuous surface', 'REMESH')
    mod.mode = 'VOXEL'
    mod.voxel_size = voxel
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod = obj.modifiers.new('Soft transitions', 'SMOOTH')
    mod.factor = 0.65
    mod.iterations = 5
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod = obj.modifiers.new('Prototype reduction', 'DECIMATE')
    mod.ratio = 0.38
    bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj

# The back of each ear overlaps the skull, then is remeshed into one surface.
head_parts = [ellipsoid('Head', (0, 0, 2.22), (0.82, 0.58, 0.75))]
for s in (-1, 1):
    head_parts.append(ellipsoid('Ear', (s*0.76, -0.31, 2.39),
                               (0.235, 0.28, 0.43), rotation=s*-0.30))
head = merge_smooth(head_parts, 'Head with joined ears', 0.035)

parts = [ellipsoid('Body', (0, 0, 1.02), (0.47, 0.34, 0.67))]
for s in (-1, 1):
    parts.append(ellipsoid('Leg', (s*0.25, 0, 0.40), (0.22, 0.24, 0.37)))
    parts.append(ellipsoid('Arm', (s*0.61, 0, 1.23),
                           (0.19, 0.20, 0.48), rotation=s*-0.95))
body = merge_smooth(parts, 'Body A pose', 0.035)
for s in (-1, 1):
    ellipsoid('Cream foot', (s*0.26, -0.095, 0.16), (0.24, 0.30, 0.16), cream)
    ellipsoid('Cream hand', (s*0.93, 0, 1.00), (0.195, 0.205, 0.20), cream)

# Belly marking is painted, with a smooth boundary independent of mesh edges.
belly_pixels = []
for j in range(512):
    z = j/511*2
    for i in range(512):
        x = (i/511-.5)*2.6
        c = CREAM if (x/.31)**2+((z-1.06)/.53)**2 < 1 else ORANGE
        belly_pixels.extend(c)
belly_image = bpy.data.images.new('Body color', width=512, height=512, alpha=False)
belly_image.pixels = belly_pixels
belly_image.filepath_raw = str(OUT/'body-color.png')
belly_image.file_format = 'PNG'
belly_image.save()
belly_image.pack()
belly_mat = material('Body painted color', ORANGE)
bn = belly_mat.node_tree.nodes.new('ShaderNodeTexImage')
bn.image = belly_image
belly_mat.node_tree.links.new(bn.outputs['Color'], belly_mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
body.data.materials.clear()
body.data.materials.append(orange)
body.data.materials.append(belly_mat)
body_uv = body.data.uv_layers.new(name='BodyProjection')
for p in body.data.polygons:
    p.material_index = 1 if (body.matrix_world @ p.center).y < -.08 else 0
    for li in p.loop_indices:
        v = body.matrix_world @ body.data.vertices[body.data.loops[li].vertex_index].co
        body_uv.data[li].uv = (v.x/2.6+.5, v.z/2)

# Smooth continuous tail, rooted in the rear pelvis.
curve = bpy.data.curves.new('Tail curve', 'CURVE')
curve.dimensions = '3D'
curve.bevel_depth = 0.13
curve.bevel_resolution = 3
curve.resolution_u = 12
curve.use_fill_caps = True
spline = curve.splines.new('BEZIER')
spline.bezier_points.add(3)
for point, co, radius in zip(spline.bezier_points,
        [(0, .24, .65), (-.40, .36, .60), (-.68, .30, .78), (-.70, .24, 1.02)],
        [1.15, 1.15, 1.0, .60]):
    point.co = co
    point.radius = radius
    point.handle_left_type = point.handle_right_type = 'AUTO'
tail = bpy.data.objects.new('Tail', curve)
bpy.context.collection.objects.link(tail)
curve.materials.append(orange)
ellipsoid('Cream tail tip', (-.70, .24, 1.02), (.085, .085, .13), cream)
ellipsoid('Small nose', (0, -.580, 2.04), (.095, .055, .065), dark)

def face_image(expression):
    size = 512
    pixels = []
    for j in range(size):
        z = (j/(size-1)-.5)*1.6 + 2.22
        for i in range(size):
            x = (i/(size-1)-.5)*1.8
            color = ORANGE
            if (x/.48)**2 + ((z-1.98)/.27)**2 < 1:
                color = CREAM
            for s in (-1, 1):
                dx, dz = x-s*.29, z-2.30
                if expression == 'blink':
                    eye = abs(dz + .10*(dx/.105)**2) < .018 and abs(dx)<.105
                elif expression == 'happy':
                    eye = abs(dz - .07 + .13*(dx/.105)**2)<.018 and abs(dx)<.105
                else:
                    eye = (dx/.105)**2 + (dz/.15)**2 < 1
                if eye:
                    color = DARK
                if expression == 'neutral' and ((dx+.025)/.028)**2+((dz-.065)/.035)**2<1:
                    color = (1, 1, 1, 1)
                if (dx/.09)**2+((z-2.57)/.045)**2<1:
                    color = CREAM
            # Two clean painted smile arcs; no mouth or chin mesh.
            for s in (-1, 1):
                dist = math.sqrt((x-s*.075)**2+(z-1.995)**2)
                if abs(dist-.075)<.012 and z<1.995:
                    color = DARK
            pixels.extend(color)
    img = bpy.data.images.new('Face '+expression, width=size, height=size, alpha=False)
    img.pixels = pixels
    img.filepath_raw = str(OUT / ('face-'+expression+'.png'))
    img.file_format = 'PNG'
    img.save()
    img.pack()
    return img

images = {e:face_image(e) for e in ('neutral', 'blink', 'happy')}
face = material('Face texture - swap image for expressions', ORANGE)
nodes = face.node_tree.nodes
tex = nodes.new('ShaderNodeTexImage')
tex.name = 'EXPRESSION_IMAGE'
tex.image = images['neutral']
face.node_tree.links.new(tex.outputs['Color'], nodes.get('Principled BSDF').inputs['Base Color'])
head.data.materials.clear()
head.data.materials.append(orange)
head.data.materials.append(face)
uv = head.data.uv_layers.new(name='FaceProjection')
for poly in head.data.polygons:
    c = head.matrix_world @ poly.center
    poly.material_index = 1 if c.y < -.12 else 0
    for li in poly.loop_indices:
        v = head.matrix_world @ head.data.vertices[head.data.loops[li].vertex_index].co
        uv.data[li].uv = (v.x/1.8+.5, (v.z-2.22)/1.6+.5)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.render.resolution_x = 800
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.world.color = (.38, .38, .38)
scene.view_settings.view_transform = 'Standard'
scene.render.image_settings.file_format = 'PNG'

def aim(obj, target):
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()

for loc, power, size in [((-3,-4,6), 350, 5), ((3,-2,4), 250, 4), ((0,3,5),120,3)]:
    bpy.ops.object.light_add(type='AREA', location=loc)
    bpy.context.object.data.energy = power
    bpy.context.object.data.shape = 'DISK'
    bpy.context.object.data.size = size
    aim(bpy.context.object, (0,0,1.5))
bpy.ops.object.camera_add(location=(0,-7,1.6))
camera = bpy.context.object
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 3.65
scene.camera = camera
for label, loc in [('front',(0,-7,1.6)), ('side',(7,0,1.6)), ('back',(0,7,1.6))]:
    camera.location = loc
    aim(camera,(0,0,1.5))
    scene.render.filepath = str(OUT/(label+'.png'))
    bpy.ops.render.render(write_still=True)
camera.location = (0,-7,1.6)
aim(camera,(0,0,1.5))
for expression in ('blink', 'happy'):
    tex.image = images[expression]
    scene.render.filepath = str(OUT/(expression+'.png'))
    bpy.ops.render.render(write_still=True)
tex.image = images['neutral']
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'dog.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'dog.glb'), export_format='GLB',
                          export_cameras=False, export_lights=False)
for obj in scene.objects:
    if obj.type == 'MESH':
        obj.data.calc_loop_triangles()
report = {'status':'prototype, not game-installed', 'expressions':list(images),
          'rigged':False, 'triangles':sum(len(o.data.loop_triangles) for o in scene.objects if o.type=='MESH')}
(OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf8')
