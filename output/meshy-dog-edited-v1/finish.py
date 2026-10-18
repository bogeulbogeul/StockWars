import bpy
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(OUT/'dog-edited.blend'))
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=obj
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
earmat=bpy.data.materials['Ear repair orange']
obj.data.materials.append(earmat)
index=len(obj.data.materials)-1
for p in obj.data.polygons:
    x,y,z=p.center
    if .48<z<.86 and y>-.025 and .20<abs(x)<.53:
        p.material_index=index
group=obj.vertex_groups.new(name='Chin smoothing')
for v in obj.data.vertices:
    x,y,z=v.co
    if -.015<z<.37 and y<-.06 and abs(x)<.45:
        w=min(1,max(0,(z+.015)/.07),max(0,(.37-z)/.06),max(0,(.45-abs(x))/.08))
        group.add([v.index],w,'REPLACE')
mod=obj.modifiers.new('Smooth chin','SMOOTH')
mod.vertex_group=group.name
mod.factor=.85
mod.iterations=60
bpy.ops.object.modifier_apply(modifier=mod.name)
scene=bpy.context.scene
cam=scene.camera
def render(label,loc):
    cam.location=loc
    cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/(label+'.png'))
    bpy.ops.render.render(write_still=True)
render('front',(0,-4,0))
render('side',(4,0,0))
render('back',(0,4,0))
render('chin',(0,-3,-1.5))
tex=bpy.data.materials['Face - texture expressions'].node_tree.nodes['EXPRESSION_IMAGE']
tex.image=bpy.data.images['Expression happy']
render('happy',(0,-4,0))
tex.image=bpy.data.images['Expression neutral']
cam.location=(0,-4,0)
cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'dog-edited.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'dog-edited.glb'),export_format='GLB',export_cameras=False,export_lights=False)
