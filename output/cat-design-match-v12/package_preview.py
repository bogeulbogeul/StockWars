from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent
states=['down_walk','right_walk','up_walk','right_carry']
for state in states:
    order=[0,1,2,1] if state.endswith('walk') else [0,1,2,3]
    frames=[]
    for i in order:
        src=Image.open(ROOT/'frames'/state/f'frame-{i}.png').convert('RGBA')
        bg=Image.new('RGBA',src.size,'#c5c9ce')
        bg.alpha_composite(src)
        frames.append(bg.convert('RGB'))
    frames[0].save(ROOT/f'{state}.gif',save_all=True,append_images=frames[1:],duration=160,loop=0,disposal=2)
    check=Image.open(ROOT/f'{state}.gif')
    assert check.n_frames==4
    for i in range(4):
        check.seek(i)
        assert check.info['duration']==160
poses=[(s,i) for s in states for i in range(4 if s=='right_carry' else 3)]
poses += [('down_sit',0),('right_sit',0),('face_portrait',0)]
board=Image.new('RGB',(1024,1024),'#c5c9ce')
for j,(state,i) in enumerate(poses):
    frame=Image.open(ROOT/'frames'/state/f'frame-{i}.png').convert('RGBA').resize((256,256))
    board.paste(frame,((j%4)*256,(j//4)*256),frame)
board.save(ROOT/'overview.png')
print('16-pose overview and four 160ms loops verified')
