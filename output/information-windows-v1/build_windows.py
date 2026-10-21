"""True arched openings and separate wooden side windows for the office."""
import bpy
import math
import json
import sys
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,extrude,arch_outline,arch_ring

bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('Office_Window_Honey_Wood',(.56,.35,.16))
glass=material('Office_Window_Soft_Blue_Glass',(.32,.52,.61),.45)
# A small constant emission makes the pane readable without adding a fixture.
shader=glass.node_tree.nodes.get('Principled BSDF')
shader.inputs['Emission Color'].default_value=(.12,.23,.28,1)
shader.inputs['Emission Strength'].default_value=.18
outline=arch_outline(.43,.68)
extrude('Arched_Blue_Pane',outline,-.018,.018,glass,.004)
arch_ring('Rounded_Wood_Window_Frame',0,0,.43,.68,.065,-.075,.075,wood)
box('Wood_Window_Bottom_Rail',(.86,.14,.065),(0,0,.02),wood,.012)
box('Wood_Window_Sill',(1.12,.28,.075),(0,-.04,-.025),wood,.018)
box('Vertical_Wood_Mullion',(.035,.05,1.11),(0,-.047,.555),wood,.008)
box('Horizontal_Wood_Mullion',(.86,.05,.035),(0,-.05,.58),wood,.008)
asset=list(bpy.context.scene.objects)
root=bpy.data.objects.new('Office_Arched_Window',None);bpy.context.collection.objects.link(root)
for obj in asset:obj.parent=root
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Office-arched-window.glb'),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-arched-window.blend'))

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-sprout-mark-v1'/'Office-wall-mark-preview.blend'))
walls=[o for o in bpy.context.scene.objects if o.name.startswith('Side_Wall') and o.type=='MESH']
assert len(walls)==2,len(walls)
for wall in walls:
    sign=1 if wall.location.x>0 else -1
    # Window centered toward the entrance, clear of cabinet and top cornice.
    before=set(bpy.context.scene.objects)
    cutter=extrude('Temporary_Arched_Opening',[(x,z+.92) for x,z in outline],-.45,.45,wall.data.materials[0],0)
    cutter.rotation_euler.z=sign*math.pi/2
    cutter.location=(sign*4.07,-1.15,0)
    bpy.context.view_layer.objects.active=wall
    mod=wall.modifiers.new('True_Arched_Window_Opening','BOOLEAN')
    mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    before=set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/'Office-arched-window.glb'))
    for obj in set(bpy.context.scene.objects)-before:
        if obj.parent is None:
            obj.matrix_world=(Matrix.Translation((sign*4.015,-1.15,.92))
                              @ Matrix.Rotation(-sign*math.pi/2,4,'Z') @ obj.matrix_world)
    # The opening must remove the wall rather than hiding it under the pane.
    bpy.context.view_layer.update()
    hit,point,normal,index,obj,matrix=bpy.context.scene.ray_cast(
        bpy.context.evaluated_depsgraph_get(),Vector((sign*3.5,-.97,1.30)),Vector((sign,0,0)),distance=1)
    assert hit and 'Pane' in obj.name,(obj.name if obj else None)

scene=bpy.context.scene;cam=scene.camera
cam.data.type='PERSP';cam.data.lens=38;cam.location=(0,-12,9)
cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'room-preview.png');bpy.ops.render.render(write_still=True)
cam.data.type='ORTHO';cam.data.ortho_scale=1.9
cam.location=(2.4,-2.7,2.5)
cam.rotation_euler=(Vector((4,-1.15,1.45))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1000;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'window-detail.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-side-windows-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'Two side windows with actual wall openings; game not changed',
    'positions':[[4.015,-1.15,.92],[-4.015,-1.15,.92]],
    'rear_wall':'unchanged, no windows','opening_rays':'PASS: blue panes hit instead of wall',
    'features':['rounded wood arch frame','cross mullions','wood sill','opaque stylized blue pane'],
    'pending':['user art review','game integration','dynamic daylight']},indent=2),encoding='utf-8')
