from pathlib import Path
P=Path(__file__).resolve().parent
code=(P.parent/'buddy-sit-v13/build.py').read_text(encoding='utf-8')
code=code.replace('buddy-walk-connections-v11/buddy-soft-connections.blend','buddy-walk-heat-v15/buddy-walk-heat.blend')
start=code.index('# Feet must follow')
end=code.index('\ndef rot(',start)
code=code[:start]+'''
# Keep belly volume entirely on Body; blend only below its lowest silhouette.
for v in mesh.data.vertices:
    x,y,z=v.co
    leg_names=['Leg.L','Leg.R']
    removed=sum(g.weight for g in v.groups if mesh.vertex_groups[g.group].name in leg_names)
    for name in leg_names:mesh.vertex_groups[name].remove([v.index])
    if removed:mesh.vertex_groups['Body'].add([v.index],removed,'ADD')
    if z<-.62:
        side='L' if x>=0 else 'R'
        w=smooth(-.62,-.77,z)
        for group in mesh.vertex_groups:group.remove([v.index])
        mesh.vertex_groups['Leg.'+side].add([v.index],w,'REPLACE')
        mesh.vertex_groups['Body'].add([v.index],1-w,'REPLACE')
'''+code[end:]
code=code.replace("'source':'buddy-walk-connections-v11'","'source':'buddy-walk-heat-v15'")
exec(compile(code,str(P/'generated-build.py'),'exec'))
