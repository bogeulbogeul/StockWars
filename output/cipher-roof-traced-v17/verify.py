"""Validate the exported review model without claiming game/play approval."""
import json,struct,math,hashlib
from pathlib import Path
root=Path(__file__).resolve().parent
raw=(root/'CipherSecurities-clock.glb').read_bytes()
assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
length=struct.unpack_from('<I',raw,12)[0]
model=json.loads(raw[20:20+length])
names=[n.get('name','') for n in model['nodes']]
for name in ('Clock_Hour','Clock_Minute','Door_Assembly','Reference_Door_Leaf_Left',
             'Reference_Door_Leaf_Right','Reference_Continuous_Three_Step'):
    assert names.count(name)==1,name
assert not any(n.startswith(('Preview_','Studio_')) for n in names)
for accessor in model['accessors']:
    for key in ('min','max'):
        assert all(math.isfinite(v) for v in accessor.get(key,[]))
assert sum(n.startswith('Reference_Stepped_Stone_Cheek') for n in names)==6
assert sum(n.startswith('Portico_Column') and not n.startswith(('Portico_Column_Capital','Portico_Column_Plinth')) for n in names)==4
report={'glbHeaderAndLength':True,'finiteAccessorBounds':True,'clockHandNodesPresent':True,
        'doorAssemblyPresent':True,'columns':4,'stairCheekSections':6,
        'previewObjectsExported':False,'sha256':hashlib.sha256(raw).hexdigest(),
        'gameApplied':False,'visualMatch':'See comparison.png and roof-fit.json; landmark fitting is not exact image-match approval.'}
(root/'validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
