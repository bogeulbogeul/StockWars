"""Reduce room footprint while preserving furniture, doorway and trim sizes."""
from pathlib import Path
root=Path('C:/GitHub/StockWars')
source=(root/'scratch/build-cipher-cozy-shell.py').read_text()
changes={
    'cipher-cozy-room-v1':'cipher-cozy-room-compact-v2',
    '(10,7.6,.14)':'(9,6.08,.14)',
    '(10.28,.16,3)':'(9.28,.16,3)', '(0,3.88,1.5)':'(0,3.12,1.5)',
    '(.16,7.6,3)':'(.16,6.08,3)', 'side*5.08':'side*4.58',
    '[(-3.8,-1.79),(-.21,3.8)]':'[(-3.04,-1.79),(-.21,3.04)]',
    'side*4.95':'side*4.45', 'side*4.83,3.63':'side*4.33,2.87',
    '(.20,7.6,.16)':'(.20,6.08,.16)', 'side*4.98':'side*4.48',
    '(10,.12,.24),(0,3.74,.12)':'(9,.12,.24),(0,2.98,.12)',
    '(10,.24,.17),(0,3.76,2.92)':'(9,.24,.17),(0,3,2.92)',
    '(9.75,.13,.065),(0,3.72,2.80)':'(8.75,.13,.065),(0,2.96,2.80)',
    '(.004,7.54,.002)':'(.004,6.02,.002)',
    '[-2.8,-.8,1.2,3.2]':'[-2,-0,2]', '(9.94,.004,.002)':'(8.94,.004,.002)',
    '(x,3.68,2.04)':'(x,2.92,2.04)', '(x,3.56,2.20)':'(x,2.80,2.20)',
    '(x,3.37,2.2)':'(x,2.61,2.2)'
}
for old,new in changes.items():
    assert old in source,old
    source=source.replace(old,new)
exec(compile(source,str(root/'scratch/build-cipher-cozy-shell.py'),'exec'))
