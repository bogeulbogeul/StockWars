// Assemble final full frames from native image edits. No bones, deformation or runtime layers.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = __dirname, run = path.join(root, 'dog/run');
const specs = {
 down_idle: [[164,137],[175,127],[180,122],[190,115],[200,110],[210,105],[220,99],[230,94],[240,91],[250,88],[260,88],[270,91],[276,110],[280,120]],
 right_idle: [[160,145],[180,138],[190,134],[200,130],[210,127],[220,123],[230,122],[240,120],[250,119],[260,118],[270,116],[280,121]],
 down_sit: [[164,134],[180,122],[190,116],[200,111],[210,106],[220,100],[230,99],[240,99],[250,104],[260,107],[270,102],[280,102]],
 right_sit: [[160,138],[180,130],[190,127],[200,122],[210,116],[220,111],[230,115],[240,117],[250,126],[260,121],[270,119],[280,120]],
 right_carry: [[169,140],[190,139],[200,138],[210,135],[220,128],[230,122],[240,122],[250,121],[260,116],[270,110],[280,108],[286,101]],
};
function line(points,y) {
 for(let i=1;i<points.length;i++) if(y<=points[i][0]){
  const [ay,ax]=points[i-1], [by,bx]=points[i];return ax+(bx-ax)*(y-ay)/(by-ay);
 } return points.at(-1)[1];
}
function anchor(data){
 let top=400,min=320,max=-1;
 for(let y=0;y<400;y++) for(let x=0;x<320;x++) if(data[(y*320+x)*4+3]>128){top=Math.min(top,y);}
 for(let y=top+30;y<Math.min(top+100,400);y++)for(let x=0;x<320;x++)if(data[(y*320+x)*4+3]>128){min=Math.min(min,x);max=Math.max(max,x);}
 return [(min+max)/2,top];
}
(async()=>{
 const jobs=[{source:'down_walk',state:'down_walk'}], report=[];
 for(const job of jobs){
  const srcpath=path.join(root,'../unified-v2/dog/run/frames',job.source,'frame-0.png');
  let src=await sharp(srcpath).ensureAlpha().raw().toBuffer();
  let a=anchor(src), points;
  for(const index of [0,2]){
   src=await sharp(srcpath.replace('frame-0.png',`frame-${index}.png`)).ensureAlpha().raw().toBuffer();a=anchor(src);
   points=index===0?[[163,137],[170,134],[180,118],[190,109],[200,100],[210,98],[220,96],[230,97],[240,99],[250,104],[260,123],[270,108],[280,123]]:[[163,137],[170,134],[180,121],[190,115],[200,109],[210,102],[220,95],[230,89],[240,85],[250,83],[260,85],[270,99]];

   const file=path.join(run,'frames',job.state,`frame-${index}.png`);
   const backup=path.join(run,'generated-frames',job.state,`frame-${index}.png`);
   fs.mkdirSync(path.dirname(backup),{recursive:true}); if(!fs.existsSync(backup))fs.copyFileSync(file,backup);
   const gen=await sharp(backup).ensureAlpha().raw().toBuffer(), b=anchor(gen);
   const dx=Math.round(a[0]-b[0]),dy=a[1]-b[1],out=Buffer.from(src),mask=new Uint8Array(320*400);let changes=0,locked=0;
   for(let y=0;y<400;y++)for(let x=0;x<320;x++){
    let tail=false;
    if(job.source==='up_idle') tail=y>=172&&y<310&&x>=100&&x<218;
    else if(y>=points[0][0]&&y<=points.at(-1)[0]){
     tail=x<line(points,y)-3;
     if(job.source.startsWith('down')){
      let right=0;for(let k=0;k<320;k++)if(src[(y*320+k)*4+3]>8)right=k;
      tail ||= x>right+3;
     }
    }
    const i=(y*320+x)*4;
    if(!tail){locked++;continue;}
    mask[y*320+x]=1;
    const gx=x-dx,gy=y-dy;
    if((index===2&&x<line(points,y)-3)||gx<0||gx>=320||gy<0||gy>=400)out.fill(0,i,i+4);
    else gen.copy(out,i,(gy*320+gx)*4,(gy*320+gx)*4+4);
    if(!out.subarray(i,i+4).equals(src.subarray(i,i+4)))changes++;
   }
   // Discard isolated extraction fragments in the editable tail region only.
   const seen=new Uint8Array(mask.length),groups=[];
   for(let p=0;p<mask.length;p++)if(mask[p]&&!seen[p]&&out[p*4+3]>8){
    const queue=[p];seen[p]=1;
    for(let k=0;k<queue.length;k++){
     const q=queue[k],x=q%320,y=Math.floor(q/320);
     for(const [nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(nx>=0&&nx<320&&ny>=0&&ny<400){const n=ny*320+nx;if(mask[n]&&!seen[n]&&out[n*4+3]>8){seen[n]=1;queue.push(n);}}
    }groups.push(queue);
   }
   groups.sort((a,b)=>b.length-a.length);
   for(const group of groups.slice(1))if(group.length<160)for(const p of group)out.fill(0,p*4,p*4+4);
   await sharp(out,{raw:{width:320,height:400,channels:4}}).png().toFile(file);
   report.push({state:job.state,index,translation:[dx,dy],changed_tail_pixels:changes,unchanged_body_pixels:locked,body_locked:true});
  }
 }
 fs.writeFileSync(path.join(run,'front-walk-tail-verification.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Locked approved body pixels in 12 generated full frames.');
})();
