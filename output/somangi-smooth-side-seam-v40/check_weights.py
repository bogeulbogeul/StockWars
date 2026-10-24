import bpy,collections
from pathlib import Path
P=Path(__file__).resolve().parent;bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));b=bpy.data.objects['Somangi_SmoothBody'];print('ZERO',sum(len(v.groups)==0 for v in b.data.vertices));print('BADSUM',sum(abs(sum(g.weight for g in v.groups)-1)>.00001 for v in b.data.vertices));print('ZEROCO',[v.co[:] for v in b.data.vertices if len(v.groups)==0][:8]);print('MOD',[(x.name,x.type) for x in b.modifiers])
