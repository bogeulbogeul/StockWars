"""Correct the left window and sill on their native surface, preserve the planter."""
import bpy,pathlib,numpy as np,json
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'ClothingStore.blend'))
for o in list(bpy.context.scene.objects):
    if o.type=='MESH': bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'ClothingStore-retouched.glb'))
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH'); mesh=obj.data
def material(name,color,roughness):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=roughness
    return m
glass=material('LeftWindowCleanGlass',(.1046,.1413,.1779),.38)
wood=material('LeftWindowSillCleanWood',(.38,.21,.085),.82)
mesh.materials.append(glass); gi=len(mesh.materials)-1
mesh.materials.append(wood); wi=len(mesh.materials)-1
original=mesh.materials[0]; shader=next(n for n in original.node_tree.nodes if n.type=='BSDF_PRINCIPLED'); image=shader.inputs['Base Color'].links[0].from_node.image
# Change only green pigment inside the sill material; retain surrounding wood grain.
nodes=wood.node_tree.nodes; links=wood.node_tree.links; wp=nodes.get('Principled BSDF')
tex=nodes.new('ShaderNodeTexImage');tex.image=image
channels=nodes.new('ShaderNodeSeparateColor');links.new(tex.outputs['Color'],channels.inputs['Color'])
checks=[]
for channel in ['Red','Blue']:
    check=nodes.new('ShaderNodeMath');check.operation='GREATER_THAN'
    links.new(channels.outputs['Green'],check.inputs[0]);links.new(channels.outputs[channel],check.inputs[1]);checks.append(check)
both=nodes.new('ShaderNodeMath');both.operation='MULTIPLY';links.new(checks[0].outputs[0],both.inputs[0]);links.new(checks[1].outputs[0],both.inputs[1])
mix=nodes.new('ShaderNodeMixRGB');links.new(both.outputs[0],mix.inputs[0]);links.new(tex.outputs['Color'],mix.inputs[1]);mix.inputs[2].default_value=(.38,.21,.085,1);links.new(mix.outputs[0],wp.inputs['Base Color'])
w,h=image.size; pixels=np.array(image.pixels[:]).reshape(h,w,4); uv=mesh.uv_layers.active.data
pane_count=sill_count=0
for p in mesh.polygons:
    v=obj.matrix_world@p.center; x,y,z=v
    if not(-.70<x<-.36 and -.49<z<-.06): continue
    if -.5505<y<-.539 and -.441<z<-.06:
        p.material_index=gi; pane_count+=1
    elif -.605<y<-.5505 and -.4605<z<-.442:
        p.material_index=wi; sill_count+=1
bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True);bpy.context.view_layer.objects.active=obj
# Bake native per-surface correction so GLB does not depend on Blender-only nodes.
baked=bpy.data.images.new('ClothingStore repaired window',width=2048,height=2048,alpha=False)
restore=[]
for mat in mesh.materials:
    ns=mat.node_tree.nodes; ls=mat.node_tree.links
    p=next(n for n in ns if n.type=='BSDF_PRINCIPLED'); out=next(n for n in ns if n.type=='OUTPUT_MATERIAL')
    emission=ns.new('ShaderNodeEmission')
    if p.inputs['Base Color'].links: ls.new(p.inputs['Base Color'].links[0].from_socket,emission.inputs[0])
    else: emission.inputs[0].default_value=p.inputs['Base Color'].default_value
    ls.new(emission.outputs[0],out.inputs['Surface'])
    target=ns.new('ShaderNodeTexImage');target.image=baked
    for n in ns:n.select=False
    ns.active=target;target.select=True;restore.append((mat,p,out,emission,target))
bpy.context.scene.render.engine='CYCLES';bpy.context.scene.cycles.samples=1;bpy.context.scene.render.bake.margin=8
bpy.ops.object.bake(type='EMIT')
baked.filepath_raw=str(ROOT/'ClothingStore-window-fixed-basecolor.png');baked.file_format='PNG';baked.save()
for mat,p,out,emission,target in restore:
    mat.node_tree.links.new(p.outputs[0],out.inputs['Surface']);mat.node_tree.links.new(target.outputs['Color'],p.inputs['Base Color']);mat.node_tree.nodes.remove(emission)
bpy.context.scene.render.engine='BLENDER_EEVEE'
bpy.ops.export_scene.gltf(filepath=str(ROOT/'ClothingStore-window-fixed.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene; scene.render.filepath=str(ROOT/'ClothingStore-window-fixed.png'); bpy.ops.render.render(write_still=True)
target=Vector((-.52,-.7,-.22)); scene.camera.location=target+Vector((.12,-2,.4)); scene.camera.rotation_euler=(target-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.camera.data.ortho_scale=.85
scene.render.resolution_x=1200;scene.render.resolution_y=1200;scene.render.filepath=str(ROOT/'ClothingStore-window-after.png');bpy.ops.render.render(write_still=True)
(ROOT/'window-fix.json').write_text(json.dumps({'glass_faces':pane_count,'sill_faces':sill_count,'method':'native surface material correction by position and depth; planter excluded'},indent=2))
