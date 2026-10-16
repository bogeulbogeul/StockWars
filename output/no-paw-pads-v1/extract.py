"""Canonical chroma/component extraction of AI-edited rows for region assembly.

No fur or markings are painted here. Corrected pixels come from image_gen.
Only affected generated foot/palm regions are selected during final assembly.
"""
import json
from pathlib import Path
from PIL import Image
from sprite_gen.frames.extract import remove_chroma_background, connected_components, resize_cell

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
BOXES={
 'red-fox':{0:[205,568,316,692],2:[1595,558,1725,696]},
 'siberian-chipmunk':{0:[330,600,433,703],2:[1494,598,1608,706]},
 'raccoon-dog':{0:[208,580,318,697],2:[1600,577,1720,700]},
 'european-badger':{0:[211,575,323,697],2:[1600,573,1725,700]},
 'brown-bear':{0:[209,578,321,698],2:[1598,576,1728,700]},
 'european-rabbit':{0:[239,589,351,709],2:[1590,594,1712,716]},
 'dog':{0:[231,570,342,692],2:[1595,569,1730,695]},
 'cat':{0:[326,571,439,687],2:[1437,562,1567,687]}
}

def targets(cid):
 if cid=='dog':return [ROOT/'output/npc-style-animals/tail-wag-v1/dog/run',ROOT/'output/npc-style-animals/unified-v2/dog/run']
 if cid=='cat':return [ROOT/'output/npc-style-animals/unified-v2/cat/run']
 return [ROOT/'output/forest-friends/sprites-v1'/cid/'run']

def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def main():
 jobs=json.loads((HERE/'jobs.json').read_text(encoding='utf-8'))
 assembly=[]
 for job in jobs:
  cid,state=job['id'],job['state']
  original=Image.open(job['path']).convert('RGBA')
  edited=Image.open(job['out']).convert('RGBA')
  if original.size!=edited.size:
   assert abs(original.width-edited.width)<=8 and abs(original.height-edited.height)<=8,(cid,state,original.size,edited.size)
   # Native edits can return a two-pixel canvas-size difference. Register the
   # edited row to its original canvas before selecting generated regions.
   edited=edited.resize(original.size,Image.Resampling.LANCZOS)
  orig_alpha=remove_chroma_background(original,(0,255,255),96,180,18)
  edit_alpha=remove_chroma_background(edited,(0,255,255),96,180,18)
  components=sorted(sorted(connected_components(orig_alpha),key=lambda c:c['area'],reverse=True)[:3],key=lambda c:c['center_x'])
  assert len(components)==3
  boxes={0:[432,447,544,552]} if state=='right_walk' else BOXES[cid]
  for run in targets(cid):
   for index,raw_box in boxes.items():
    original_frame=Image.open(run/f'frames/{state}/frame-{index}.png').convert('RGBA')
    dest=original_frame.getbbox()
    src=components[index]['bbox']
    candidate=resize_cell(edit_alpha.crop(src),(dest[2]-dest[0],dest[3]-dest[1]))
    canvas=Image.new('RGBA',(320,400))
    canvas.alpha_composite(candidate,dest[:2])
    token=run.parent.name+'-'+cid+'-'+state+'-'+str(index)
    filename=HERE/'candidates'/(token+'.png')
    filename.parent.mkdir(parents=True,exist_ok=True)
    canvas.save(filename)
    sx=(dest[2]-dest[0])/(src[2]-src[0]);sy=(dest[3]-dest[1])/(src[3]-src[1])
    rect=[max(0,int(dest[0]+(raw_box[0]-src[0])*sx)-2),max(0,int(dest[1]+(raw_box[1]-src[1])*sy)-2),min(320,int(dest[0]+(raw_box[2]-src[0])*sx)+3),min(400,int(dest[1]+(raw_box[3]-src[1])*sy)+3)]
    assembly.append({'id':cid,'state':state,'index':index,'run':str(run),'candidate':str(filename),'region':rect,'source_component_bbox':src,'source_region':raw_box})
  print(cid,state,'extracted',flush=True)
 write(HERE/'assembly.json',assembly)

if __name__=='__main__':main()
