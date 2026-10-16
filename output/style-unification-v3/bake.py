"""Author a shared per-character reference palette, bake with sprite-gen recolor.
Native image edits own drawing changes. This stage ONLY normalizes RGB to the
approved front-idle palette and preserves extracted geometry and alpha exactly.
"""
import json,subprocess,sys,shutil
import numpy as np
from PIL import Image,ImageDraw
from prepare import HERE,IDS
from process import write

def lab(rgb):
 x=rgb.astype(np.float32)/255
 x=np.where(x<=.04045,x/12.92,((x+.055)/1.055)**2.4)
 xyz=x@np.array([[.4124564,.2126729,.0193339],[.3575761,.7151522,.1191920],[.1804375,.0721750,.9503041]])
 xyz/=np.array([.95047,1,1.08883]);f=np.where(xyz>.008856,xyz**(1/3),7.787*xyz+16/116)
 return np.stack([116*f[...,1]-16,500*(f[...,0]-f[...,1]),200*(f[...,1]-f[...,2])],-1)
def main():
 for cid in sys.argv[1:] or IDS:
  run=HERE/cid/'run';source=run/'sprite-sheet-alpha.png'
  if not (run/'native-before-palette.png').exists():shutil.copy2(source,run/'native-before-palette.png')
  ref=np.array(Image.open(HERE/cid/'identity.png').convert('RGBA'));pixels=ref[ref[...,3]>240,:3]
  refcolors,refcounts=np.unique(pixels,axis=0,return_counts=True)
  palette=refcolors[np.argsort(-refcounts,kind='stable')[:512]]
  native=Image.open(run/'native-before-palette.png').convert('RGBA')
  original=np.array(native)
  # Keep the native drawing's continuous RGB/AA. A rejected reduced-color
  # experiment lost rare eye whites and introduced grain. Match only the 64
  # dominant opaque colors to nearby approved reference anchors (DeltaE<=8).
  # All other RGBs, including rare eye colors and AA blends, pass through.
  native.save(source)
  data=np.array(native);allcolors,counts=np.unique(data[data[...,3]>240,:3],axis=0,return_counts=True)
  colors=allcolors[np.argsort(-counts,kind='stable')[:64]]
  distances=((lab(colors)[:,None,:]-lab(palette)[None,:,:])**2).sum(-1)
  nearest=distances.argmin(-1);targets=palette[nearest];keep=distances.min(-1)<=64
  colors=colors[keep];targets=targets[keep]
  hx=lambda v:'#'+''.join(f'{int(c):02x}' for c in v)
  mapping={hx(a):hx(b) for a,b in zip(colors,targets)}
  spec={'version':1,'kind':'sprite-gen-recolor','match':'exact','tolerance':0,'variants':[{'name':'unified','map':mapping}]}
  write(run/'recolor.spec.json',spec)
  write(run/'reference-palette.json',{'source':'../identity.png (approved front idle)','colors':[hx(p) for p in palette],'mode':'reference color anchors; NOT a forced limited palette','quantization':'none; native continuous RGB and antialiasing preserved','mapping':'dominant colors only, nearest CIELab reference color within DeltaE 8; unmatched RGBs explicitly retained by canonical report'})
  p=subprocess.run([sys.executable,'-m','sprite_gen.cli','recolor','--run-dir',str(run),'--spec',str(run/'recolor.spec.json')],capture_output=True,text=True,encoding='utf-8')
  (run/'recolor.log').write_text(p.stdout+'\n'+p.stderr,encoding='utf-8')
  if p.returncode:raise RuntimeError(p.stdout+p.stderr)
  corrected=Image.open(run/'variants/unified.png').convert('RGBA')
  assert np.array_equal(original[...,3],np.array(corrected)[...,3])
  corrected.save(source)
  m=json.loads((run/'manifest.json').read_text())
  for state,rects in m['frame_layout']['rows'].items():
   for i,r in enumerate(rects):corrected.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])).save(run/f'frames/{state}/frame-{i}.png')
  board=Image.new('RGB',(480,80));d=ImageDraw.Draw(board)
  for i,color in enumerate(palette[:48]):d.rectangle((i%24*20,i//24*40,i%24*20+19,i//24*40+39),fill=tuple(map(int,color)))
  board.save(run/'palette.png')
  print(cid,'native drawing + gentle reference-color bake;',len(colors),'anchors; no quantization',flush=True)
if __name__=='__main__':main()
