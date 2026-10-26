"""Rebuild the roof from traced reference outlines; discard v16 squash."""
import bpy,sys,math,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT));sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
sys.path.insert(0,str(ROOT.parent/'cipher-grand-single-v4'))
from roof_geometry import build_roof
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-reference-match-v14'/'CipherSecurities-reference-match.blend'))
scene=bpy.context.scene;cam=scene.camera
fit=json.loads((ROOT/'roof-fit.json').read_text());p=fit['parameters'];yaw,pitch=p[:2]
right=Vector((math.cos(yaw),math.sin(yaw),0))
up=Vector((-math.sin(pitch)*math.sin(yaw),math.sin(pitch)*math.cos(yaw),math.cos(pitch)))
look=Vector((math.cos(pitch)*math.sin(yaw),-math.cos(pitch)*math.cos(yaw),math.sin(pitch)))
target=right*p[4]+up*p[5]
cam.location=target+look*p[2];cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='PERSP';cam.data.sensor_fit='HORIZONTAL';cam.data.sensor_width=36;cam.data.lens=p[3]*36/775
scene.render.resolution_x=775;scene.render.resolution_y=287;scene.render.resolution_percentage=100
scene.cycles.samples=32
# Match the reference's brighter clay lighting and saturated blue.
blue=bpy.data.materials['Roof_Blue']
blue.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.025,.12,.25,1)
blue.diffuse_color=(.025,.12,.25,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value*=1.5
for obj in scene.objects:
    if obj.type=='LIGHT':obj.data.energy*=1.5
for name in ('Trim_Cream','Wall_Ivory'):
    mat=bpy.data.materials[name];node=mat.node_tree.nodes['Principled BSDF']
    old=node.inputs['Base Color'].default_value
    node.inputs['Base Color'].default_value=(old[0]*.95,old[1]*.90,old[2]*.85,1)
scene.render.filepath=str(ROOT/'before.png');bpy.ops.render.render(write_still=True)
retired=('Central_Constant_Section','Central_Junction_Cut','Central_Ridge_Cap','Central_Trimmed',
    'Central_Pediment','Continuous_Cream_Pediment_Frame','Roof_Exact_Intersection_Seam',
    'Wing_Long_Hip_Roof','Wing_Reference_Tile','Wing_Horizontal_Ridge_Cap','Wing_Outer_Hip_Cap',
    'Wing_Closed_Threeway_Junction','Wing_Blue_Eave','Wing_Cornice_Upper')
for obj in list(scene.objects):
    if obj.name.startswith(retired):bpy.data.objects.remove(obj,do_unlink=True)
stats=build_roof(fit['roof'])
scene.frame_set(1);bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type in ('MESH','CURVE','EMPTY') and not obj.name.startswith(('Preview_','Studio_')):obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
scene.render.filepath=str(ROOT/'after.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-traced-roof.blend'))
cam.data.type='ORTHO';cam.data.ortho_scale=7.6;cam.location=(5,9,4.6)
cam.rotation_euler=(Vector((0,0,1.4))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1200;scene.render.resolution_y=800
scene.render.filepath=str(ROOT/'rear.png');bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=2.7;cam.location=(4,-6,4)
cam.rotation_euler=(Vector((1.2,0,2.4))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'junction.png');bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest(),
    'source':'v14; v16 compression discarded','roof':fit['roof'],'landmarkRmsPixels':fit['rmsPixels'],
    'tileChecks':stats,'gameApplied':False},indent=2))
