from pathlib import Path
P=Path(__file__).resolve().parent
base=P.parent/'spirit-walk-original-v4/build.py'
code=base.read_text(encoding='utf-8')
insertion='''
def proportion(co):
    x,y,z=co
    t=max(0,min(1,-z/.15));t=t*t*(3-2*t)
    width=1-.16*t
    if z>=0:height=z
    elif z>=-.56:height=z*.68
    elif z>=-.78:height=-.3808+(z+.56)*.22
    else:height=-.4292+(z+.78)*.65
    # Compact feet and reduce forward shoe projection.
    foot=max(0,min(1,(-z-.67)/.14))
    x=x*width
    if foot:
        center=.20*.84*(1 if x>=0 else -1)
        x=center+(x-center)*(1-.22*foot)
    return Vector((x,y*(1-.16*t)*(1-.18*foot),height))
for vertex in mesh.data.vertices:vertex.co=proportion(vertex.co)
'''
code=code.replace("original=[tuple(v.co) for v in mesh.data.vertices]",insertion+"\noriginal=[tuple(v.co) for v in mesh.data.vertices]")
code=code.replace('bone.head=a;bone.tail=b','bone.head=proportion(a);bone.tail=proportion(b)')
# Weight classification uses source coordinates; proportions are monotonic.
code=code.replace('x,y,z=v.co;ax=abs(x);side=', 'x,y,z=v.co;z=z/.68 if z>=-.3808 else (-.56+(z+.3808)/.22 if z>=-.4292 else -.78+(z+.4292)/.65);x=x/.84 if z<-.15 else x;ax=abs(x);side=')
code=code.replace("if v.co.z<-.79","if v.co.z<-.46")
code=code.replace("8*s","10*s").replace("-8*s","-10*s")
code=code.replace("'Walk_Gentle'","'Walk_Chibi'")
code=code.replace("(2,-7,1.15)","(1.5,-7,1.1)").replace("Vector((0,0,-.02))","Vector((0,0,.20))")
code=code.replace("ortho_scale=2.35","ortho_scale=1.95")
code=code.replace('buddy-gentle-walk','buddy-chibi-walk')
code=code.replace('original geometry unchanged','proportioned rest mesh unchanged during rigging')
code=code.replace("'original_vertices_unchanged':True","'proportioned_rest_vertices_unchanged':True")
exec(compile(code,str(P/'generated-build.py'),'exec'))
