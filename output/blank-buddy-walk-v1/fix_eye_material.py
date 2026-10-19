import bpy,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-walk.blend'))
m=bpy.data.objects['Somangi_Body'];report=[]
for mat in m.data.materials:
    shader=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    row={}
    for key in ['Metallic','Roughness','Specular IOR Level']:
        sock=shader.inputs[key]
        row[key]={'default':sock.default_value,'linked':bool(sock.links)}
        for link in list(sock.links):mat.node_tree.links.remove(link)
    shader.inputs['Metallic'].default_value=0
    shader.inputs['Roughness'].default_value=1
    shader.inputs['Specular IOR Level'].default_value=0
    report.append(row)
s=bpy.context.scene;cam=s.camera;s.cycles.samples=12
s.render.resolution_x=480;s.render.resolution_y=480
for label,pos in [('front-eye-fixed',(0,-6,0)),('side-eye-fixed',(6,0,0))]:
    cam.location=pos;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
    s.frame_set(1);s.render.filepath=str(P/(label+'.png'));bpy.ops.render.render(write_still=True)
cam.location=(6,0,0);cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
(P/'side-fixed-frames').mkdir(exist_ok=True)
for f in range(1,25):
    s.frame_set(f);s.render.filepath=str(P/'side-fixed-frames'/f'{f:03}.png');bpy.ops.render.render(write_still=True)
s.frame_set(1)
bpy.ops.object.select_all(action='DESELECT');m.select_set(True)
rig=bpy.data.objects['Somangi_Rig'];rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-walk-eye-fixed.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-walk-eye-fixed.glb'),use_selection=True,
 export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',
 export_materials='EXPORT',export_cameras=False,export_lights=False)
(P/'eye-material-report.json').write_text(json.dumps({'before':report,'after':{'metallic':0,'roughness':1,'specular':0},'base_color_unchanged':True},indent=2))
