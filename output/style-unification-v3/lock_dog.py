"""Bake corrected native tails onto identical corrected held bodies.

Uses the already accepted tail/body boundaries, translated by head registration.
No new drawing or runtime layer; full frames saved. Original native candidates
are retained separately so this assembly can be reviewed and reproduced.
"""
import json,shutil
import numpy as np
from PIL import Image
from prepare import HERE
from process import write,atlas

SPECS={
 'down_idle':[[164,137],[175,127],[180,122],[190,115],[200,110],[210,105],[220,99],[230,94],[240,91],[250,88],[260,88],[270,91],[276,110],[280,120]],
 'right_idle':[[160,145],[180,138],[190,134],[200,130],[210,127],[220,123],[230,122],[240,120],[250,119],[260,118],[270,116],[280,121]],
 'down_sit':[[164,134],[180,122],[190,116],[200,111],[210,106],[220,100],[230,99],[240,99],[250,104],[260,107],[270,102],[280,102]],
 'right_sit':[[160,138],[180,130],[190,127],[200,122],[210,116],[220,111],[230,115],[240,117],[250,126],[260,121],[270,119],[280,120]],
 'right_carry':[[169,140],[190,139],[200,138],[210,135],[220,128],[230,122],[240,122],[250,121],[260,116],[270,110],[280,108],[286,101]]}
def anchor(a):
 ys,xs=np.where(a[...,3]>128);top=ys.min()
 yy,xx=np.where(a[top+30:top+100,:,3]>128)
 return np.array([(xx.min()+xx.max())/2,top])
def main():
 run=HERE/'dog/run';report=[]
 for s in ['down_idle','right_idle','up_idle','down_sit','right_sit','right_carry']:
  base=np.array(Image.open(run/f'frames/{s}/frame-0.png').convert('RGBA'))
  old=np.array(Image.open(HERE/f'dog/before/frames/{s}/frame-0.png').convert('RGBA'))
  a=anchor(base);shift=np.round(a-anchor(old)).astype(int)
  yy,xx=np.indices((400,320));oy=yy-shift[1];ox=xx-shift[0]
  if s=='up_idle':mask=(oy>=172)&(oy<310)&(ox>=100)&(ox<218)
  else:
   points=np.array(SPECS[s]);boundary=np.interp(oy,points[:,0],points[:,1])
   mask=(oy>=points[0,0])&(oy<=points[-1,0])&(ox<boundary-3)
   if s.startswith('down'):
    right=np.max(np.where(base[...,3]>8,xx,0),axis=1)
    mask|=(oy>=points[0,0])&(oy<=points[-1,0])&(xx>right[:,None]+3)
  Image.fromarray((mask*255).astype('uint8')).save(run/f'{s}-tail-mask.png')
  for i in [0,2]:
   p=run/f'frames/{s}_wag/frame-{i}.png';candidate=np.array(Image.open(p).convert('RGBA'))
   outdir=run/'native-wag-candidates'/f'{s}_wag';outdir.mkdir(parents=True,exist_ok=True);shutil.copy2(p,outdir/p.name)
   delta=np.round(a-anchor(candidate)).astype(int)
   sx=xx-delta[0];sy=yy-delta[1];valid=(sx>=0)&(sx<320)&(sy>=0)&(sy<400)
   aligned=np.zeros_like(base);aligned[valid]=candidate[sy[valid],sx[valid]]
   out=base.copy();out[mask]=aligned[mask]
   Image.fromarray(out).save(p)
   assert np.array_equal(out[~mask],base[~mask])
   report.append({'state':s+'_wag','index':i,'body_byte_identical':True,'tail_changed_pixels':int(np.any(out!=base,axis=2).sum()),'native_translation':delta.tolist(),'mask':f'{s}-tail-mask.png'})
  shutil.copy2(run/f'frames/{s}/frame-0.png',run/f'frames/{s}_wag/frame-1.png')
 write(run/'body-lock-verification.json',report);atlas('dog')
 print('Locked 12 tail extremes to corrected held bodies.')
if __name__=='__main__':main()
