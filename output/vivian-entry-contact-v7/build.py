"""Seat beveled door bottoms into the existing landing, without a threshold."""
import bpy,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-flush-entry-v6'/'VivianStore-flush-entry.blend'))
for name in ('Central_Arched_Wood_Door','Door_Continuous_Arch_Frame'):
    o=bpy.data.objects[name];m=o.matrix_world;inv=m.inverted()
    for v in o.data.vertices:
        p=m@v.co
        if p.z<.19:
            p.z-=.020*min(1,max(0,(.19-p.z)/.04));v.co=inv@p
    o.data.update()
assert 'Door_Flush_Threshold' not in bpy.data.objects
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and not o.get('preview_only',False) and not o.name.startswith('Preview_'):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'VivianStore-clean.glb'),export_format='GLB',use_selection=True)
s=bpy.context.scene;c=s.camera;s.cycles.samples=24
for name,loc,target,scale in [('door-detail',(.8,-4,1.6),(0,-.98,.57),1.6),('bottom-detail',(.7,-4,1),(0,-.98,.20),.9)]:
    c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'VivianStore-entry-contact.blend'))
