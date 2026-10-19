from pathlib import Path
from PIL import Image
root=Path(__file__).parent
frame=Image.open(root/'red-fox/run/frames/up_walk/frame-1.png').convert('RGBA')
board=Image.new('RGBA',(960,400),(0,255,255,255))
for i in range(3): board.alpha_composite(frame,(i*320,0))
board.convert('RGB').save(root/'raw/neutral-triplet.png')
