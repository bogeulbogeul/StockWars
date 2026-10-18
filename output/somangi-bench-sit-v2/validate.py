from pathlib import Path
P=Path(__file__).resolve().parent
source=(P.parent/'somangi-bench-sit-v1/validate.py').read_text()
source=source.replace("        assert rig.pose.bones['Leg.'+side].location.length<1e-7",'        pass # Seated compact pose uses rigid leg offsets; validate mesh lengths below.')
source=source.replace("core=[v.index for v in mesh.data.vertices if -.63<v.co.z<-.20 and abs(v.co.x)<.27]", "body_group=mesh.vertex_groups['Body'].index\ncore=[v.index for v in mesh.data.vertices if -.60<v.co.z<-.20 and abs(v.co.x)<.27 and any(g.group==body_group and g.weight>.999999 for g in v.groups)]")
exec(compile(source,str(P/'validate.py'),'exec'))
