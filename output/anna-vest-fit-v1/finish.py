import bpy
from pathlib import Path
from mathutils import Vector
p=Path('C:/GitHub/StockWars/output/anna-vest-fit-v1')
bpy.ops.wm.open_mainfile(filepath=str(p/'Anna-vest-fit.blend'))
o=bpy.data.objects['Anna_Vest'];bpy.context.view_layer.objects.active=o
if o.data.has_custom_normals:o.data.normals_split_custom_set([(0,0,0)]*len(o.data.loops))
for f in o.data.polygons:f.use_smooth=True
mod=o.modifiers.new('Gentle surface smoothing','SMOOTH');mod.factor=.6;mod.iterations=12
bpy.ops.object.modifier_apply(modifier=mod.name)
s=bpy.context.scene
for name,pos in [('front',(0,-4,.25)),('side',(4,0,.25)),('back',(0,4,.25))]:
 cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(p/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(p/'Anna-vest-fit.blend'))
bpy.ops.object.select_all(action='DESELECT')
for ob in bpy.data.objects:
 if ob.type=='MESH':ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(p/'Anna-vest-fit.glb'),export_format='GLB',use_selection=True)
