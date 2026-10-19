from pathlib import Path
P=Path(__file__).resolve().parent
code=(P.parent/'buddy-sit-v13/build.py').read_text(encoding='utf-8')
code=code.replace('buddy-walk-connections-v11/buddy-soft-connections.blend','buddy-walk-heat-v15/buddy-walk-heat.blend')
start=code.index('def smooth(');end=code.index('def rot(',start)
code=code[:start]+'''
# Torso remains rigid; feet remain rigid. Only the short upper leg compresses.
for v in mesh.data.vertices:
    x,y,z=v.co
    leg_names=['Leg.L','Leg.R']
    removed=sum(g.weight for g in v.groups if mesh.vertex_groups[g.group].name in leg_names)
    for n in leg_names:mesh.vertex_groups[n].remove([v.index])
    if removed:mesh.vertex_groups['Body'].add([v.index],removed,'ADD')
    if z<-.64:
        t=max(0,min(1,(-z-.64)/.15));w=t*t*(3-2*t)
        for g in mesh.vertex_groups:g.remove([v.index])
        mesh.vertex_groups['Leg.'+('L' if x>=0 else 'R')].add([v.index],w,'REPLACE')
        mesh.vertex_groups['Body'].add([v.index],1-w,'REPLACE')
blend=mesh.vertex_groups.new(name='Upper_Leg_Soften')
for v in mesh.data.vertices:
    if -.82<v.co.z<-.62:
        w=math.sin(math.pi*(v.co.z+.82)/.20)
        blend.add([v.index],w,'REPLACE')
sm=mesh.modifiers.new('Soften compressed upper legs','SMOOTH')
sm.vertex_group=blend.name;sm.factor=.8;sm.iterations=20
'''+code[end:]
code=code.replace("rot('Leg.L',-65*a);rot('Leg.R',-65*a)","""
    # Move the feet relative to the lowered pelvis without bending the legs.
    for n in ['Leg.L','Leg.R']:
        pb=rig.pose.bones[n]
        pb.location=pb.bone.matrix_local.to_quaternion().inverted()@Vector((0,-.035*a,.105*a))
""")
code=code.replace("rot('Body',-4*a);rot('Head',4*a)","rot('Body',-1.5*a);rot('Head',1.5*a)")
code=code.replace("rot('Arm.L',-9*a);rot('Arm.R',-9*a)","rot('Arm.L',-3*a);rot('Arm.R',-3*a)")
code=code.replace("location.z=-.285*a","location.z=-.105*a")
code=code.replace("'source':'buddy-walk-connections-v11'","'source':'buddy-walk-heat-v15'")
exec(compile(code,str(P/'generated-build.py'),'exec'))
