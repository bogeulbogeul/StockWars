from pathlib import Path
p=Path('C:/GitHub/StockWars/output')
s=(p/'anna-motion-v2/build.py').read_text(encoding='utf-8-sig')
s=s.replace("('Arm.L',(.29,0,-.17),(.65,0,-.17),'Body'),('Arm.R',(-.29,0,-.17),(-.65,0,-.17),'Body')", "('Arm.L',(.26,0,-.135),(.50,0,-.455),'Body'),('Arm.R',(-.26,0,-.135),(-.50,0,-.455),'Body')")
s=s.replace("def rot(n,q):", "import sys\nsys.path.insert(0,str(P))\nfrom structure import rebuild\nmeshes+=rebuild(bpy.data.objects['Anna_BaseBody'],rig)\noriginal={o.name:[tuple(v.co) for v in o.data.vertices] for o in meshes}\n\ndef rot(n,q):")
s=s.replace("@Quaternion((0,1,0),math.radians(sign*60))", "")
s=s.replace("'rest_meshes_unchanged':True", "'rigid_separate_arms':True,'rest_meshes_unchanged_during_animation':True")
(p/'anna-motion-v4/build.py').write_text(s,encoding='utf-8')
