import bpy
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-eat-joints-v37/buddy-eat-joints.blend'))
s=bpy.context.scene;source=bpy.data.objects['Buddy_Original'];rig=bpy.data.objects['Buddy_Rig']
dep=bpy.context.evaluated_depsgraph_get()
data=bpy.data.meshes.new_from_object(source.evaluated_get(dep),depsgraph=dep)
obj=bpy.data.objects.new('Eating_Surface_Review',data);bpy.context.collection.objects.link(obj)
pb=rig.pose.bones['Arm.L'];m=pb.matrix@pb.bone.matrix_local.inverted()
root=m@Vector((.36,0,-.13));inner=Vector((.29,0,-.12))
center=(root+inner)/2+Vector((-.055,-.035,-.045))
# Add a rounded volume through the stretched shoulder membrane.
bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=center)
patch=bpy.context.object;patch.name='Shoulder_Volume';patch.scale=(.12,.17,.09)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);patch.select_set(True)
bpy.context.view_layer.objects.active=obj;bpy.ops.object.join()
mod=obj.modifiers.new('Rebuild continuous shoulder surface','REMESH');mod.mode='VOXEL';mod.voxel_size=.009
bpy.ops.object.modifier_apply(modifier=mod.name)
sm=obj.modifiers.new('Light surface polish','SMOOTH');sm.factor=.55;sm.iterations=12
bpy.ops.object.modifier_apply(modifier=sm.name)
for f in obj.data.polygons:f.use_smooth=True
source.hide_render=True;source.hide_set(True);rig.hide_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-eat-surface-review.blend'))
for name,pos in [('side',(7,0,-.02)),('angle',(3,-7,1.15)),('front',(0,-7,-.02))]:
    cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,-.02))-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
