import bpy,math,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
mat=bpy.data.materials.new('Warm_White');mat.diffuse_color=(.91,.9,.87,1)
parts=[]
def shape(name,center,scale,segments=24,rings=16,pear=0,angle=0,head=False):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=center)
    o=bpy.context.object;o.name=name
    for v in o.data.vertices:
        z=v.co.z;factor=1-pear*z
        v.co.x*=scale[0]*factor;v.co.y*=scale[1]*factor
        if head and z<0:
            z+=.18*z*z
        v.co.z=z*scale[2]
    o.rotation_euler.y=math.radians(angle)
    o.data.materials.append(mat)
    for f in o.data.polygons:f.use_smooth=True
    parts.append(o);return o
shape('Head',(0,0,1.36),(.51,.49,.49),32,20,head=True)
shape('Body',(0,0,.635),(.33,.255,.365),24,16,pear=.19)
for side,sign in [('L',1),('R',-1)]:
    shape('Arm.'+side,(sign*.35,0,.735),(.105,.11,.30),20,14,pear=.12,angle=-sign*32)
    shape('Leg.'+side,(sign*.19,0,.25),(.115,.115,.23),20,12)
    shape('Foot.'+side,(sign*.205,-.065,.088),(.165,.205,.10),24,12)
# Sole flattened gently; no sharp planar cap or thin compressed shoe.
for o in parts:
    if o.name.startswith('Foot'):
        for v in o.data.vertices:
            if v.co.z<-.075:v.co.z=-.075+(v.co.z+.075)*.20
scene=bpy.context.scene
bpy.ops.object.camera_add(location=(0,-7,.93));cam=bpy.context.object
cam.data.type='ORTHO';cam.data.ortho_scale=2.12;scene.camera=cam
scene.render.engine='BLENDER_WORKBENCH';scene.display.shading.light='STUDIO'
scene.display.shading.studio_light='paint.sl';scene.display.shading.color_type='MATERIAL'
scene.display.shading.show_shadows=False;scene.display.shading.show_cavity=False
scene.display.shading.background_type='WORLD'
world=bpy.data.worlds.new('Neutral');world.color=(.28,.30,.32);scene.world=world
scene.render.resolution_x=640;scene.render.resolution_y=700;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard'
for label,pos in [('front',(0,-7,.93)),('side',(7,0,.93)),('back',(0,7,.93))]:
    cam.location=pos;cam.rotation_euler=(Vector((0,0,.93))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(P/(label+'.png'));bpy.ops.render.render(write_still=True)
cam.location=(2.5,-7,2.5);cam.rotation_euler=(Vector((0,0,.93))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(P/'angle.png');bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_location=(0,0,.93)
            area.spaces.active.region_3d.view_distance=3.3
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-base.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'buddy-base.glb'),use_selection=True,export_format='GLB',export_animations=False)
triangles=sum(sum(len(f.vertices)-2 for f in o.data.polygons) for o in parts)
report={'parts':len(parts),'triangles':triangles,'rig':False,'expression':'blank','parts_separate':True}
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'buddy-base.glb'))
assert len([o for o in bpy.context.scene.objects if o.type=='MESH'])==8
report['glb_reimport']='passed';(P/'validation.json').write_text(json.dumps(report,indent=2))
