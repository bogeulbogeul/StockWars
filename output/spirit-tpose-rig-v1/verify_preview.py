import bpy,json,math
from pathlib import Path
OUT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(OUT/'buddy-tpose.blend'))
rig=bpy.data.objects['Buddy_Rigid_Rig']
errors=[]
assert not any('knee' in b.name.lower() or 'elbow' in b.name.lower() for b in rig.data.bones)
for obj in bpy.context.scene.objects:
    if obj.type!='MESH' or not obj.vertex_groups:continue
    assert all(len(v.groups)==1 and abs(v.groups[0].weight-1)<1e-6 for v in obj.data.vertices),obj.name
    base=[v.co.copy() for v in obj.data.vertices]
    for action in ['Walk','Wave','Eat']:
        rig.animation_data.action=bpy.data.actions[action]
        for f in [1,9,17,25,33]:
            bpy.context.scene.frame_set(f)
            ev=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
            for a,b in [(0,len(base)//2),(len(base)//3,len(base)-1)]:
                delta=abs((ev.data.vertices[a].co-ev.data.vertices[b].co).length-(base[a]-base[b]).length)
                assert delta<.0001,(obj.name,action,f,delta)
scene=bpy.context.scene
scene.render.resolution_x=420;scene.render.resolution_y=420
for name,frames in [('Walk',range(1,34,2)),('Wave',range(1,74,3)),('Eat',range(1,74,3))]:
    rig.animation_data.action=bpy.data.actions[name]
    food=bpy.data.objects['Food_demo_prop'];food.hide_render=name!='Eat';food.hide_set(name!='Eat')
    folder=OUT/name.lower();folder.mkdir(exist_ok=True)
    for i,f in enumerate(frames):
        scene.frame_set(f);scene.render.filepath=str(folder/f'{i:03}.png')
        bpy.ops.render.render(write_still=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(OUT/'buddy-tpose.glb'))
clips=sorted(a.name for a in bpy.data.actions)
assert all(any(n in c for c in clips) for n in ['Idle','Walk','Wave','Eat']),clips
(OUT/'validation.json').write_text(json.dumps({'rigid_distance_check':'passed','single_bone_weights':'passed','glb_reimport_clips':clips},indent=2),encoding='utf-8')
print('VALIDATED',clips)
