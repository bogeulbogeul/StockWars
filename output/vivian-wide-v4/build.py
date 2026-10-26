"""Widen the shop 15%, retaining door/window/emblem dimensions."""
import bpy,sys,json,hashlib
from pathlib import Path
from mathutils import Matrix,Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-redesign-v3'/'VivianStore-redesign.blend'))
scene=bpy.context.scene
asset=[o for o in scene.objects if o.type in ('MESH','CURVE','EMPTY') and not o.get('preview_only',False) and not o.name.startswith('Preview_')]
preserved=[]
for o in asset:
    name=o.name
    if name.startswith(('Left_Display','Right_Display')):
        dx=-.82*.15 if name.startswith('Left') else .82*.15
        o.matrix_world=Matrix.Translation((dx,0,0)) @ o.matrix_world
    elif name.startswith(('Timber_Corner_Post','Grounded_Cream_Post_Foot','Timber_Post_Base_Bead')):
        o.matrix_world=Matrix.Translation((o.location.x*.15,0,0)) @ o.matrix_world
    elif name.startswith(('Door_','Central_Arched_Wood_Door','Flower_','Entry_')):
        preserved.append(name)
    else:o.matrix_world=Matrix.Diagonal((1.15,1,1,1)) @ o.matrix_world
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'VivianStore-clean.glb'),export_format='GLB',use_selection=True)
cam=scene.camera;scene.cycles.samples=24
for name,loc,target,scale in [('front-right',(4,-6,3.5),(0,-.08,1.1),4.7),('front',(0,-7,2.8),(0,-.08,1.1),4.7)]:
    cam.location=loc;cam.data.ortho_scale=scale;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'VivianStore-wide.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'horizontalFactor':1.15,'preservedSize':preserved,
    'sha256':hashlib.sha256((ROOT/'VivianStore-clean.glb').read_bytes()).hexdigest()},indent=2))
