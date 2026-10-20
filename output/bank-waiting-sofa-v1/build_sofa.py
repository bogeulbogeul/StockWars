"""Cream and warm timber waiting sofa, no decorative throw pillows."""
import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'bank-desk-decor-v1'/'Bank-decor-room-preview.blend'))
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT.parent/'information-waiting-sofa-v1'/'Waiting-sage-sofa.glb'))
added=set(bpy.context.scene.objects)-before
for obj in list(added):
 if 'Pillow' in obj.name:
  added.remove(obj);bpy.data.objects.remove(obj,do_unlink=True)
cream=material('Bank_Waiting_Cream_Fabric',(.88,.82,.64),.94)
wood=material('Bank_Waiting_Honey_Wood',(.42,.22,.08))
for obj in added:
 if obj.type=='MESH':
  obj.data.materials.clear();obj.data.materials.append(cream if 'Cushion' in obj.name else wood)
bpy.ops.object.select_all(action='DESELECT')
for obj in added:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-waiting-sofa.glb'),export_format='GLB',use_selection=True)
roots=[o for o in added if o.parent not in added]
for obj in roots:
 obj.location=(-3.20,-.60,.024);obj.rotation_euler.z=math.pi/2
for obj in bpy.context.scene.objects:obj.select_set(obj.type in {'MESH','CURVE'} or obj in added)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-waiting-room-preview.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.filepath=str(ROOT/'room.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-waiting-room-preview.blend'))
# Return to local display for standalone preview, without altering saved placement.
for obj in roots:obj.location=(0,0,0);obj.rotation_euler.z=0
for obj in before:
 if obj.type in {'MESH','CURVE'}:obj.hide_render=True
cam=scene.camera;target=Vector((0,0,.56));cam.location=target+Vector((3,-5,2.7))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.65
scene.render.resolution_x=1300;scene.render.resolution_y=1000
scene.render.filepath=str(ROOT/'sofa-close.png');bpy.ops.render.render(write_still=True)
assert not any('Pillow' in obj.name for obj in added)
(ROOT/'manifest.json').write_text(json.dumps({'status':'waiting sofa and bank placement preview; game integration pending','source':'information-waiting-sofa-v1 wooden frame','upholstery':'cream seat and back cushions retained; decorative throw pillows excluded','placement':[-3.20,-.60,.024],'rotation_degrees':90,'validation':'render and no-throw-pillow check; sitting/collision pending'},indent=2),encoding='utf-8')

