"""Keep shoulder roots attached during Moa's walk; avoid inherited root drift."""
import bpy,math,json
from mathutils import Matrix,Vector

def repair_walk(body,rig,folder):
    scene=bpy.context.scene
    old=rig.animation_data.action
    original_name=old.name
    old.name='Previous_walk_attachment_drift'
    action=bpy.data.actions.new(original_name)
    rig.animation_data.action=action
    baseline=min(v.co.z for v in body.data.vertices)
    roots=[]
    for frame in range(1,32):
        scene.frame_set(frame)
        phase=2*math.pi*(frame-1)/30
        wave=math.sin(phase)
        for pb in rig.pose.bones:
            pb.rotation_mode='QUATERNION'
            pb.rotation_quaternion=(1,0,0,0)
            pb.location=(0,0,0)
            pb.scale=(1,1,1)
        for side,sign in [('L',1),('R',-1)]:
            for part,degrees in [('Leg',18),('Arm',-8)]:
                pb=rig.pose.bones[part+'.'+side]
                basis=pb.bone.matrix_local.to_3x3()
                rotation=Matrix.Rotation(math.radians(degrees)*wave*sign,3,'X')
                pb.rotation_quaternion=(basis.inverted()@rotation@basis).to_quaternion()
                if part=='Leg':
                    pb.location=basis.inverted()@Vector((0,0,.03*max(0,wave*sign)))
        bpy.context.view_layer.update()
        ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh=ev.to_mesh()
        minimum=min(v.co.z for v in mesh.vertices)
        ev.to_mesh_clear()
        root=rig.pose.bones['Body']
        root.location=root.bone.matrix_local.to_3x3().inverted()@Vector((0,0,baseline-minimum))
        for name in ('Body','Arm.L','Arm.R','Leg.L','Leg.R'):
            pb=rig.pose.bones[name]
            pb.keyframe_insert('rotation_quaternion',frame=frame,group=name)
            pb.keyframe_insert('location',frame=frame,group=name)
        roots.append(list(root.location))
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:key.interpolation='LINEAR'
    bpy.data.actions.remove(old,do_unlink=True)
    rig.animation_data.action=action
    scene.frame_set(1)
    assert max(abs(a-b) for a,b in zip(roots[0],roots[-1]))<1e-5
    (folder/'walk-attachment-check.json').write_text(json.dumps(dict(
        scope='This Moa output only; original Somangi sources unchanged',
        rootLoopError=max(abs(a-b) for a,b in zip(roots[0],roots[-1])),
        shoulderLocalTranslationsZero=True,frames=31,seconds=.75,
        retainedSwingDegrees=dict(legs=18,arms=8),
        originalIssue='Accumulated Body translation and compensating arm translations separated shoulder roots'),indent=2))
