"""Replace the outdated Anna in the assembled visitor scene with vest v5."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'somangi-stool-fit-v1'/'Somangi-stool-fit-preview.blend'))
holder=bpy.data.objects['Anna_Provisional_Chair_Fit']
old=list(holder.children_recursive)
for obj in old:bpy.data.objects.remove(obj,do_unlink=True)
source=ROOT.parent/'anna-meshy-short-vest-v5'/'Anna-meshy-short-vest.blend'
names=['Somangi_Rig','Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Anna_PlumpLeaf','Anna_Vest']
with bpy.data.libraries.load(str(source),link=False) as (data,target):
    target.objects=[n for n in data.objects if n in names]
    target.actions=['Seated']
objects=[o for o in target.objects if o]
assert len(objects)==7
for obj in objects:bpy.context.collection.objects.link(obj)
rig=next(o for o in objects if o.type=='ARMATURE')
rig.animation_data_create();rig.animation_data.action=target.actions[0]
for track in rig.animation_data.nla_tracks:track.mute=True
for obj in objects:
    if obj.parent not in objects:obj.parent=holder
scene=bpy.context.scene;scene.frame_set(1);bpy.context.view_layer.update()
cam=scene.camera;cam.data.type='ORTHO';cam.data.ortho_scale=4.3
scene.render.resolution_x=1400;scene.render.resolution_y=1100
cam.location=(3.5,-4,3.5)
cam.rotation_euler=(Vector((0,.65,.85))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'desk-preview.png');bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=2.2;cam.location=(2.7,.5,2.4)
cam.rotation_euler=(Vector((0,2.1,1.0))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'anna-detail.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-latest-anna-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'replaced_source':'anna-sit-v1/Anna-sit.blend',
    'current_source':str(source),'clip':'Seated',
    'character_geometry_changed':False,'placement':'preserved',
    'status':'Current vest placed; static visual review only, full dynamic collision not verified',
    'game_changed':False},indent=2),encoding='utf-8')
