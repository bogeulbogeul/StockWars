"""Fit one-piece cross muntin into the glazing rebate."""
import bpy,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import extrude
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-entry-contact-v7'/'VivianStore-entry-contact.blend'))
for o in list(bpy.context.scene.objects):
    if o.name.startswith('Door_Glass_Mullion_'):bpy.data.objects.remove(o,do_unlink=True)
wood=bpy.data.materials['Vivian_Honey_Wood']
# Inner aperture: bottom .572, apex .916; ends overlap rebate by .004.
w=.009;z=.72;t=.009;r=.180
p=[(-w,.568),(w,.568),(w,z-t),(r,z-t),(r,z+t),(w,z+t),(w,.920),
   (-w,.920),(-w,z+t),(-r,z+t),(-r,z-t),(-w,z-t)]
extrude('Door_Glass_Unified_Fitted_Cross',p,-.986,-.974,wood,.002)
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and not o.get('preview_only',False) and not o.name.startswith('Preview_'):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'VivianStore-clean.glb'),export_format='GLB',use_selection=True)
s=bpy.context.scene;c=s.camera;s.cycles.samples=24
c.location=(.5,-4,1.4);c.data.ortho_scale=.80
c.rotation_euler=(Vector((0,-.98,.74))-c.location).to_track_quat('-Z','Y').to_euler()
s.render.filepath=str(ROOT/'glass-detail.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'VivianStore-fitted-cross.blend'))
