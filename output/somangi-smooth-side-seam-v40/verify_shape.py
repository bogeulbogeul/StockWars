import bpy,json,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-hidden-shoulder-v39/somangi-eat.blend'));b=bpy.data.objects['Somangi_SmoothBody'];old=np.array([v.co[:] for v in b.data.vertices]);head=set(json.loads((P.parent/'somangi-eat-unbent-v35/metadata.json').read_text())['headIds']);main={}
for name in ['Arm.L','Arm.R']:
 group=b.vertex_groups[name].index;valid={v.index for v in b.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups)};adj={}
 for f in b.data.polygons:
  if f.material_index==0 and all(i in valid for i in f.vertices):
   for i in f.vertices:adj.setdefault(i,set()).update(f.vertices)
 pending=set(adj);parts=[]
 while pending:
  q=[pending.pop()];component=set(q)
  while q:
   for i in adj[q.pop()]:
    if i in pending:pending.remove(i);component.add(i);q.append(i)
  parts.append(component)
 main[name]=max(parts,key=len)
arm_old=set(sum(json.loads((P.parent/'somangi-hidden-shoulder-v39/arm-vertices.json').read_text()).values(),[]));body_old=[i for i in range(len(old)) if i not in head and i not in arm_old]
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));b=bpy.data.objects['Somangi_SmoothBody'];new=np.array([v.co[:] for v in b.data.vertices]);mapping={int(k):v for k,v in json.loads((P/'vertex-map.json').read_text()).items()};report={}
for name,ids in dict(Head=head,**main).items():
 missing=set(ids)-mapping.keys();common=list(set(ids)&mapping.keys());error=float(np.max(np.abs(old[common]-new[[mapping[i] for i in common]])))
 report[name]=dict(vertices=len(ids),missing=len(missing),maximumOriginalPositionDifference=error)
head_new={mapping[i] for i in head if i in mapping};arm_new=set(sum(json.loads((P/'arm-vertices.json').read_text()).values(),[]));body_new=[i for i in range(len(new)) if i not in head_new and i not in arm_new];profile=[]
for z in np.arange(-.6,-.03,.025):
 a=old[body_old];a=a[np.abs(a[:,2]-z)<.008];c=new[body_new];c=c[np.abs(c[:,2]-z)<.008]
 if len(a) and len(c):profile.append(dict(z=float(z),oldWidth=float(np.ptp(a[:,0])),newWidth=float(np.ptp(c[:,0]))))
report['bodyWidthProfiles']=profile;report['maxBodyWidthDifference']=max(abs(x['oldWidth']-x['newWidth']) for x in profile)
(P/'shape-preservation.json').write_text(json.dumps(report,indent=2));print(report)
assert all(report[n]['missing']==0 and report[n]['maximumOriginalPositionDifference']==0 for n in ['Head','Arm.L','Arm.R'])
