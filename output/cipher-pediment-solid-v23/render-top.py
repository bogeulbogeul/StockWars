"""Read-only top-view rendering of the current brokerage production model."""
import bpy,json
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(R/'CipherSecurities-solid-pediment.blend'))
s=bpy.context.scene;c=s.camera
points=[o.matrix_world@Vector(v) for o in s.objects if o.type=='MESH' and not o.name.startswith(('Preview_','Studio_')) for v in o.bound_box]
low=Vector(tuple(min(p[i] for p in points) for i in range(3)));high=Vector(tuple(max(p[i] for p in points) for i in range(3)))
at=(low+high)/2;c.data.type='ORTHO';c.data.ortho_scale=max(high.x-low.x,high.y-low.y)*1.15
c.location=(at.x,at.y,high.z+15);c.rotation_euler=(at-c.location).to_track_quat('-Z','Y').to_euler()
s.cycles.samples=32;s.render.resolution_x=1400;s.render.resolution_y=1400;s.render.resolution_percentage=100
s.render.filepath=str(R/'top-view.png');bpy.ops.render.render(write_still=True)
# The asset and saved blend are intentionally not overwritten.
