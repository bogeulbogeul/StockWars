from pathlib import Path
from PIL import Image
root=Path(__file__).parent
board=Image.new('RGBA',(960,400),(0,255,255,255))
for i in range(3):
    board.alpha_composite(Image.open(root/f'red-fox/run/frames/up_walk/frame-{i}.png').convert('RGBA'),(320*i,0))
board.convert('RGB').save(root/'raw/up_walk-reference.png')
