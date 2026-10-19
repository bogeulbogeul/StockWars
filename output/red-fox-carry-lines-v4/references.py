from pathlib import Path
from PIL import Image
root=Path(__file__).parent
for state,count in [('right_carry',4),('right_walk',3)]:
    board=Image.new('RGBA',(320*count,400),(0,255,255,255))
    for i in range(count):
        board.alpha_composite(Image.open(root/f'red-fox/run/frames/{state}/frame-{i}.png').convert('RGBA'),(320*i,0))
    board.convert('RGB').save(root/f'raw/{state}-reference.png')
