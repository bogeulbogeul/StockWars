import bpy,sys,json
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
sys.path.insert(0,str(P.parent/'somangi-bench-down-v1'))
from rig_utils import surface_hash
from correct_shoulders import bake
from merge_clip import merge_clip
for kind,clip in [('bread','Eat_Bread'),('drink','Drink_Beverage')]:
    bpy.ops.wm.open_mainfile(filepath=str(P/f'source-{kind}.blend'))
    body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_OriginalRig']
    original=surface_hash(body)
    body.data.normals_split_custom_set([(0,0,0)]*len(body.data.loops))
    result=bake(body,rig)
    assert surface_hash(body)==original
    bpy.ops.object.select_all(action='DESELECT')
    root=bpy.data.objects[kind+'_Prop']
    for o in [body,rig,root,*root.children]:o.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.wm.save_as_mainfile(filepath=str(P/f'somangi-{kind}.blend'))
    bpy.ops.export_scene.gltf(filepath=str(P/f'somangi-{kind}.glb'),export_format='GLB',use_selection=True,
        export_skins=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
        export_cameras=False,export_lights=False,export_morph=True)
    merge_clip(P/f'somangi-{kind}.glb',clip)
    result.update({'meshAndUvUnchanged':True,'meshHash':original,'durationSeconds':3,'gameInstalled':False})
    (P/f'{kind}-metadata.json').write_text(json.dumps(result,indent=2));print(kind,result)
