import bpy,numpy as np,json,sys
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from belly import preservation_mask
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];base=np.array([tuple(v.co) for v in body.data.vertices])
mask=preservation_mask(body,base);lookup={};pairs=[]
for v in body.data.vertices:
    key=tuple(round(x,6) for x in v.co)
    if key in lookup:pairs.append((lookup[key],v.index))
    else:lookup[key]=v.index
belly=mask==1;gap=0;belly_error=0
for key in list(body.data.shape_keys.key_blocks)[1:]:
    a=np.empty(len(base)*3,dtype=np.float32);key.data.foreach_get('co',a);a=a.reshape(-1,3)
    gap=max(gap,max(np.linalg.norm(a[i]-a[j]) for i,j in pairs))
    belly_error=max(belly_error,float(np.max(np.abs(a[belly]-base[belly]))))
assert gap<1e-6,gap
assert belly_error<1e-7,belly_error
assert len(body.data.materials)==2
report=json.loads((P/'validation.json').read_text());report.update({'maximumDuplicatedSeamGap':float(gap),
    'bellyVerticesFixedToOriginal':int(belly.sum()),'originalBellyDeviation':belly_error,
    'originalSmileBodyMaterialsUnmodified':len(body.data.materials)==2})
(P/'validation.json').write_text(json.dumps(report,indent=2));print(report)
