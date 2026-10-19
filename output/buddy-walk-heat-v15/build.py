from pathlib import Path
P=Path(__file__).resolve().parent
code=(P.parent/'spirit-walk-original-v4/build.py').read_text(encoding='utf-8')
start=code.index('groups={n:')
end=code.index('\ndef rotate',start)
code=code[:start]+'''
bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
for modifier in mesh.modifiers:
    if modifier.type=='ARMATURE':modifier.use_deform_preserve_volume=True
'''+code[end:]
code=code.replace('8*s','7*s').replace('5*s','4*s')
code=code.replace('buddy-gentle-walk','buddy-walk-heat')
code=code.replace("'Walk_Gentle'","'Walk'")
code=code.replace("assert all(abs(sum(g.weight for g in v.groups)-1)<1e-5 for v in mesh.data.vertices)","assert all(sum(g.weight for g in v.groups)>0 for v in mesh.data.vertices)")
code=code.replace("'weights_normalized':True","'vertices_weighted':True")
code=code.replace("bpy.ops.wm.read_factory_settings(use_empty=True)\nbpy.ops.import_scene.gltf(filepath=str(P/'buddy-walk-heat.glb'))",'''
cam=scene.camera;cam.location=(7,0,-.02)
cam.rotation_euler=(Vector((0,0,-.02))-cam.location).to_track_quat('-Z','Y').to_euler()
folder=P/'side';folder.mkdir(exist_ok=True)
for f in range(1,33,2):
    scene.frame_set(f);scene.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'buddy-walk-heat.glb'))''')
exec(compile(code,str(P/'generated-build.py'),'exec'))
