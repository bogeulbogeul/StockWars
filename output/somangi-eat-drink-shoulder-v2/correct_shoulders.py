import bpy,numpy as np
from mathutils import Vector

def prepare(body,rig):
    action=rig.animation_data.action;slot=rig.animation_data.action_slot
    rig.animation_data.action=None
    for b in rig.pose.bones:
        b.location=(0,0,0);b.rotation_quaternion=(1,0,0,0);b.scale=(1,1,1)
    bpy.context.view_layer.update()
    # Keep the collar and head from being dragged by the raised arm.
    for v in body.data.vertices:
        neck=-.024+.035*min(1,abs(v.co.x)/.24)**4
        t=max(0,min(1,(neck-v.co.z)/.18));fade=t*t*t*(t*(t*6-15)+10)
        released=0
        for name in ['Arm.L','Arm.R']:
            group=body.vertex_groups[name]
            weight=next((g.weight for g in v.groups if g.group==group.index),0)
            if weight:
                group.add([v.index],weight*fade,'REPLACE');released+=weight*(1-fade)
        if released:
            group=body.vertex_groups['Root']
            weight=next((g.weight for g in v.groups if g.group==group.index),0)
            group.add([v.index],weight+released,'REPLACE')
    lookup={};mapping=[];positions=[];original=[]
    for v in body.data.vertices:
        k=tuple(round(c,6) for c in v.co)
        if k not in lookup:
            lookup[k]=len(positions);positions.append(tuple(v.co));original.append(v.index)
        mapping.append(lookup[k])
    faces=[]
    for f in body.data.polygons:
        ids=[mapping[i] for i in f.vertices]
        if len(set(ids))==len(ids):faces.append(ids)
    mesh=bpy.data.meshes.new('Shoulder solve proxy');mesh.from_pydata(positions,[],faces);mesh.update()
    proxy=bpy.data.objects.new('Shoulder solve proxy',mesh);bpy.context.collection.objects.link(proxy)
    skin_names=[b.name for b in rig.data.bones]
    weights=np.zeros((len(body.data.vertices),len(skin_names)))
    for col,name in enumerate(skin_names):
        src=body.vertex_groups[name].index;group=proxy.vertex_groups.new(name=name)
        for v in body.data.vertices:
            weights[v.index,col]=next((g.weight for g in v.groups if g.group==src),0)
        for i,index in enumerate(original):
            if weights[index,col]>0:group.add([i],float(weights[index,col]),'REPLACE')
    arm=proxy.modifiers.new('Volume preserving shoulders','ARMATURE');arm.object=rig
    arm.use_deform_preserve_volume=True
    smooth=proxy.modifiers.new('Restore smooth shoulder surface','CORRECTIVE_SMOOTH')
    smooth.factor=1;smooth.iterations=2000;smooth.smooth_type='LENGTH_WEIGHTED';smooth.rest_source='BIND'
    smooth.use_only_smooth=False
    bpy.context.view_layer.objects.active=proxy;proxy.select_set(True)
    bpy.ops.object.correctivesmooth_bind(modifier=smooth.name)
    finish=proxy.modifiers.new('Remove residual shoulder ripples','SMOOTH')
    finish.factor=1;finish.iterations=80
    rig.animation_data.action=action;rig.animation_data.action_slot=slot
    coords=np.array([tuple(v.co) for v in body.data.vertices])
    distance=np.minimum(np.linalg.norm(coords-np.array([.285,0,-.11]),axis=1),np.linalg.norm(coords-np.array([-.285,0,-.11]),axis=1))
    # Compact, smooth falloff: hands, head and lower torso remain untouched.
    t=np.clip((.48-distance)/.24,0,1);mask=t*t*t*(t*(t*6-15)+10)
    neck=-.024+.035*np.minimum(1,np.abs(coords[:,0])/.24)**4
    t=np.clip((neck-coords[:,2])/.04,0,1)
    mask*=t*t*t*(t*(t*6-15)+10)
    body.shape_key_add(name='Basis')
    return proxy,np.array(mapping),weights,skin_names,coords,mask

def bake(body,rig):
    proxy,mapping,weights,names,coords,mask=prepare(body,rig)
    frames=list(range(1,92,6));keys=[];maximum=0
    for frame in frames:
        bpy.context.scene.frame_set(frame)
        matrices=np.array([np.array(rig.pose.bones[n].matrix@rig.data.bones[n].matrix_local.inverted()) for n in names])
        skin=np.einsum('vb,bij->vij',weights,matrices)
        lbs=np.einsum('vij,vj->vi',skin[:,:3,:3],coords)+skin[:,:3,3]
        ev=proxy.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh()
        solved=np.array([tuple(v.co) for v in m.vertices])[mapping];ev.to_mesh_clear()
        delta=(solved-lbs)*mask[:,None]
        maximum=max(maximum,float(np.linalg.norm(delta,axis=1).max()))
        key=body.shape_key_add(name=f'Shoulder_pose_{frame:03}')
        key.data.foreach_set('co',(lbs+delta).astype(np.float32).ravel())
        keys.append(key)
    for i,frame in enumerate(frames):
        for j,key in enumerate(keys):
            key.value=1 if i==j else 0;key.keyframe_insert('value',frame=frame)
    action=body.data.shape_keys.animation_data.action
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for point in curve.keyframe_points:point.interpolation='LINEAR'
    # Blend adjacent corrective samples without altering the existing bone motion.
    for key in keys:key.value=0
    for modifier in list(body.modifiers):
        if modifier.type=='ARMATURE':body.modifiers.remove(modifier)
    bpy.data.objects.remove(proxy,do_unlink=True)
    bpy.context.scene.frame_set(1)
    return {'correctiveSamples':len(frames),'maximumPoseCorrection':maximum,'restVerticesMoved':0,'method':'Baked evaluated surface morph animation with volume preserving shoulder correction'}
