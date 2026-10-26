from pathlib import Path
p=Path('web/js/components/store3d/VivianProductDisplay.js');s=p.read_text();a=s.index('const id =');b=s.index('export async function');data=s[a:b];Path('web/js/data/vivianProductPlacements.js').write_text(data,encoding='utf-8');s=s[:a]+"import { VIVIAN_PRODUCT_PLACEMENTS } from '../../data/vivianProductPlacements.js';\n\n"+s[b:];p.write_text(s,encoding='utf-8')
