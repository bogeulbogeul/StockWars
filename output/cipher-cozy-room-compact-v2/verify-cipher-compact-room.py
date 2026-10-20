from pathlib import Path
root=Path('C:/GitHub/StockWars')
source=(root/'scratch/verify-cipher-cozy-shell.py').read_text()
source=source.replace('cipher-cozy-room-v1','cipher-cozy-room-compact-v2').replace('wall[1].x)-5','wall[1].x)-4.5')
exec(compile(source,str(root/'scratch/verify-cipher-cozy-shell.py'),'exec'))
