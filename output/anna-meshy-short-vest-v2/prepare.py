from pathlib import Path
p=Path('C:/GitHub/StockWars/output')
s=(p/'anna-meshy-short-vest-v1/build.py').read_text(encoding='utf-8-sig')
s=s.replace('v.co.y*=.78+.22*t','''v.co.y*=.78+.22*t
 z=v.co.z*.41-.22
 a=max(0,min(1,(z+.40)/.22));a=a*a*(3-2*a)
 b=max(0,min(1,(z-.02)/.10));b=b*b*(3-2*b)
 v.co.x*=1+.14*a*(1-b)''')
s=s.replace("assert all(abs(a[0]-v.co.x)<1e-7 and abs(a[2]-v.co.z)<1e-7 for a,v in zip(raw,o.data.vertices))","assert all(abs(a[2]-v.co.z)<1e-7 for a,v in zip(raw,o.data.vertices))")
s=s.replace("'original_vest_front_outline_xz_unchanged':True", "'original_vest_length_and_topology_preserved':True,'upper_torso_width_clearance':.14")
(p/'anna-meshy-short-vest-v2/build.py').write_text(s,encoding='utf-8')
