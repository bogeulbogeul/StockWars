"""Read-only overhead render of the current bookstore model."""
import bpy
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(R/'Bookstore-clean.blend'))
s=bpy.context.scene;c=s.camera
pts=[o.matrix_world@Vector(v) for o in s.objects if o.type=='MESH' and not o.name.startswith(('Preview_','Studio_')) for v in o.bound_box]
lo=Vector(tuple(min(p[i] for p in pts) for i in range(3)));hi=Vector(tuple(max(p[i] for p in pts) for i in range(3)))
at=(lo+hi)/2;c.data.type='ORTHO';c.data.ortho_scale=max(hi.x-lo.x,hi.y-lo.y)*1.15
c.location=(at.x,at.y,hi.z+15);c.rotation_euler=(at-c.location).to_track_quat('-Z','Y').to_euler()
s.cycles.samples=28;s.render.resolution_x=1400;s.render.resolution_y=1400;s.render.resolution_percentage=100
s.render.filepath=str(R/'top-view.png');bpy.ops.render.render(write_still=True)
