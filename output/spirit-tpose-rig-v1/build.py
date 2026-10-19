import bpy, bmesh, math, json
from pathlib import Path
from mathutils import Vector, Quaternion

OUT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(OUT.parent/'spirit-rigid-rig-v1/source.blend'))
src=next(o for o in bpy.context.scene.objects if o.type=='MESH')
original_vertices=len(src.data.vertices)
white=bpy.data.materials.new('White matte - recolorable')
white.diffuse_color=(.91,.91,.91,1)
white.use_nodes=True
bs=white.node_tree.nodes.get('Principled BSDF')
bs.inputs['Base Color'].default_value=(.91,.91,.91,1)
bs.inputs['Roughness'].default_value=.78

def piece(name,planes):
    mesh=src.data.copy()
    bm=bmesh.new(); bm.from_mesh(mesh)
    for normal,point,positive in planes:
        geom=list(bm.verts)+list(bm.edges)+list(bm.faces)
        res=bmesh.ops.bisect_plane(bm,geom=geom,dist=.00001,
            plane_co=point,plane_no=normal,clear_inner=positive,clear_outer=not positive)
        boundary=[e for e in bm.edges if e.is_boundary]
        if boundary:
            try: bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
            except RuntimeError: pass
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(mesh); bm.free()
    obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj)
    mesh.materials.clear(); mesh.materials.append(white)
    for p in mesh.polygons:p.use_smooth=True
    return obj

# Oblique shoulder caps separate entire arms; horizontal hip caps separate legs.
rp=((1,0,.48),(.26,0,0),True)
lp=((-1,0,.48),(-.26,0,0),True)
body=piece('Body',[(rp[0],rp[1],False),(lp[0],lp[1],False),((0,0,1),(0,0,-.595),True),((0,0,1),(0,0,-.035),False)])
head=piece('Head',[((0,0,1),(0,0,.035),True)])
arms=[piece('Arm_'+side,[plane,((0,0,1),(0,0,-.035),False)]) for side,plane in [('L',rp),('R',lp)]]
legs=[piece('Leg_'+side,[((0,0,1),(0,0,-.585),False),((1,0,0),(0,0,0),side=='L')]) for side in ['L','R']]
bpy.data.objects.remove(src,do_unlink=True)

# Smooth rounded, overlapping limb roots avoid exposed cut surfaces during rotation.
# Keep imported head; rebuild only simple body/limb volumes around its proportions.
for obj in [body]+arms+legs:bpy.data.objects.remove(obj,do_unlink=True)
def ellipsoid(name,center,scale,direction=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=32,location=center)
    obj=bpy.context.object;obj.name=name;obj.scale=scale
    if direction:obj.rotation_euler=Vector(direction).to_track_quat('Z','Y').to_euler()
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    obj.data.materials.append(white)
    for p in obj.data.polygons:p.use_smooth=True
    return obj
body=ellipsoid('Body',(0,.015,-.36),(.425,.325,.345))
neck=ellipsoid('Neck',(0,0,.005),(.235,.215,.09))
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True);neck.select_set(True);bpy.context.view_layer.objects.active=body
bpy.ops.object.join()
arms=[];legs=[]
for side,sign in [('L',1),('R',-1)]:
    arms.append(ellipsoid('Arm_'+side,(sign*.53,0,-.195),(.13,.13,.31),(sign,0,0)))
    leg=ellipsoid('Leg_'+side,(sign*.225,0,-.715),(.155,.175,.225))
    foot=ellipsoid('Foot_'+side,(sign*.225,-.075,-.855),(.205,.255,.10))
    bpy.ops.object.select_all(action='DESELECT')
    leg.select_set(True);foot.select_set(True);bpy.context.view_layer.objects.active=leg
    bpy.ops.object.join()
    rem=leg.modifiers.new('Continuous rounded leg and foot','REMESH')
    rem.mode='VOXEL';rem.voxel_size=.012;rem.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=rem.name)
    smooth=leg.modifiers.new('Smooth limb silhouette','SMOOTH');smooth.factor=.7;smooth.iterations=4
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    legs.append(leg)

arm=bpy.data.armatures.new('Rigid limb skeleton')
rig=bpy.data.objects.new('Buddy_Rigid_Rig',arm); bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig; rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
spec={'Root':((0,0,-.94),(0,0,-.72),None),
      'Body':((0,0,-.57),(0,0,-.12),'Root'),
      'Arm_L':((.355,0,-.195),(.79,0,-.195),'Body'),
      'Arm_R':((-.355,0,-.195),(-.79,0,-.195),'Body'),
      'Leg_L':((.225,0,-.59),(.225,0,-.9),'Root'),
      'Leg_R':((-.225,0,-.59),(-.225,0,-.9),'Root')}
for name,(h,t,parent) in spec.items():
    b=arm.edit_bones.new(name); b.head=h;b.tail=t
    if parent:b.parent=arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
rig.show_in_front=True
for obj,bone in [(body,'Body'),(head,'Body')]+[(o,o.name) for o in arms+legs]:
    group=obj.vertex_groups.new(name=bone)
    group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
    mod=obj.modifiers.new('Rigid bone - no elbow or knee','ARMATURE');mod.object=rig
    obj.parent=rig

def rotate(name,axis,degrees):
    pb=rig.pose.bones[name]; basis=pb.bone.matrix_local.to_quaternion()
    pb.rotation_mode='QUATERNION'
    pb.rotation_quaternion=basis.inverted() @ Quaternion(Vector(axis),math.radians(degrees)) @ basis

def reset():
    for pb in rig.pose.bones:
        pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)

def rest_arms():
    rotate('Arm_L',(0,1,0),55)
    rotate('Arm_R',(0,1,0),-55)

def compose(name,q):
    pb=rig.pose.bones[name];basis=pb.bone.matrix_local.to_quaternion()
    pb.rotation_quaternion=basis.inverted() @ q @ basis

def make_action(name,end,pose):
    rig.animation_data_create();rig.animation_data.action=None
    action=bpy.data.actions.new(name);rig.animation_data.action=action
    for f in range(1,end+1):
        reset();pose((f-1)/(end-1))
        for pb in rig.pose.bones:
            pb.keyframe_insert(data_path='rotation_quaternion',frame=f,group=pb.name)
            pb.keyframe_insert(data_path='location',frame=f,group=pb.name)
    action.use_fake_user=True
    track=rig.animation_data.nla_tracks.new();track.name=name
    strip=track.strips.new(name,1,action);strip.action_frame_end=end
    track.mute=True
    return action

def walking(t):
    s=math.sin(t*math.tau)
    rotate('Leg_L',(1,0,0),s*17);rotate('Leg_R',(1,0,0),-s*17)
    compose('Arm_L',Quaternion((1,0,0),math.radians(-s*15)) @ Quaternion((0,1,0),math.radians(55)))
    compose('Arm_R',Quaternion((1,0,0),math.radians(s*15)) @ Quaternion((0,1,0),math.radians(-55)))
    rig.pose.bones['Root'].location.z=.012*(1-math.cos(t*math.tau*2))

def waving(t):
    rest_arms()
    rise=min(1,t*5,(1-t)*5)
    rotate('Arm_L',(0,1,0),55-rise*(130+10*math.sin(t*math.tau*3)))

def eating(t):
    rest_arms()
    lift=(1-math.cos(t*math.tau))/2
    pb=rig.pose.bones['Arm_R'];basis=pb.bone.matrix_local.to_quaternion()
    q=Quaternion((0,1,0),math.radians(30*lift)) @ Quaternion((1,0,0),math.radians(-112*lift)) @ Quaternion((0,1,0),math.radians(-55))
    pb.rotation_quaternion=basis.inverted() @ q @ basis

actions={'Tpose':make_action('Tpose',2,lambda t:None),
         'Idle':make_action('Idle',49,lambda t:rest_arms()),
         'Walk':make_action('Walk',33,walking),
         'Wave':make_action('Wave',73,waving),
         'Eat':make_action('Eat',73,eating)}
rig.animation_data.action=actions['Idle'];reset()
scene=bpy.context.scene;scene.render.fps=24;scene.frame_start=1;scene.frame_end=73

# Food is a separate prop, attached rigidly to the raised right hand.
bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=.1,location=(-.79,-.04,-.195))
food=bpy.context.object;food.name='Food_demo_prop'
mat=bpy.data.materials.new('Food warm orange');mat.diffuse_color=(.8,.39,.09,1)
food.data.materials.append(mat)
g=food.vertex_groups.new(name='Arm_R');g.add(list(range(len(food.data.vertices))),1,'REPLACE')
mod=food.modifiers.new('Hand attachment','ARMATURE');mod.object=rig
food.parent=rig
for poly in food.data.polygons:poly.use_smooth=True
food.hide_render=True;food.hide_set(True)

def aim(obj,target):obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(3,-6,1.9))
camera=bpy.context.object;aim(camera,(0,0,-.02));camera.data.type='ORTHO';camera.data.ortho_scale=2.65;scene.camera=camera
for loc,power,size in [((2,-4,5),500,4),((-3,-2,2),300,3),((0,3,3),350,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;aim(light,(0,0,0))
scene.world.color=(.3,.3,.3)
scene.render.engine='BLENDER_WORKBENCH'
scene.display.shading.light='STUDIO'
scene.display.shading.studio_light='paint.sl'
scene.display.shading.color_type='MATERIAL'
scene.display.shading.show_shadows=True
scene.display.shading.show_cavity=True
scene.display.shading.cavity_type='WORLD'
scene.display.shading.background_type='WORLD'
scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='Standard'
scene.render.film_transparent=False
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.955))
floor=bpy.context.object;floor.name='Preview_floor';fm=bpy.data.materials.new('Floor');fm.diffuse_color=(.23,.26,.29,1);floor.data.materials.append(fm)

for label,action,frame in [('tpose','Tpose',1),('idle','Idle',1),('walk_a','Walk',9),('walk_b','Walk',25),('wave','Wave',37),('eat','Eat',37)]:
    rig.animation_data.action=actions[action]
    food.hide_render=action!='Eat';food.hide_set(action!='Eat')
    scene.frame_set(frame)
    scene.render.filepath=str(OUT/(label+'.png'));bpy.ops.render.render(write_still=True)

food.hide_render=True;food.hide_set(True)
rig.animation_data.action=actions['Tpose'];scene.frame_set(1);scene.frame_end=33
for o in bpy.context.selected_objects:o.select_set(False)
rig.select_set(True);bpy.context.view_layer.objects.active=rig
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_distance=3.5
            area.spaces.active.region_3d.view_location=(0,0,0)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'buddy-tpose.blend'))
for obj in [rig,body,head]+arms+legs:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'buddy-tpose.glb'),use_selection=True,
    export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',
    export_skins=True,export_materials='EXPORT',export_cameras=False,export_lights=False)
report={'bones':list(spec),'no_elbow_or_knee':True,'rigid_weights':True,
        'actions':list(actions),'source_vertices':original_vertices,
        'parts':{o.name:len(o.data.vertices) for o in [body,head]+arms+legs},
        'note':'Imported head retained. Simple torso and rounded limbs rebuilt to prevent torn cut surfaces. Rigid shoulder/hip rotation only. Original preserved in source.blend. Eat is a reach test without facial texture.'}
(OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('RIG_COMPLETE',json.dumps(report))
