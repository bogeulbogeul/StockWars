from pathlib import Path
P=Path(__file__).resolve().parent
source=(P.parent/'blank-buddy-walk-v2/make_previews.py').read_text()
exec(compile(source,str(P/'make_previews.py'),'exec'))
