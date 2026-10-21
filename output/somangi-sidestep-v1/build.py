import bpy, math, json
from pathlib import Path
from mathutils import Vector, Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-walk-v4/somangi-walk.blend'))
s=bpy.context.scene; rig=bpy.data.objects['Somangi_Rig']
rig.animation_data_clear()
for a in list(bpy.data.actions): bpy.data.actions.remove(a)
def location(pb, world):
    pb.location=pb.bone.matrix_local.to_3x3().inverted()@Vector(world)
def rotation(pb, q):
    basis=pb.bone.matrix_local.to_quaternion()
    pb.rotation_quaternion=basis.inverted()@q@basis
objects=[bpy.data.objects[n] for n in ['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']]
baseline={o.name:[v.co.copy() for v in o.data.vertices] for o in objects}
report={'duration_seconds':1,'clips':[],'maximum_arm_edge_error':0,'torso_displacement':0}
for direction,sign in [('Right',1),('Left',-1)]:
    action=bpy.data.actions.new('Sidestep_'+direction);rig.animation_data_create();rig.animation_data.action=action
    ends={}
    for frame in range(1,26):
        t=(frame-1)/24
        for pb in rig.pose.bones:
            pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
        for side,offset in [('L',0),('R',.5)]:
            phase=(t+offset)%1
            if phase<.5: x=.08-.32*phase; lift=0
            else:
                u=2*(phase-.5); x=-.08+.16*(u*u*(3-2*u));lift=.035*math.sin(math.pi*u)**2
            location(rig.pose.bones['Leg.'+side],(sign*x,0,lift))
            inward=1 if side=='L' else -1
            q=Quaternion((1,0,0),math.radians(-24))@Quaternion((0,1,0),math.radians(inward*12))
            rotation(rig.pose.bones['Arm.'+side],q)
        for pb in rig.pose.bones:
            pb.keyframe_insert('location',frame=frame,group=pb.name)
            pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name)
        bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();snapshot={}
        for o in objects:
            ev=o.evaluated_get(dg);me=ev.to_mesh();coords=[v.co.copy() for v in me.vertices];snapshot[o.name]=coords
            assert all(math.isfinite(c) for v in coords for c in v)
            if o.name=='Eating_Torso':report['torso_displacement']=max(report['torso_displacement'],max((a-b).length for a,b in zip(coords,baseline[o.name])))
            if o.name.startswith('Rigid_Arm'):
                for edge in o.data.edges:
                    a,b=edge.vertices;err=abs((coords[a]-coords[b]).length-(baseline[o.name][a]-baseline[o.name][b]).length)
                    report['maximum_arm_edge_error']=max(report['maximum_arm_edge_error'],err)
            if o.name=='Somangi_Body':assert min(v.z for v in coords)>=min(v.z for v in baseline[o.name])-1e-6
            ev.to_mesh_clear()
        if frame in [1,25]:ends[frame]=snapshot
    loop=max((a-b).length for n in ends[1] for a,b in zip(ends[1][n],ends[25][n]));assert loop<1e-6
    action.use_fake_user=True;report['clips'].append({'name':action.name,'loop_error':loop})
assert report['torso_displacement']<1e-6 and report['maximum_arm_edge_error']<1e-6
rig.animation_data.action=bpy.data.actions['Sidestep_Right']
s.frame_start=1;s.frame_end=25;s.render.fps=24;s.frame_set(1)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-sidestep.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-sidestep.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
(P/'validation.json').write_text(json.dumps(report,indent=2));print('VALIDATION',report)
