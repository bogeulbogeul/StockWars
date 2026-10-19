"""Coordinate review board for local alpha compositing boundaries."""
from pathlib import Path
from PIL import Image, ImageDraw

root=Path(__file__).parent
items=[('down_walk',i) for i in range(3)]+[('right_walk',i) for i in range(3)]
items += [('right_carry',i) for i in range(4)]+[('right_sit',0)]
board=Image.new('RGB',(4*340,3*390),'#eee9df')
d=ImageDraw.Draw(board)
for n,(s,i) in enumerate(items):
    box=(195,200,280,290) if s=='down_walk' and i==2 else (60,200,145,290)
    fr=Image.open(root/f'rabbit/run/frames/{s}/frame-{i}.png').convert('RGBA')
    bg=Image.new('RGBA',(85,90),'#bbbbbb');bg.alpha_composite(fr.crop(box))
    x=(n%4)*340;y=(n//4)*390
    board.paste(bg.resize((340,360)),(x,y+30))
    d.text((x+5,y+3),f'{s}/{i} box={box}',fill='black')
    for xx in range(0,85,10):
        d.line((x+xx*4,y+30,x+xx*4,y+389),fill='#808080',width=1)
        d.text((x+xx*4+2,y+32),str(box[0]+xx),fill='red')
    for yy in range(0,90,10):
        d.line((x,y+30+yy*4,x+339,y+30+yy*4),fill='#808080',width=1)
        d.text((x+2,y+30+yy*4+12),str(box[1]+yy),fill='red')
board.save(root/'tail-region-coordinates.png')
