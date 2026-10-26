"""Reload each delivered GLB; inspect finite bounds and mailbox clearance."""
import bpy,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
report={}
for file in ('Home-redesign.glb','Mailbox-right.glb','Home-with-right-mailbox.glb'):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/file))
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
    pts=[o.matrix_world @ v.co for o in meshes for v in o.data.vertices]
    assert pts and all(math.isfinite(c) for p in pts for c in p)
    assert min(p.z for p in pts)>-.001
    if file=='Home-with-right-mailbox.glb':
        mail=bpy.data.objects['Home_Right_Mailbox']
        mp=[o.matrix_world@v.co for o in mail.children for v in o.data.vertices]
        steps=[o for o in meshes if o.name.startswith(('Home_Entry_','Home_Continuous_Door_Threshold'))]
        sp=[o.matrix_world@v.co for o in steps for v in o.data.vertices]
        assert min(p.x for p in mp)>max(p.x for p in sp)+.05
        assert abs(min(p.z for p in mp))<.001
        assert any(o.name.startswith('Home_Pitched_Roof') for o in meshes)
    report[file]={'meshes':len(meshes),'ground':min(p.z for p in pts),'finite':True}
(ROOT/'validation.json').write_text(json.dumps(report,indent=2))
print('PASS',json.dumps(report))
