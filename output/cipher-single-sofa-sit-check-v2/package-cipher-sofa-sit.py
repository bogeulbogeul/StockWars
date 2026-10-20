from pathlib import Path
from PIL import Image
import os
out=Path('C:/GitHub/StockWars/output')/os.environ.get('CIPHER_SOFA_CHECK_OUTPUT','cipher-single-sofa-sit-check-v1')
frames=[Image.open(out/f'motion-{f:03}.png').convert('RGB') for f in range(1,74,2)]
palette=Image.new('RGB',(440,440*len(frames)))
for i,frame in enumerate(frames):palette.paste(frame,(0,i*440))
palette=palette.quantize(colors=128)
images=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
images[0].save(out/'sofa-sit-motion.gif',save_all=True,append_images=images[1:],duration=85,loop=0)
