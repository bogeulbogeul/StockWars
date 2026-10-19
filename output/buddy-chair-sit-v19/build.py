from pathlib import Path
P=Path(__file__).resolve().parent
code=(P.parent/'buddy-sit-v13/build.py').read_text(encoding='utf-8')
code=code.replace('buddy-walk-connections-v11/buddy-soft-connections.blend','buddy-walk-heat-v15/buddy-walk-heat.blend')
start=code.index('# Feet must follow');end=code.index('\ndef rot(',start)
code=code[:start]+'''
# Keep torso rigid and rotate each whole leg from its actual upper root.
for v in mesh.data.vertices:
    x,y,z=v.co
    leg_names=['Leg.L','Leg.R']
    removed=sum(g.weight for g in v.groups if mesh.vertex_groups[g.group].name in leg_names)
    for n in leg_names:mesh.vertex_groups[n].remove([v.index])
    if removed:mesh.vertex_groups['Body'].add([v.index],removed,'ADD')
    if z<-.61:
        w=smooth(-.61,-.70,z)
        for g in mesh.vertex_groups:g.remove([v.index])
        mesh.vertex_groups['Leg.'+('L' if x>=0 else 'R')].add([v.index],w,'REPLACE')
        mesh.vertex_groups['Body'].add([v.index],1-w,'REPLACE')
blend=mesh.vertex_groups.new(name='Hip_Soften')
for v in mesh.data.vertices:
    if -.75<v.co.z<-.59:blend.add([v.index],math.sin(math.pi*(v.co.z+.75)/.16),'REPLACE')
sm=mesh.modifiers.new('Hip transition polish','SMOOTH');sm.vertex_group=blend.name;sm.factor=.7;sm.iterations=16
# Seat preview is separate from the character.
mat=bpy.data.materials.new('Seat_Wood');mat.diffuse_color=(.32,.20,.12,1)
def box(name,center,scale):
    bpy.ops.mesh.primitive_cube_add(size=1,location=center)
    o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat)
    bevel=o.modifiers.new('Rounded edges','BEVEL');bevel.width=.025;bevel.segments=3
box('Preview_Seat',(0,.10,-.70),(.85,.60,.09))
box('Preview_Backrest',(0,.38,-.31),(.85,.07,.72))
for x in [-.33,.33]:
    for y in [-.10,.31]:box('Preview_Chair_Leg',(x,y,-.94),(.065,.065,.45))
'''+code[end:]
code=code.replace("rot('Leg.L',-65*a);rot('Leg.R',-65*a)","rot('Leg.L',-86*a);rot('Leg.R',-86*a)")
code=code.replace("location.z=-.285*a","location.z=-.025*a")
code=code.replace("'source':'buddy-walk-connections-v11'","'source':'buddy-walk-heat-v15'")
exec(compile(code,str(P/'generated-build.py'),'exec'))
