"""Render the delivered vest at opposing walk poses."""
import bpy
from pathlib import Path
from mathutils import Vector
P = Path(__file__).resolve().parent
code = (P/'build.py').read_text()
exec(code.split('# Render the exported model itself, not a separate illustration.')[1].split('for name, pos in')[0])
rig = next(o for o in scene.objects if o.type=='ARMATURE')
rig.animation_data_create()
for track in rig.animation_data.nla_tracks:
    track.mute=True
action = next(a for a in bpy.data.actions if a.name.startswith('Walk_InPlace'))
rig.animation_data.action=action
rig.animation_data.action_slot=action.slots[0]
for name,pos in [('front',(0,-6,.22)),('side',(-6,0,.22))]:
    cam.location=pos
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    for phase in (.25,.75):
        scene.frame_set(round(1+(action.frame_range[1]-1)*phase))
        scene.render.filepath=str(P/f'vest-walk-{name}-{phase}.png')
        bpy.ops.render.render(write_still=True)
