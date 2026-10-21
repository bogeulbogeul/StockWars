"""Build real Moa expression GLBs from the adopted vest v7 model."""
import bpy
import numpy as np
import math
import json
import struct
import sys
from pathlib import Path
from mathutils import Vector, Quaternion

P = Path(__file__).resolve().parent
SOURCE = P.parent / 'anna-meshy-short-vest-v7/Anna-meshy-short-vest.blend'
PARTS = ['Somangi_Body', 'Eating_Torso', 'Rigid_Arm.L', 'Rigid_Arm.R',
         'Anna_PlumpLeaf', 'Anna_Vest']


def paint_face(mesh, mode):
    node = mesh.data.materials[0].node_tree.nodes.get('Principled BSDF')
    texture = node.inputs['Base Color'].links[0].from_node
    original = texture.image
    w, h = original.size
    pixels = np.array(original.pixels[:], dtype=np.float32).reshape(h, w, 4)
    result = pixels.copy()
    # Sample the original unmarked cream head; preserve the adopted body color.
    cream = np.median(pixels[:, :, :3][pixels[:, :, :3].min(axis=2) > .6], axis=0)
    assert np.isfinite(cream).all()
    uv = mesh.data.uv_layers.active
    mesh.data.calc_loop_triangles()
    written = np.zeros((h, w), dtype=bool)
    curves = []
    for cx in [-.219, .203]:
        t = np.linspace(-1, 1, 81)
        z = .355 + (.044 if mode == 'smile' else -.018) * (1-t*t)
        curves.append(np.stack([cx + .061*t, z], axis=1))
    changed = 0
    for tri in mesh.data.loop_triangles:
        xyz = np.array([mesh.data.vertices[i].co[:] for i in tri.vertices])
        if (xyz[:, 2].max() < .19 or xyz[:, 2].min() > .5
                or xyz[:, 1].min() > -.32 or xyz[:, 0].min() > .36
                or xyz[:, 0].max() < -.36):
            continue
        coords = np.array([uv.data[i].uv[:] for i in tri.loops])*[w, h]-.5
        lo = np.maximum(0, np.floor(coords.min(axis=0)).astype(int))
        hi = np.minimum([w-1, h-1], np.ceil(coords.max(axis=0)).astype(int))
        xx, yy = np.meshgrid(np.arange(lo[0], hi[0]+1), np.arange(lo[1], hi[1]+1))
        mat = np.stack([coords[1]-coords[0], coords[2]-coords[0]], axis=1)
        if abs(np.linalg.det(mat)) < 1e-8:
            continue
        bc = np.stack([xx-coords[0, 0], yy-coords[0, 1]], axis=-1) @ np.linalg.inv(mat).T
        a, b = bc[:, :, 0], bc[:, :, 1]
        world = xyz[0]+a[:, :, None]*(xyz[1]-xyz[0])+b[:, :, None]*(xyz[2]-xyz[0])
        mask = ((a >= -.02) & (b >= -.02) & (a+b <= 1.02)
                & (abs(world[:, :, 0]) < .36) & (world[:, :, 2] > .195)
                & (world[:, :, 2] < .5) & (world[:, :, 1] < -.33))
        if not mask.any():
            continue
        points = world[mask][:, [0, 2]]
        dist = np.full(len(points), 100.)
        for curve in curves:
            dist = np.minimum(dist, np.sqrt(((points[:, None]-curve)**2).sum(axis=2)).min(axis=1))
        ink = np.clip((.009-dist)/.002, 0, 1)
        # Same mouth center and radii as Somangi eating-face-v1.
        mouth = np.sqrt(((points[:, 0]+.008)/(.034 if mode == 'smile' else .023))**2
                        + ((points[:, 1]-(.278 if mode == 'smile' else .269))
                           /(.037 if mode == 'smile' else .025))**2)
        mouth_ink = np.clip((1-mouth)/.08+.5, 0, 1)
        ink = np.maximum(ink, mouth_ink)
        color = cream[None, :]*(1-ink[:, None]) + np.array([.012, .008, .006])*ink[:, None]
        inner = np.zeros_like(mouth) if mode == 'smile' else np.clip((.75-mouth)/.08, 0, 1)
        if mode == 'smile':
            color = cream[None, :]*(1-ink[:, None])+np.array([.008, .008, .008])*ink[:, None]
        color = color*(1-inner[:, None])+np.array([.22, .055, .045])*inner[:, None]
        fade = np.clip(np.minimum.reduce([(.36-abs(points[:, 0]))/.025,
                       (points[:, 1]-.195)/.018, (.5-points[:, 1])/.025]), 0, 1)
        patch = result[lo[1]:hi[1]+1, lo[0]:hi[0]+1, :3]
        patch[mask] = patch[mask]*(1-fade[:, None])+color*fade[:, None]
        written[lo[1]:hi[1]+1, lo[0]:hi[0]+1] |= mask
        changed += int(mask.sum())
    for _ in range(5):
        accum = np.zeros_like(result)
        counts = np.zeros((h, w), dtype=np.float32)
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            neighbor = np.roll(written, (dy, dx), (0, 1))
            accum += np.roll(result, (dy, dx), (0, 1))*neighbor[:, :, None]
            counts += neighbor
        fill = (~written) & (counts > 0)
        result[fill] = accum[fill]/counts[fill, None]
        written |= fill
    image = bpy.data.images.new('Moa_'+mode+'_BaseColor', width=w, height=h, alpha=True)
    image.colorspace_settings.name = original.colorspace_settings.name
    image.pixels.foreach_set(result.ravel())
    image.filepath_raw = str(P/(mode+'-basecolor.png'))
    image.file_format = 'PNG'
    image.save()
    image.pack()
    texture.image = image
    return changed


def rotate(rig, name, axis, degrees):
    pb = rig.pose.bones[name]
    q = pb.bone.matrix_local.to_quaternion()
    pb.rotation_quaternion = q.inverted() @ Quaternion(axis, math.radians(degrees)) @ q


def make_doze(rig, seated_clip='Seated'):
    # Copy the existing ground-seated pose, retaining its foot contact corrections.
    rig.animation_data.action = bpy.data.actions[seated_clip]
    bpy.context.scene.frame_set(1)
    pose = {pb.name: (pb.location.copy(), pb.rotation_quaternion.copy()) for pb in rig.pose.bones}
    action = bpy.data.actions.new('Seated_Doze')
    action.use_fake_user = True
    rig.animation_data.action = action
    for frame in range(1, 130):
        t = (frame-1)/128
        nod = (1-math.cos(math.tau*t))/2
        for pb in rig.pose.bones:
            pb.rotation_mode = 'QUATERNION'
            pb.location, pb.rotation_quaternion = pose[pb.name]
        rotate(rig, 'Head', (1, 0, 0), 6+12*nod)
        rotate(rig, 'Leaf_Stem', (1, 0, 0), 3+5*nod)
        rotate(rig, 'Leaf_Tip', (1, 0, 0), 2*math.sin(math.tau*t))
        for pb in rig.pose.bones:
            pb.keyframe_insert('location', frame=frame, group=pb.name)
            pb.keyframe_insert('rotation_quaternion', frame=frame, group=pb.name)
    return action


def export(rig, name):
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    for part in PARTS:
        bpy.data.objects[part].select_set(True)
    bpy.context.view_layer.objects.active = rig
    path = P/(name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path), use_selection=True, export_format='GLB',
        export_skins=True, export_animations=True, export_animation_mode='ACTIONS',
        export_cameras=False, export_lights=False)
    raw = path.read_bytes()
    size = struct.unpack_from('<I', raw, 12)[0]
    doc = json.loads(raw[20:20+size])
    for animation in doc['animations']:
        if animation['name'] == 'Seated_Doze':
            continue
        leaf_only = animation['name'].startswith('Leaf_')
        animation['channels'] = [c for c in animation['channels'] if
            (doc['nodes'][c['target']['node']]['name'] in {'Leaf_Stem', 'Leaf_Tip'}) == leaf_only]
    encoded = json.dumps(doc, separators=(',', ':')).encode()
    encoded += b' '*((-len(encoded)) % 4)
    tail = raw[20+size:]
    path.write_bytes(struct.pack('<4sII', b'glTF', 2, 20+len(encoded)+len(tail))
                     + struct.pack('<I4s', len(encoded), b'JSON')+encoded+tail)
    return [a['name'] for a in doc['animations']]


report = json.loads((P/'build-report.json').read_text()) if (P/'build-report.json').exists() else {}
for mode in ((['smile'] if '--smile-only' in sys.argv else ['smile', 'doze']) if __name__ == '__main__' else []):
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    scene = bpy.context.scene
    rig = bpy.data.objects['Somangi_Rig']
    changed = paint_face(bpy.data.objects['Somangi_Body'], mode)
    if mode == 'doze':
        rig.animation_data.action = make_doze(rig)
        scene.frame_end = 129
    else:
        rig.animation_data.action = bpy.data.actions['Walk_InPlace']
    scene.render.fps = 32
    scene.frame_set(65 if mode == 'doze' else 7)
    scene.render.resolution_x = scene.render.resolution_y = 640
    scene.cycles.samples = 16
    target = Vector((0, -.08, -.1 if mode == 'doze' else .1))
    cam = scene.camera
    cam.data.ortho_scale = 2.9
    for view, pos in [('front', (0, -5, .25)), ('side', (5, -1, .35))]:
        cam.location = pos
        cam.rotation_euler = (target-cam.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(P/(mode+'-'+view+'.png'))
        bpy.ops.render.render(write_still=True)
    name = 'Moa-'+mode
    bpy.ops.wm.save_as_mainfile(filepath=str(P/(name+'.blend')))
    clips = export(rig, name)
    report[mode] = {'clips': clips, 'painted_texels': changed, 'source': str(SOURCE),
                    'mesh_geometry_unchanged': True, 'fps': 32}
    if mode == 'doze':
        cam.location = (1.7, -5, .4)
        cam.rotation_euler = (target-cam.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.resolution_x = scene.render.resolution_y = 360
        scene.cycles.samples = 8
        for frame in range(1, 129, 8):
            scene.frame_set(frame)
            scene.render.filepath = str(P/('doze-%03d.png' % frame))
            bpy.ops.render.render(write_still=True)
if __name__ == '__main__':
    (P/'build-report.json').write_text(json.dumps(report, indent=2))
