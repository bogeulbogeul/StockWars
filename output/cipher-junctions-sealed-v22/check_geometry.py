"""Check the actual saved structural solids and preserved sign margins."""
import bpy,bmesh,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'CipherSecurities-sealed-junctions.blend'))
base=bpy.data.objects['Central_Foundation'];bm=bmesh.new();bm.from_mesh(base.data)
boundary=sum(e.is_boundary for e in bm.edges);nonmanifold=sum(not e.is_manifold for e in bm.edges);bm.free()
assert boundary==0 and nonmanifold==0
minimum=min((base.matrix_world@v.co).z for v in base.data.vertices)
assert abs(minimum)<1e-6
names=[o.name for o in bpy.context.scene.objects]
assert sum(n.startswith('Portico_Column_Plinth_Pair') for n in names)==2
assert sum(n.startswith('Wing_Closed_Outer_Eave') for n in names)==2
assert 'Pediment_Closed_Roof_Rebate' in names
plaque=bpy.data.objects['Cipher_Logo_Navy_Plaque'];points=[plaque.matrix_world@Vector(c) for c in plaque.bound_box]
lo=Vector(tuple(min(v[i] for v in points) for i in range(3)));hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
mark=[o for o in bpy.context.scene.objects if o.name.startswith(('Reference_Chart_Bar','Reference_Rising_Chart_Line','Reference_Chart_Arrowhead'))]
points=[o.matrix_world@Vector(c) for o in mark for c in o.bound_box]
margins={'left':min(p.x for p in points)-lo.x,'right':hi.x-max(p.x for p in points),
 'bottom':min(p.z for p in points)-lo.z,'top':hi.z-max(p.z for p in points)}
assert min(margins.values())>.035
report={'foundationMinZ':minimum,'foundationBoundaryEdges':boundary,'foundationNonManifoldEdges':nonmanifold,
 'pairedPlinths':2,'closedOuterEaves':2,'gableBackingPresent':True,'preservedMarkMargins':margins,'gameApplied':False}
(ROOT/'geometry-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
