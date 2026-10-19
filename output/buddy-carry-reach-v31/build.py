from pathlib import Path
P=Path(__file__).resolve().parent
code=(P.parent/'buddy-carry-pose-v30/build.py').read_text(encoding='utf-8')
code=code.replace('math.radians(-18)','math.radians(-40)')
exec(compile(code,str(P/'generated-build.py'),'exec'))
