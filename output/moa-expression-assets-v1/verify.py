import bpy
import json
import struct
import numpy as np
from pathlib import Path

P = Path(__file__).resolve().parent
parts = ['Somangi_Body', 'Eating_Torso', 'Rigid_Arm.L', 'Rigid_Arm.R',
         'Anna_PlumpLeaf', 'Anna_Vest']
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-meshy-short-vest-v7/Anna-meshy-short-vest.blend'))
baseline = {name: np.array([v.co[:] for v in bpy.data.objects[name].data.vertices]) for name in parts}
report = {}
for mode in ['smile', 'doze']:
    bpy.ops.wm.open_mainfile(filepath=str(P/('Moa-'+mode+'.blend')))
    for name in parts:
        assert np.array_equal(baseline[name], np.array([v.co[:] for v in bpy.data.objects[name].data.vertices])), name
    image = bpy.data.images['Moa_'+mode+'_BaseColor']
    assert np.isfinite(np.array(image.pixels[:])).all()
    loop = None
    if mode == 'doze':
        rig = bpy.data.objects['Somangi_Rig']
        rig.animation_data.action = bpy.data.actions['Seated_Doze']
        endpoints = []
        for frame in [1, 129]:
            bpy.context.scene.frame_set(frame)
            endpoints.append(np.array([np.array(pb.matrix) for pb in rig.pose.bones]))
        loop = float(np.max(abs(endpoints[0]-endpoints[1])))
        assert loop < 1e-5
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(P/('Moa-'+mode+'.glb')))
    names = [a.name for a in bpy.data.actions]
    assert len(names) == (9 if mode == 'doze' else 8), names
    if mode == 'doze':
        assert 'Seated_Doze' in names
    imported_meshes = [o.name for o in bpy.context.selected_objects if o.type == 'MESH']
    assert set(imported_meshes) == set(parts), imported_meshes
    report[mode] = {'original_mesh_coordinates_preserved': True, 'reimport_mesh_count': 6,
                    'reimport_clips': names, 'loop_endpoint_max_error': loop,
                    'texture_finite': True}
(P/'validation.json').write_text(json.dumps(report, indent=2))
print('VERIFIED', json.dumps(report))
