from pathlib import Path
p=Path('C:/GitHub/StockWars/output')
s=(p/'anna-motion-v2/build.py').read_text(encoding='utf-8-sig')
s=s.replace('abs(x)>.30 and -.36<z<-.025','abs(x)>.255 and -.36<z<-.025').replace('smooth(.30,.39,abs(x))','smooth(.255,.43,abs(x))')
s=s.replace("mod.object=rig;o.parent=rig","mod.object=rig;mod.use_deform_preserve_volume=True;o.parent=rig")
(p/'anna-motion-v3/build.py').write_text(s,encoding='utf-8')
