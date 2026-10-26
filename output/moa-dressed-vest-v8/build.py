"""Use the retired Moa's AnnaVest garment shape on the current Moa only."""
import bpy,sys,json,numpy as np
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
BASE=P.parent/'moa-somangi-base-v1'
sys.path.insert(0,str(BASE))
from leaf_moods import isolate_exported_tracks
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'moa-anna-vest-armpit-v7/moa.blend'))
scene=bpy.context.scene
scene.frame_set(1)
body=bpy.data.objects['Somangi_SmoothBody']
rig=bpy.data.objects['Somangi_WholeArmRig']
original=np.array([v.co[:] for v in body.data.vertices])
bpy.data.objects.remove(bpy.data.objects['Moa_AnnaVest'],do_unlink=True)
before=set(scene.objects)
actions=set(bpy.data.actions)
source=P.parent/'fairy-clothing-closefit-v5/moa-bench-sit.glb'
bpy.ops.import_scene.gltf(filepath=str(source))
added=set(scene.objects)-before
vest=next(o for o in added if o.name=='Anna_Vest')
matrix=vest.matrix_world.copy()
vest.modifiers.clear()
vest.animation_data_clear()
for vertex in vest.data.vertices:
    point=matrix@vertex.co
    height=max(0,min(1,(point.z+.465)/.578))
    depth=.84+.40*height*height
    vertex.co=(point.x*.96,point.y*depth,point.z*.96-.05)
vest.parent=None
vest.matrix_world.identity()
vest.name='Moa_AnnaVest'
vest.vertex_groups.clear()
vest.vertex_groups.new(name='Body').add(list(range(len(vest.data.vertices))),1,'REPLACE')
vest.parent=rig
vest.modifiers.new('Current Moa body rig','ARMATURE').object=rig
# Only the garment is retained from the retired model, no old body/rig/actions.
for ob in added:
    if ob!=vest:bpy.data.objects.remove(ob,do_unlink=True)
for action in list(bpy.data.actions):
    if action not in actions:bpy.data.actions.remove(action,do_unlink=True)
assert np.array_equal(original,np.array([v.co[:] for v in body.data.vertices]))
exports=[body,rig,vest,bpy.data.objects['Moa_Leaf'],bpy.data.objects['Moa_LeafStem']]
bpy.ops.object.select_all(action='DESELECT')
for ob in exports:
    ob.hide_set(False);ob.hide_render=False;ob.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.wm.save_as_mainfile(filepath=str(P/'moa.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'moa.glb'),use_selection=True,
    export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',
    export_frame_range=False,export_cameras=False,export_lights=False)
isolate_exported_tracks(P/'moa.glb')
(P/'garment-check.json').write_text(json.dumps(dict(
    source=str(source),garment='Anna_Vest',vertices=len(vest.data.vertices),
    scale=[.96,'0.84 + 0.40 * normalizedHeight^2',.96],translation=[0,0,-.05],
    retainedLegacyObjects=['Anna_Vest only'],currentBodyVertexChange=0,
    currentLeafAndRigRetained=True,gameInstalled=False),indent=2))
code=(BASE/'build.py').read_text()
exec(code.split('# Render the exported model itself, not a separate illustration.')[1].split('imported_rig =')[0])
imported_rig=next(o for o in scene.objects if o.type=='ARMATURE')
imported_rig.animation_data_create()
for track in imported_rig.animation_data.nla_tracks:track.mute=True
action=next(a for a in bpy.data.actions if a.name.startswith('Walk_InPlace'))
imported_rig.animation_data.action=action
imported_rig.animation_data.action_slot=action.slots[0]
target=Vector((0,0,.22));cam.data.ortho_scale=2.8
for name,pos in [('front',(0,-6,.22)),('side',(-6,0,.22))]:
    cam.location=pos
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    for phase in (.25,.75):
        scene.frame_set(round(1+(action.frame_range[1]-1)*phase))
        scene.render.filepath=str(P/f'walk-{name}-{phase}.png')
        bpy.ops.render.render(write_still=True)
