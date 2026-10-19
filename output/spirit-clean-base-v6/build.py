import bpy, math, json
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
mat=bpy.data.materials.new('White_Base');mat.diffuse_color=(.92,.90,.86,1)
mat.use_nodes=True;shader=mat.node_tree.nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value=(.92,.90,.86,1);shader.inputs['Roughness'].default_value=.8
data=bpy.data.armatures.new('Simple_Limb_Bones');rig=bpy.data.objects.new('Buddy_Rig',data)
bpy.context.collection.objects.link(rig);rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
spec={'Root':((0,0,0),(0,0,.16),None),'Body':((0,0,.23),(0,0,.70),'Root'),
 'Head':((0,0,.72),(0,0,1.4),'Body'),
 'Arm.L':((.23,0,.64),(.43,0,.35),'Body'),'Arm.R':((-.23,0,.64),(-.43,0,.35),'Body'),
 'Leg.L':((.125,0,.23),(.125,0,.08),'Root'),'Leg.R':((-.125,0,.23),(-.125,0,.08),'Root')}
for n,(a,b,parent) in spec.items():
    bone=data.edit_bones.new(n);bone.head=a;bone.tail=b
    if parent:bone.parent=data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True
parts=[]
def skin(o,bone):
    o.data.materials.append(mat)
    for f in o.data.polygons:f.use_smooth=True
    g=o.vertex_groups.new(name=bone);g.add(list(range(len(o.data.vertices))),1,'REPLACE')
    m=o.modifiers.new('Rigid rounded part','ARMATURE');m.object=rig;o.parent=rig;parts.append(o)
def sphere(name,center,scale,bone,pear=0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=40,location=center)
    o=bpy.context.object;o.name=name
    for v in o.data.vertices:
        factor=1-pear*v.co.z
        v.co.x*=scale[0]*factor;v.co.y*=scale[1]*factor;v.co.z*=scale[2]
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);skin(o,bone)
sphere('Blank_Head',(0,0,1.14),(.47,.43,.46),'Head')
sphere('Pear_Body',(0,0,.445),(.25,.205,.285),'Body',.25)
for side,sign in [('L',1),('R',-1)]:
    # An ellipsoid droplet, rotated down from its shoulder; root hidden in torso.
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=32,location=(sign*.27,0,.455))
    o=bpy.context.object;o.name='Droplet_Arm.'+side
    for v in o.data.vertices:
        taper=1-.18*v.co.z
        v.co.x*=.078*taper;v.co.y*=.083*taper;v.co.z*=.205
    o.rotation_euler.y=sign*math.radians(-31)
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);skin(o,'Arm.'+side)
    sphere('Round_Foot.'+side,(sign*.125,-.035,.079),(.105,.13,.079),'Leg.'+side)
    sphere('Hidden_Leg.'+side,(sign*.125,0,.16),(.073,.075,.105),'Leg.'+side)
def rot(n,deg,axis=(1,0,0)):
    pb=rig.pose.bones[n];q=pb.bone.matrix_local.to_quaternion();pb.rotation_mode='QUATERNION'
    pb.rotation_quaternion=q.inverted()@Quaternion(axis,math.radians(deg))@q
rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new('Walk_Small')
s=bpy.context.scene;s.render.fps=24;s.frame_start=1;s.frame_end=32
for f in range(1,34):
    phase=(f-1)*math.tau/32;v=math.sin(phase)
    rot('Leg.L',11*v);rot('Leg.R',-11*v);rot('Arm.L',-6*v);rot('Arm.R',6*v)
    rot('Body',1.1*v,(0,1,0));rot('Head',-.8*v,(0,1,0))
    rig.pose.bones['Root'].location=(0,0,0);bpy.context.view_layer.update()
    feet=[o for o in parts if o.name.startswith('Round_Foot')]
    dep=bpy.context.evaluated_depsgraph_get()
    low=min(v.co.z for o in feet for v in o.evaluated_get(dep).data.vertices)
    rig.pose.bones['Root'].location.z=-low
    for pb in rig.pose.bones:
        pb.keyframe_insert(data_path='rotation_quaternion',frame=f,group=pb.name)
        pb.keyframe_insert(data_path='location',frame=f,group=pb.name)
s.frame_set(1)
bpy.ops.object.camera_add(location=(2,-7,2.4));cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,.8))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=1.98;s.camera=cam
s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO'
s.display.shading.studio_light='paint.sl';s.display.shading.color_type='MATERIAL'
s.display.shading.show_shadows=False;s.display.shading.show_cavity=False
s.display.shading.cavity_type='WORLD';s.display.shading.curvature_ridge_factor=.5
s.display.shading.background_type='WORLD'
world=bpy.data.worlds.new('Neutral');world.color=(.24,.26,.28);s.world=world
s.render.resolution_x=600;s.render.resolution_y=600;s.render.resolution_percentage=100
s.view_settings.view_transform='Standard'
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-clean.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'buddy-clean.glb'),use_selection=True,export_format='GLB',export_animation_mode='ACTIONS')
folder=P/'frames';folder.mkdir(exist_ok=True)
for f in range(1,33,2):
    s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
report={'parts':len(parts),'triangles':sum(len(o.data.polygons)*2 for o in parts),'bones':7,'actions':['Walk_Small'],'faces':'blank; texture expressions can be added later','shoulders':'overlapping round roots, rigid limbs'}
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'buddy-clean.glb'))
assert len(bpy.data.actions)==1
assert len(next(o for o in bpy.context.scene.objects if o.type=='ARMATURE').data.bones)==7
report['glb_reimport']='passed';(P/'validation.json').write_text(json.dumps(report,indent=2))
