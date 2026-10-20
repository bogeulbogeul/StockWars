"""Match the three exterior window positions to the expanded interior shell."""
import bpy
import json
import sys
from pathlib import Path
from mathutils import Vector,Matrix

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,extrude,arch_outline

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-sprout-mark-v1'/'Office-wall-mark-preview.blend'))
# Keep the continuous lower trim below the aligned window sill, rather than
# cutting through it. Compress the panel/rail together; preserve base skirting.
for obj in bpy.context.scene.objects:
    if obj.name.startswith(('Continuous_Wainscot','Continuous_Wainscot_Rail')):
        for vertex in obj.data.vertices:vertex.co.z*=.70
cream=bpy.data.objects['Back_Wall'].data.materials[0]
frontwall=box('Front_Wall_Cutaway',(8.28,.14,2.8),(0,-3.07,1.4),cream,0)
front_objects=[frontwall]
# Match normalized positions within the exterior usable wall extents.
sx=8/2.98;sy=6/1.84;sz=2.8/1.35
bottom=(.47-.15)*sz
frontx=.99*sx
specs=[{'name':'Front_Left','center':(-frontx,-3.015,bottom),'rotation':3.141592653589793,
        'scale':(.255/.43*sx,1,(.41+.255)/1.11*sz),'wall':frontwall,'front':True},
       {'name':'Front_Right','center':(frontx,-3.015,bottom),'rotation':3.141592653589793,
        'scale':(.255/.43*sx,1,(.41+.255)/1.11*sz),'wall':frontwall,'front':True},
       {'name':'Right_Side','center':(4.015,0,bottom),'rotation':-3.141592653589793/2,
        'scale':(.255/.43*sy,1,(.41+.255)/1.11*sz),'wall':bpy.data.objects['Side_Wall.001'],'front':False}]
# Resolve the right wall by measured location, not creation-order names.
specs[-1]['wall']=next(o for o in bpy.context.scene.objects if o.name.startswith('Side_Wall') and o.location.x>0)
for spec in specs:
    wall=spec['wall'];x,y,z=spec['center'];wx,_,hz=spec['scale']
    outline=[(a*wx,b*hz+z) for a,b in arch_outline(.43,.68)]
    cutter=extrude('Opening_Cutter',outline,-.45,.45,cream,0)
    if spec['front']:cutter.location.y=-3.07;cutter.location.x=x
    else:cutter.rotation_euler.z=1.5707963267948966;cutter.location.x=4.07
    for target in [wall]+[o for o in bpy.context.scene.objects if o.name.startswith('Continuous_')]:
        # Boolean cut faces must inherit each target's finish, not cutter plaster.
        cutter.data.materials.clear()
        cutter.data.materials.append(target.data.materials[0])
        bpy.context.view_layer.objects.active=target
        mod=target.modifiers.new('Aligned_Opening','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    before=set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT.parent/'information-windows-v1'/'Office-arched-window.glb'))
    added=list(set(bpy.context.scene.objects)-before)
    for obj in added:
        if obj.parent is None:
            obj.matrix_world=(Matrix.Translation(spec['center'])@Matrix.Rotation(spec['rotation'],4,'Z')
                              @Matrix.Diagonal((*spec['scale'],1))@obj.matrix_world)
            obj.name=spec['name']+'_Window'
    if spec['front']:front_objects+=added
# Central entrance on the front wall, aligned with the current exit.
cutter=box('Door_Cutter',(1.05,.70,2.0),(0,-3.07,.98),cream,0)
bpy.context.view_layer.objects.active=frontwall
mod=frontwall.modifiers.new('Central_Entrance','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
scene=bpy.context.scene;cam=scene.camera;cam.data.type='PERSP';cam.data.lens=38
cam.location=(0,-12,9);cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1100
for obj in front_objects:obj.hide_render=True
scene.render.filepath=str(ROOT/'interior-preview.png');bpy.ops.render.render(write_still=True)
cam.data.type='ORTHO';cam.data.ortho_scale=2.5
cam.location=(2.0,-1.7,2.7)
cam.rotation_euler=(Vector((4,0,1.2))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1100;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'sill-detail.png');bpy.ops.render.render(write_still=True)
for obj in front_objects:obj.hide_render=False
cam.data.type='ORTHO';cam.data.ortho_scale=9.4;cam.location=(0,-12,3.2)
cam.rotation_euler=(Vector((0,-3,1.2))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_y=700
scene.render.filepath=str(ROOT/'front-window-check.png');bpy.ops.render.render(write_still=True)
for obj in front_objects:obj.hide_render=True
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-exterior-aligned-windows.blend'))
(ROOT/'alignment.json').write_text(json.dumps({'reference':'information-exterior-clean-v1/build_information.py',
    'mapping':'normalized wall positions; interior expansion uses separate X/Y/Z ratios',
    'front_window_centers_x':[-frontx,frontx],'right_side_center_y':0,'window_bottom':bottom,
    'left_wall_windows':0,'rear_wall_windows':0,'front_cutaway_hidden_for_interior':True,
    'game_changed':False},indent=2),encoding='utf-8')
