from pathlib import Path
P=Path(__file__).resolve().parent
code=(P.parent/'buddy-carry-pose-v30/build.py').read_text(encoding='utf-8')
code=code.replace('math.radians(-18)','math.radians(-48)')
code=code.replace('(0,-.32,-.43)','(0,-.49,-.38)')
code=code.replace('(.84,.40,.40)','(.84,.28,.32)')
code=code.replace('(0,-.32,-.227)','(0,-.49,-.217)')
code=code.replace('(.10,.405,.004)','(.10,.285,.004)')
exec(compile(code,str(P/'generated-build.py'),'exec'))
