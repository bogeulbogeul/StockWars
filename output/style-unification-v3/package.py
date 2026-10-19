import json,zipfile
from PIL import Image,ImageDraw,ImageFont
from prepare import HERE,IDS,NAMES
from process import write

def main():
 board=Image.new('RGB',(1600,920),'#eee8dc');d=ImageDraw.Draw(board)
 font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',22);small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',15)
 states=[('down_walk','정면 걷기'),('right_walk','사선 걷기'),('up_walk','뒤 걷기'),('right_carry','운반'),('down_sit','앉기'),('face_portrait','얼굴')]
 for j,(cid,name) in enumerate(zip(IDS,NAMES)):
  x=(j%4)*400;y=(j//4)*460;d.text((x+15,y+10),name,font=font,fill='#332c24')
  for k,(s,label) in enumerate(states):
   im=Image.open(HERE/cid/f'run/frames/{s}/frame-{1 if s.endswith("_walk") else 0}.png').convert('RGBA').resize((120,150),Image.Resampling.LANCZOS)
   xx=x+10+(k%3)*130;yy=y+55+(k//3)*195;board.paste(im,(xx,yy),im);d.text((xx,yy+153),label,font=small,fill='#61584b')
 board.save(HERE/'overview.png')
 archive=HERE/'all-animals-style-unified.zip'
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
  for cid in IDS:
   run=HERE/cid/'run'
   for name in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json','verification.json','placement.json']:
    z.write(run/name,f'{cid}/run/{name}')
   for p in (run/'frames').rglob('*.png'):z.write(p,f'{cid}/run/'+p.relative_to(run).as_posix())
   for p in (run/'qa').glob('*.gif'):z.write(p,f'{cid}/run/qa/{p.name}')
   for name in ['identity.png','review-final.png']:z.write(HERE/cid/name,f'{cid}/{name}')
   if cid=='dog':z.write(run/'body-lock-verification.json','dog/run/body-lock-verification.json')
  for name in ['README.md','preview.html','comparison.png','overview.png','verification.json','preview-verification.json','generation.json','inspect-summary.json','installation.json']:z.write(HERE/name,name)
 with zipfile.ZipFile(archive) as z:assert z.testzip() is None
 write(HERE/'package-verification.json',{'ok':True,'zip_crc':'pass','bytes':archive.stat().st_size,'animals':8})
 print('Packaged all 8 sheets, frames, manifests, GIFs and comparison preview:',archive.name,archive.stat().st_size,'bytes')
if __name__=='__main__':main()
