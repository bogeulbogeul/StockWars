"""Reuse the exterior bank medallion geometry as an all-gold interior wall sign."""
import bpy,sys,json
from pathlib import Path
from mathutils import Matrix,Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'bank-executive-chair-back-v4'/'Bank-executive-room-preview.blend'))
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT.parent/'bank-exterior-clean-v1'/'Bank-clean.glb'))
added=set(bpy.context.scene.objects)-before
sign=next(o for o in added if o.type=='MESH' and o.name.startswith('Coin_Gold_Rim'))
world=sign.matrix_world.copy();sign.parent=None;sign.matrix_world=world
for o in added-{sign}:bpy.data.objects.remove(o,do_unlink=True)
gold=material('Bank_Interior_Sign_Gold',(.79,.51,.12),.42)
shader=gold.node_tree.nodes.get('Principled BSDF');shader.inputs['Metallic'].default_value=.35
sign.data.materials.clear();sign.data.materials.append(gold)
for p in sign.data.polygons:p.material_index=0
# Preserve every engraved face, scaling the exact exterior object uniformly.
sign.matrix_world=Matrix.Translation((0,3.005,2.10)) @ Matrix.Scale(2.65,4) @ Matrix.Translation((0,1.159,-1.64)) @ sign.matrix_world
sign.name='Bank_Exterior_Reused_Gold_Sign'
bpy.ops.object.select_all(action='DESELECT');sign.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-gold-wall-sign.glb'),export_format='GLB',use_selection=True)
for o in bpy.context.scene.objects:o.select_set(o.type in {'MESH','CURVE'})
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-gold-sign-room-preview.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.filepath=str(ROOT/'room.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-gold-sign-room-preview.blend'))
cam=scene.camera;target=Vector((0,2.90,2.10));cam.location=target+Vector((1,-4,1))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=1.25
scene.render.resolution_x=1100;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'sign-close.png');bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({'source':'output/bank-exterior-clean-v1/Bank-clean.glb / Coin_Gold_Rim','geometry':'exact reused engraved medallion, uniform scale 2.65','material':'single gold including engraving floor','status':'interior model/placement; gameplay integration pending'},indent=2),encoding='utf-8')
