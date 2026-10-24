"""Shrink lower panel only. Knob position and all other geometry stay fixed."""
import bpy
from pathlib import Path
from mathutils import Matrix,Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'home-door-polish-v2'/'Home-door-polish.blend'))
center=Vector((.43,0,.395))
transform=Matrix.Translation(center) @ Matrix.Diagonal((.75,1,.75,1)) @ Matrix.Translation(-center)
for name in ('Home_Door_Continuous_Panel_Moulding','Home_Door_Clean_Panel_Inset'):
    o=bpy.data.objects[name];o.matrix_world=transform @ o.matrix_world
# Restore the uncut lower door surface before cutting the smaller panel.
door=bpy.data.objects['Home_Arched_Wood_Door'];wood=door.data.materials[0]
with bpy.data.libraries.load(str(ROOT.parent/'home-inset-door-window-v8'/'Home-inset-window.blend'),link=False) as (src,dst):
    dst.objects=['Home_Arched_Wood_Door']
template=dst.objects[0];door.data=template.data.copy();bpy.data.objects.remove(template,do_unlink=True)
for v in door.data.vertices:
    p=door.matrix_world@v.co
    if p.z<.16:
        p.z-=.010*min(1,max(0,(.16-p.z)/.04));v.co=door.matrix_world.inverted()@p
import sys
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box
cut=box('Small_Panel_Cutter',(.275,.055,.245),(.43,-.855,.395),wood,.008)
for obj in (door,):
    bpy.context.view_layer.objects.active=obj
    mod=obj.modifiers.new('Smaller_Recess','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cut
    bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.objects.remove(cut,do_unlink=True)
s=bpy.context.scene;mailroot=bpy.data.objects['Home_Right_Mailbox'];mail=set(mailroot.children_recursive)|{mailroot}
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.get('preview_only',False) and not o.name.startswith('Preview_')]
for filename,objects in [('Home-with-right-mailbox.glb',asset),('Home-redesign.glb',[o for o in asset if o not in mail])]:
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/filename),export_format='GLB',use_selection=True)
c=s.camera;c.location=(1,-4,1.7);c.data.ortho_scale=1.5;c.rotation_euler=(Vector((.43,-.85,.60))-c.location).to_track_quat('-Z','Y').to_euler()
s.render.filepath=str(ROOT/'door-detail.png');s.cycles.samples=24;bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Home-smaller-panel.blend'))
