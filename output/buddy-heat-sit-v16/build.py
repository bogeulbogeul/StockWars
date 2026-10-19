from pathlib import Path
P=Path(__file__).resolve().parent
code=(P.parent/'buddy-sit-v13/build.py').read_text(encoding='utf-8')
code=code.replace("buddy-walk-connections-v11/buddy-soft-connections.blend","buddy-walk-heat-v15/buddy-walk-heat.blend")
start=code.index('def smooth(')
end=code.index('def rot(',start)
code=code[:start]+code[end:]
code=code.replace("'source':'buddy-walk-connections-v11'","'source':'buddy-walk-heat-v15'")
exec(compile(code,str(P/'generated-build.py'),'exec'))
