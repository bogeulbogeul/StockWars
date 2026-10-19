from pathlib import Path
P=Path(__file__).resolve().parent
code=(P.parent/'buddy-chair-sit-v19/build.py').read_text(encoding='utf-8')
# Produce the previous chair scene in this new directory, with staged timing.
code=code.replace("exec(compile(code,str(P/'generated-build.py'),'exec'))",'''
code=code.replace("t=min(1,max(0,(f-9)/38));a=t*t*(3-2*t)","t=min(1,max(0,(f-12)/38));a=t*t*(3-2*t);lean=math.sin(math.pi*a)")
code=code.replace("rot('Body',-4*a);rot('Head',4*a)","rot('Body',10*lean-3*a);rot('Head',-5*lean+3*a)")
code=code.replace("location.z=-.025*a","location.z=-.025*a;rig.pose.bones['Root'].location.y=.055*a")
# Broad, local corrective smoothing after skin deformation; no head/feet changes.
code=code.replace("sm.factor=.7;sm.iterations=16","sm.factor=.8;sm.iterations=55")
code=code.replace("if -.75<v.co.z<-.59:blend.add([v.index],math.sin(math.pi*(v.co.z+.75)/.16),'REPLACE')","if -.80<v.co.z<-.57:blend.add([v.index],math.sin(math.pi*(v.co.z+.80)/.23),'REPLACE')")
exec(compile(code,str(P/'generated-build.py'),'exec'))
''')
exec(compile(code,str(P/'adapt-chair.py'),'exec'))
