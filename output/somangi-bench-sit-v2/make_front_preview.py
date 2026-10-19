from pathlib import Path
P=Path(__file__).resolve().parent
source=(P.parent/'somangi-bench-sit-v1/make_side_preview.py').read_text()
source=source.replace("'side-frames'","'front-frames'").replace("'bench-sit-side.gif'","'bench-sit-front.gif'")
source=source.replace('(480*6,600*6)','(640*6,600*6)').replace('(i%6)*480','(i%6)*640')
exec(compile(source,str(P/'make_front_preview.py'),'exec'))
