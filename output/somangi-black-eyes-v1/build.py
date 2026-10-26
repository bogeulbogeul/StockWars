import bpy,sys,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
sys.path.insert(0,str(P.parent/'somangi-bench-down-v1'))
from rig_utils import surface_hash,reset
from preserve_walk import preserve_walk
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-bench-down-v1/somangi-bench-down.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_OriginalRig']
before=surface_hash(body)
material=body.data.materials[0]
tex=next(n.image for n in material.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and 'base' in n.image.name.lower()) if any(n.type=='TEX_IMAGE' and n.image and 'base' in n.image.name.lower() for n in material.node_tree.nodes) else next(n.image for n in material.node_tree.nodes if n.type=='TEX_IMAGE' and n.image)
shader=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
base=shader.inputs['Base Color']
if base.is_linked:tex=base.links[0].from_node.image
pixels=list(tex.pixels);w,h=tex.size
def dark(uv):
    x=min(w-1,max(0,int(uv.x*w)));y=min(h-1,max(0,int(uv.y*h)))
    return max(pixels[(y*w+x)*4:(y*w+x)*4+3])<.10
black=material.copy();black.name='Face_ink_nonmetal'
bs=next(n for n in black.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
for name,value in [('Metallic',0),('Roughness',1),('Specular IOR Level',0)]:
    socket=bs.inputs[name]
    for link in list(socket.links):black.node_tree.links.remove(link)
    socket.default_value=value
body.data.materials.append(black)
uv=body.data.uv_layers.active.data
count=0
for face in body.data.polygons:
    uvs=[uv[i].uv for i in face.loop_indices]
    center=sum(uvs,Vector((0,0)))/len(uvs)
    if dark(center) or any(dark(v) for v in uvs):
        face.material_index=len(body.data.materials)-1;count+=1
assert count>0 and surface_hash(body)==before
rig.animation_data_clear();reset(rig);bpy.context.view_layer.update()
rig.animation_data_create();rig.animation_data.action=bpy.data.actions['Walk_InPlace']
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);rig.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-black-eyes.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-black-eyes.glb'),export_format='GLB',use_selection=True,export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
preserve_walk(P/'somangi-black-eyes.glb',P.parent/'somangi-joint-polish-v1/somangi-walk.glb')
(P/'validation.json').write_text(json.dumps({'meshAndUvUnchanged':True,'hash':before,'inkFaces':count,'totalFaces':len(body.data.polygons),'textureUnchanged':True,'bodyMaterialUnchanged':True,'gameInstalled':False},indent=2))
print('INK_FIX',count,len(body.data.polygons))
