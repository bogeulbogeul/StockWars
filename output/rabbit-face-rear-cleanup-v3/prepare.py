"""Assemble preserved frames for localized native edits and QA."""
from pathlib import Path
from PIL import Image,ImageDraw

root=Path(__file__).parent
src=root.parent/'rabbit-tail-occlusion-v2/rabbit/run/frames'
row=Image.new('RGBA',(960,400))
for i in range(3):row.paste(Image.open(src/f'up_walk/frame-{i}.png'),(320*i,0))
row.save(root/'edit-input/rear.png')
Image.open(src/'face_portrait/frame-0.png').save(root/'edit-input/portrait.png')
board=Image.new('RGB',(1200,600),'#eee9df');d=ImageDraw.Draw(board)
for j,(s,count) in enumerate([('down_walk',3),('right_carry',4),('right_walk',3),('down_sit',1)]):
    for i in range(count):
        a=Image.open(src/f'{s}/frame-{i}.png').convert('RGBA')
        face=a.crop((120,130,225,200))
        bg=Image.new('RGBA',face.size,'#eee9df');bg.alpha_composite(face)
        board.paste(bg.resize((210,140)),(i*240,j*150))
        d.text((i*240,j*150),f'{s}/{i}: x120..225,y130..200',fill='red')
board.save(root/'edit-input/nose-review.png')
