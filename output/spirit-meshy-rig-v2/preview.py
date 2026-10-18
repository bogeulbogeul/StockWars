import bpy, json
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'buddy-tpose-rig.blend'))
rig=bpy.data.objects['Buddy_Rig'];scene=bpy.context.scene
scene.render.resolution_x=480;scene.render.resolution_y=480
for label,action,end,step in [('walk','Walk',33,2),('wave','Wave',73,3)]:
    folder=P/(label+'_frames');folder.mkdir(exist_ok=True)
    rig.animation_data.action=bpy.data.actions[action]
    for frame in range(1,end+1,step):
        scene.frame_set(frame);scene.render.filepath=str(folder/f'{frame:03}.png')
        bpy.ops.render.render(write_still=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'buddy-tpose-rig.glb'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
assert len(rig.data.bones)==7
assert len(bpy.data.actions)==5
(P/'export-validation.json').write_text(json.dumps({'bones':len(rig.data.bones),'actions':[a.name for a in bpy.data.actions],'glb_reimport':'passed'},indent=2))
