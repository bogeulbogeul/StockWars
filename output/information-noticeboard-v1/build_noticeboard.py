"""Wood-framed cork board with four pinned paper notices."""
import bpy
import math
import json
import sys
from pathlib import Path
from mathutils import Vector,Matrix

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,finish

bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('Noticeboard_Honey_Wood',(.56,.35,.16))
cork=material('Noticeboard_Warm_Cork',(.42,.28,.13),.97)
paper=material('Noticeboard_Cream_Paper',(.93,.88,.74))
sage=material('Noticeboard_Sage_Pin',(.32,.43,.23))
red=material('Noticeboard_Coral_Pin',(.63,.25,.15))
ink=material('Noticeboard_Form_Lines',(.49,.46,.34))
box('Board_Wood_Backing',(1.04,.075,1.30),(0,0,0),wood,.045)
box('Inset_Cork_Panel',(.91,.024,1.17),(0,-.044,0),cork,.024)
# Separate frame members overlap the backing, not each other's front faces.
for x in [-.49,.49]:box('Rounded_Side_Frame',(.085,.10,1.26),(x,-.035,0),wood,.025)
for z in [-.61,.61]:box('Rounded_Top_Bottom_Frame',(.94,.10,.085),(0,-.035,z),wood,.025)
for i,(x,z,angle) in enumerate([(-.225,.28,-.04),(.22,.31,.05),(-.20,-.26,.04),(.225,-.24,-.035)]):
    root=bpy.data.objects.new('Pinned_Notice_'+str(i+1),None)
    bpy.context.collection.objects.link(root)
    before=set(bpy.context.scene.objects)
    box('Notice_Paper',(.245,.012,.365),(0,-.065,0),paper,.005)
    for line in range(4):
        width=.145 if line<3 else .10
        box('Notice_Illustrative_Line',(width,.0015,.004),(-.012,-.072,.065-line*.045),ink,.001)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,radius=1,location=(0,-.085,.15))
    obj=bpy.context.object;obj.name='Round_Colored_Pin'
    obj.scale=(.022,.013,.022)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(red if i==1 else sage)
    for polygon in obj.data.polygons:polygon.use_smooth=True
    for obj in set(bpy.context.scene.objects)-before:obj.parent=root
    root.location=(x,0,z);root.rotation_euler.y=angle
parent=bpy.data.objects.new('Information_Wall_Noticeboard',None)
bpy.context.collection.objects.link(parent)
for obj in list(bpy.context.scene.objects):
    if obj!=parent and obj.parent is None:obj.parent=parent
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Information-noticeboard.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=1100
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.72,.76,.80,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
box('Preview_Wall',(200,.03,200),(0,.06,0),material('Preview_Cream',(.84,.77,.64)),0)
for loc,power,size in [((-3,-4,6),350,5),((4,-2,3),150,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(.5,-4,.4))
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.65
cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
scene.render.filepath=str(ROOT/'noticeboard.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Information-noticeboard.blend'))

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-window-alignment-v2'/'Office-exterior-aligned-windows.blend'))
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'Information-noticeboard.glb'))
for obj in set(bpy.context.scene.objects)-before:
    if obj.parent is None:
        obj.matrix_world=(Matrix.Translation((-3.96,.70,1.60))@Matrix.Rotation(math.pi/2,4,'Z')@obj.matrix_world)
scene=bpy.context.scene;cam=scene.camera
cam.data.type='PERSP';cam.data.lens=38;cam.location=(0,-12,9)
cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'room-preview.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-noticeboard-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'Noticeboard produced; game not changed',
    'position':[-3.96,.70,1.60],'dimensions':[1.04,.11,1.30],
    'features':['wood frame','cork insert','four independent pinned notices','colored pins'],
    'paper_content':'illustrative lines only; no actual quest text',
    'pending':['user art review','game display and interactions']},indent=2),encoding='utf-8')
