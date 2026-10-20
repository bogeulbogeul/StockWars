import bpy,json,math,struct,sys
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-crab-walk.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];head=bpy.data.objects['Somangi_Body'];body=bpy.data.objects['Eating_Torso']
base=[v.co.copy() for v in head.data.vertices];ids=[i for i,v in enumerate(base) if v.z<-.73];footset=set(ids)
edges=[e for e in head.data.edges if all(i in footset for i in e.vertices)];floor=min(base[i].z for i in ids)
report={'samples':97,'floor_penetration':0,'support_gap':0,'leg_length_error':0,'torso_shape_error':0,'leg_translation':0};ends={}
direction='Left' if '--left' in sys.argv else 'Right'
rig.animation_data.action=bpy.data.actions['Crab_'+direction]
start=None;forward_error=0;lateral_travel=0
for i in range(97):
    time=1+i/4;s.frame_set(int(time),subframe=time-int(time));dg=bpy.context.evaluated_depsgraph_get()
    ev=head.evaluated_get(dg);me=ev.to_mesh();co=[v.co.copy() for v in me.vertices];low=min(co[j].z for j in ids)
    if start is None:start=co
    forward_error=max(forward_error,max(abs(co[j].x-start[j].x) for j in ids))
    lateral_travel=max(lateral_travel,max(abs(co[j].y-start[j].y) for j in ids))
    report['floor_penetration']=max(report['floor_penetration'],floor-low);report['support_gap']=max(report['support_gap'],low-floor)
    for edge in edges:
        a,b=edge.vertices;report['leg_length_error']=max(report['leg_length_error'],abs((co[a]-co[b]).length-(base[a]-base[b]).length))
    if i in [0,96]:ends[i]=co
    ev.to_mesh_clear();ev=body.evaluated_get(dg);me=ev.to_mesh()
    matrix=rig.pose.bones['Body'].matrix@rig.data.bones['Body'].matrix_local.inverted()
    report['torso_shape_error']=max(report['torso_shape_error'],max((v.co-matrix@b.co).length for v,b in zip(me.vertices,body.data.vertices)));ev.to_mesh_clear()
    report['leg_translation']=max(report['leg_translation'],*[rig.pose.bones['Leg.'+side].location.length for side in ['L','R']])
    assert all(abs(c-1)<1e-7 for pb in rig.pose.bones for c in pb.scale)
report['loop_error']=max((a-b).length for a,b in zip(ends[0],ends[96]))
assert report['floor_penetration']<.003 and report['support_gap']<.003 and report['leg_length_error']<1e-5 and report['torso_shape_error']<1e-5 and report['leg_translation']<.019 and report['loop_error']<1e-5,report
report['foot_motion']='lateral rotation around Y, with at most 0.018 vertical lift; no horizontal leg translation'
report.update(direction=direction,forward_foot_travel=forward_error,lateral_foot_travel=lateral_travel)
assert forward_error<1e-5 and lateral_travel>.04,report
d=(P/'somangi-crab-walk.glb').read_bytes();g=json.loads(d[20:20+struct.unpack_from('<I',d,12)[0]])
report['clips']=[a['name'] for a in g['animations']];assert set(report['clips'])=={'Crab_Enter','Crab_Right','Crab_Left','Crab_Exit'}
(P/('validation-left.json' if direction=='Left' else 'validation.json')).write_text(json.dumps(report,indent=2));print('VALIDATION',report)
