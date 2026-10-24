"""Fit the user-supplied AnnaVest to the current Moa without replacing her body."""
import bpy, sys, json, numpy as np
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
BASE=P.parent/'moa-somangi-base-v1'
sys.path.insert(0,str(BASE))
from leaf_moods import isolate_exported_tracks
bpy.ops.wm.open_mainfile(filepath=str(BASE/'moa.blend'))
scene=bpy.context.scene
scene.frame_set(1)
body=bpy.data.objects['Somangi_SmoothBody']
rig=bpy.data.objects['Somangi_WholeArmRig']
original=np.array([v.co[:] for v in body.data.vertices])
old=bpy.data.objects.get('Moa_GreenVest')
if old:
 bpy.data.objects.remove(old,do_unlink=True)
before=set(scene.objects)
source=P.parent/'moa-anna-vest-v2/AnnaVest-source.glb'
bpy.ops.import_scene.gltf(filepath=str(source))
new=[o for o in scene.objects if o not in before]
vest=next(o for o in new if o.type=='MESH')
vest.name='Moa_AnnaVest'
matrix=vest.matrix_world.copy()
source_uv=np.array([p.uv[:] for p in vest.data.uv_layers.active.data])
source_faces=[tuple(p.vertices) for p in vest.data.polygons]
for v in vest.data.vertices:
 point=matrix@v.co
 height=(point.z+.734)/1.468
 depth_scale=.39+.56*height*height
 width_scale=.385+.015*height*height
 v.co=(point.x*width_scale,point.y*depth_scale,point.z*.38-.22)
 # Only the collar and upper chest move closer to the body.
 t=max(0,min(1,(v.co.z+.22)/.18))
 upper=t*t*(3-2*t)
 v.co.x*=1-.025*upper
 v.co.y*=1-.14*upper
vest.parent=None
vest.matrix_world.identity()
sys.path.append(str(P.parent/'moa-anna-vest-armholes-v5'))
from walk_attachment import repair_walk
repair_walk(body,rig,P)
assert np.array_equal(source_uv,np.array([p.uv[:] for p in vest.data.uv_layers.active.data]))
assert source_faces==[tuple(p.vertices) for p in vest.data.polygons]
vest.vertex_groups.clear()
vest.vertex_groups.new(name='Body').add(list(range(len(vest.data.vertices))),1,'REPLACE')
vest.modifiers.new('Follow Moa body','ARMATURE').object=rig
vest.parent=rig
for ob in new:
 if ob!=vest:
  bpy.data.objects.remove(ob,do_unlink=True)
assert np.array_equal(original,np.array([v.co[:] for v in body.data.vertices]))
exports=[body,rig,vest,bpy.data.objects['Moa_Leaf'],bpy.data.objects['Moa_LeafStem']]
bpy.ops.object.select_all(action='DESELECT')
for ob in exports:
 ob.hide_set(False)
 ob.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.wm.save_as_mainfile(filepath=str(P/'moa.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'moa.glb'),use_selection=True,
 export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',
 export_frame_range=False,export_cameras=False,export_lights=False)
isolate_exported_tracks(P/'moa.glb')
(P/'fit-check.json').write_text(json.dumps(dict(
 source=str(source),sourceVertices=len(vest.data.vertices),
 scaling=['0.385 + 0.015 * normalizedHeight^2','0.39 + 0.56 * normalizedHeight^2',.38],translation=[0,0,-.22],
 originalFacesAndUVVerified=True,noRetiredGarmentLoaded=True,
 upperOnlyFit=dict(startZ=-.22,fullZ=-.04,maximumDepthReduction=.14,maximumWidthReduction=.025),
 bodyVertexChange=0,originalVestMaterialPreserved=True,
 bodyBone='Body',gameInstalled=False),indent=2))
# Render the actual exported GLB with the same studio setup as the prior version.
code=(BASE/'build.py').read_text()
exec(code.split('# Render the exported model itself, not a separate illustration.')[1].split('imported_rig =')[0])
# Opposing walk poses show the supplied vest with the original walk.
imported_rig=next(o for o in scene.objects if o.type=='ARMATURE')
imported_rig.animation_data_create()
for track in imported_rig.animation_data.nla_tracks:
 track.mute=True
action=next(a for a in bpy.data.actions if a.name.startswith('Walk_InPlace'))
imported_rig.animation_data.action=action
imported_rig.animation_data.action_slot=action.slots[0]
target=Vector((0,0,.22))
cam.data.ortho_scale=2.8
for name,pos in [('front',(0,-6,.22)),('side',(-6,0,.22))]:
 cam.location=pos
 cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
 for phase in (.25,.75):
  scene.frame_set(round(1+(action.frame_range[1]-1)*phase))
  scene.render.filepath=str(P/f'walk-{name}-{phase}.png')
  bpy.ops.render.render(write_still=True)
scene.frame_set(1)
scene.render.resolution_x=640;scene.render.resolution_y=640
cam.data.ortho_scale=.9
target=Vector((0,0,-.12))
for name,pos in [('upper-front',(0,-6,-.12)),('upper-side',(-6,0,-.12))]:
 cam.location=pos
 cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(P/(name+'.png'))
 bpy.ops.render.render(write_still=True)
