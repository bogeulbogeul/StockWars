from pathlib import Path
P=Path(__file__).resolve().parent
source=(P.parent/'somangi-bench-sit-v1/make_side_preview.py').read_text()
exec(compile(source,str(P/'make_preview.py'),'exec'))
