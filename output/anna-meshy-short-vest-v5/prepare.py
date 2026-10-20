from pathlib import Path
p=Path('C:/GitHub/StockWars/output')
s=(p/'anna-meshy-short-vest-v4/build.py').read_text(encoding='utf-8-sig').replace("anna-meshy-short-vest-v3/Anna-meshy-short-vest.blend","anna-meshy-short-vest-v4/Anna-meshy-short-vest.blend")
s=s.replace("t=max(0,min(1,(-q.z-.16)/.16));t=t*t*(3-2*t)\n if gap>.018:q-=direction*((gap-.018)*.45*t)","""t=max(0,min(1,(q.z+.30)/.16));t=t*t*(3-2*t)
 front=max(0,min(1,(-direction.y-.10)/.50));front=front*front*(3-2*front)
 if gap>.020:q-=direction*((gap-.020)*.65*t*front)""")
(p/'anna-meshy-short-vest-v5/build.py').write_text(s,encoding='utf-8')
