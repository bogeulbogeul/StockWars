import bpy,json,sys
from pathlib import Path
from mathutils import Vector
P=Path('C:/GitHub/StockWars/output/somangi-eat-surface-polish-v18');S=P.parent/'somangi-eat-shoulder-natural-v17'
meta=json.loads((S/'metadata.json').read_text());bpy.ops.wm.open_mainfile(filepath=str(S/'somangi-eat.blend'))
scene=bpy.context.scene;scene.frame_set(34);body=bpy.data.objects['Somangi_SmoothBody'];head=set(meta['headIds']);a=meta['torsoVertexStart'];b=meta['torsoVertexEnd'];n=meta['originalVertexCount']
materials=[]
for name,color in [('Head',(.8,.8,.8,1)),('Torso',(.15,.55,.15,1)),('Arm',(.1,.25,.8,1)),('Sleeve',(.8,.3,.03,1))]:
    mat=bpy.data.materials.new(name);mat.diffuse_color=color;mat.use_nodes=True;mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=color;mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.8;materials.append(mat)
body.data.materials.clear()
for mat in materials:body.data.materials.append(mat)
for face in body.data.polygons:
    ids=face.vertices
    face.material_index=0 if all(i in head for i in ids) else 1 if all(a<=i<b for i in ids) else 3 if any(i>=n for i in ids) else 2
for ob in list(scene.objects):
    if ob!=body:ob.hide_render=True
world=bpy.data.worlds.new('QA');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.3,.3,.3,1);world.node_tree.nodes['Background'].inputs[1].default_value=.7;scene.world=world
for pos,power in [((3,-4,5),450),((-4,2,4),300)]:
    bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=power;o.data.size=4;o.rotation_euler=(Vector((0,0,-.1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(6,-.1,-.05));cam=bpy.context.object;cam.rotation_euler=(Vector((0,-.1,-.05))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=.8;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.render.resolution_x=640;scene.render.resolution_y=600;scene.render.resolution_percentage=100;scene.render.filepath=str(P/'surface-regions.png');bpy.ops.render.render(write_still=True)
