"""Inspect the delivered GLB base colours by anatomical region."""
import bpy, numpy as np, json
from pathlib import Path
P = Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'moa.glb'))
body = max((o for o in bpy.context.scene.objects if o.type == 'MESH'), key=lambda o: len(o.data.vertices))
mesh = body.data
cache, samples = {}, {}
for poly in mesh.polygons:
    center = sum((mesh.vertices[i].co for i in poly.vertices), start=mesh.vertices[poly.vertices[0]].co*0)/len(poly.vertices)
    region = 'head' if center.z > .04 else ('legs' if center.z < -.55 else ('arms' if abs(center.x) > .34 else 'torso'))
    mat = mesh.materials[poly.material_index]
    bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    links = bsdf.inputs['Base Color'].links
    if links:
        node = links[0].from_node
        if node.type != 'TEX_IMAGE':
            continue
        img = node.image
        if img.name not in cache:
            cache[img.name] = np.array(img.pixels[:], dtype=np.float32).reshape(img.size[1], img.size[0], 4)
        uv = sum((mesh.uv_layers.active.data[i].uv for i in poly.loop_indices), start=mesh.uv_layers.active.data[poly.loop_start].uv*0)/len(poly.loop_indices)
        rgb = cache[img.name][int(uv.y*img.size[1])%img.size[1],int(uv.x*img.size[0])%img.size[0],:3]
    else:
        linear = np.array(bsdf.inputs['Base Color'].default_value[:3])
        rgb = np.where(linear <= .0031308, 12.92*linear, 1.055*linear**(1/2.4)-.055)
    if min(rgb) < .25:  # Exclude intentional black facial ink.
        continue
    samples.setdefault(region, []).append(rgb.tolist())
result = {}
for region, values in samples.items():
    a = np.array(values)
    result[region] = dict(sampledFaces=len(a), medianSRGB=np.median(a,axis=0).round(5).tolist(),
        minimumSRGB=a.min(axis=0).round(5).tolist(), maximumSRGB=a.max(axis=0).round(5).tolist(),
        nearWhiteFaces=int(np.sum(a.min(axis=1)>.92)))
(P/'colour-check.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
