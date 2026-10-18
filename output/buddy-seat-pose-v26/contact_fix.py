import bpy,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'buddy-seat-pose-review.blend'))
s=bpy.context.scene;obj=bpy.data.objects['Seated_Pose_Review']
seat=bpy.data.objects['Preview_Seat'];top=seat.location.z+seat.dimensions.z/2
# Lower torso onto the seat, and lift the underside of the thighs clear of its slab.
for v in obj.data.vertices:
    v.co.z-=.105
    x,y,z=v.co
    if abs(x)<.425 and -.20<=y<=.40 and z<top+.004:
        v.co.z=top+.004
# Front rim transition: smoothly lift the forward thigh without flattening the foot.
for v in obj.data.vertices:
    x,y,z=v.co
    if -.29<y<-.20 and z<top+.004:
        t=(y+.29)/.09;t=t*t*(3-2*t)
        v.co.z+=max(0,top+.004-z)*t
for f in obj.data.polygons:f.use_smooth=True
penetrating=sum(1 for v in obj.data.vertices if abs(v.co.x)<.425 and -.20<=v.co.y<=.40 and v.co.z<top-.001)
assert penetrating==0
for name,pos in [('side',(7,-.2,.05)),('front',(0,-7,.05)),('angle',(3,-7,1.25))]:
    cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,-.1))-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'-clearance.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-seat-pose-clearance.blend'))
(P/'seat-clearance-validation.json').write_text(json.dumps({'seat_top':top,'vertices_below_seat_within_footprint':penetrating,'stage':'static pose'},indent=2))
