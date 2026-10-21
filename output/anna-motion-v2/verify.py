import bpy,json,math
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-motion.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Anna_Rig'];body=bpy.data.objects['Anna_BaseBody'];samples=[];poses=[]
for frame in range(1,26):
 s.frame_set(frame);ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();samples.append(min(v.co.z for v in m.vertices));poses.append([tuple(v.co) for v in m.vertices]);ev.to_mesh_clear()
report=json.loads((P/'validation.json').read_text());report['ground_max_error']=max(abs(z+.9505959749) for z in samples);report['loop_vertex_error']=max(math.dist(a,b) for a,b in zip(poses[0],poses[-1]));report['normalized_weights']=all(abs(sum(g.weight for g in v.groups)-1)<1e-5 for o in bpy.data.objects if o.type=='MESH' for v in o.data.vertices)
assert report['ground_max_error']<1e-4 and report['loop_vertex_error']<1e-5 and report['normalized_weights']
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'Anna-motion.glb'))
report['reimport_actions']=[a.name for a in bpy.data.actions];report['reimport_bones']=len(next(o for o in bpy.data.objects if o.type=='ARMATURE').data.bones);assert len(report['reimport_actions'])==2 and report['reimport_bones']==7
(P/'validation.json').write_text(json.dumps(report,indent=2));print(report)
