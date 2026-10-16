import json,subprocess,sys
from PIL import Image,ImageDraw,ImageFont
from prepare import HERE,ROOT,IDS,NAMES,runpath
from process import write

def main():
 results=[]
 for cid in IDS:
  run=HERE/cid/'run'
  p=subprocess.run([sys.executable,'-m','sprite_gen.cli','inspect','--run-dir',str(run)],capture_output=True,text=True,encoding='utf-8')
  (run/'inspect.log').write_text(p.stdout+'\n'+p.stderr,encoding='utf-8')
  report=json.loads((run/'sprite-inspect.report.json').read_text())
  assert p.returncode==0 and report['ok'],(cid,p.stdout,p.stderr)
  results.append({'animal':cid,'ok':True,'warnings':report.get('warnings',[])})
  print(cid,'inspect passed',flush=True)
 states=['down_idle_wag','right_idle_wag','up_idle_wag','down_sit_wag','right_sit_wag','right_carry_wag']
 board=Image.new('RGBA',(720,1800),(233,227,214,255))
 for y,s in enumerate(states):
  for x in range(3):board.alpha_composite(Image.open(HERE/f'dog/run/frames/{s}/frame-{x}.png').convert('RGBA').resize((240,300),Image.Resampling.LANCZOS),(x*240,y*300))
 board.convert('RGB').save(HERE/'dog/tail-review.png')
 # Rear lifted feet, enlarged for the no-pad review.
 board=Image.new('RGB',(1280,640),'#e9e3d6');d=ImageDraw.Draw(board)
 font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',18)
 for j,(cid,name) in enumerate(zip(IDS,NAMES)):
  x=(j%4)*320;y=(j//4)*320;d.text((x+8,y+8),name,font=font,fill='#332c24')
  for k,i in enumerate([0,2]):
   im=Image.open(HERE/cid/f'run/frames/up_walk/frame-{i}.png').convert('RGBA')
   crop=im.crop((60,275,260,385)).resize((280,154),Image.Resampling.LANCZOS)
   board.paste(crop,(x+20,y+36+k*132),crop)
 board.save(HERE/'feet-review.png')
 write(HERE/'inspect-summary.json',{'ok':True,'animals':results,'note':'Static state warnings are expected. Dog rear tail motion is deliberately small and separately has body-lock/changed-tail verification. In-game contact QA is separate.'})
if __name__=='__main__':main()
