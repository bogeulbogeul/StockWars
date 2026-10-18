from pathlib import Path
P=Path(__file__).resolve().parent
source=(P.parent/'blank-buddy-walk-v1/validate_walk.py').read_text()
exec(compile(source,str(P/'validate_walk.py'),'exec'))
