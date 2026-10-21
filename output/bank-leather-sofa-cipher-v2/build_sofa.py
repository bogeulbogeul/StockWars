"""Reuse the actual brokerage sofa geometry with the bank cognac palette."""
import bpy,sys,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'bank-service-desk-v1'/'Bank-desk-room-preview.blend'))
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT.parents[1]/'web/assets/office/3d/Cipher-single-sofa.glb'))
asset=list(set(bpy.context.scene.objects)-before)
leather=material('Bank_Cognac_Leather',(.21,.062,.021),.48)
wood=material('Bank_Dark_Wood_Legs',(.085,.031,.012))
for obj in asset:
 if obj.type=='MESH':
  obj.data.materials.clear();obj.data.materials.append(wood if 'Leg' in obj.name else leather)
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-leather-sofa.glb'),export_format='GLB',use_selection=True,export_extras=True)
for obj in asset:
 if obj.parent not in asset:obj.location.y+=1.30;obj.location.z+=.024
for obj in bpy.context.scene.objects:obj.select_set(obj.type in {'MESH','CURVE'} or obj in asset)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-sofa-room-preview.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.filepath=str(ROOT/'room.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-sofa-room-preview.blend'))
for obj in before:
 if obj.type in {'MESH','CURVE'}:obj.hide_render=True
cam=scene.camera;target=Vector((0,1.30,.53));cam.location=target+Vector((2,-3,1.8))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=1.95
scene.render.resolution_x=1100;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'sofa-close.png');bpy.ops.render.render(write_still=True)
assert any('Rounded_Arm' in o.name for o in asset)
(ROOT/'manifest.json').write_text(json.dumps({'status':'model and room preview; game integration pending','geometry_source':'web/assets/office/3d/Cipher-single-sofa.glb','geometry':'actual source geometry unchanged, including rounded upholstered arms','leather_rgb_linear':[.21,.062,.021],'placement':[0,1.30,.024],'validation':'source geometry reused; sitting/contact review pending'},indent=2),encoding='utf-8')
