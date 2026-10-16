// Preserve source rows while selecting only the native-edited foot/palm regions.
const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const here=__dirname,root=path.resolve(here,'../..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
function backup(file){const dest=path.join(here,'before',path.relative(root,file));fs.mkdirSync(path.dirname(dest),{recursive:true});if(!fs.existsSync(dest))fs.copyFileSync(file,dest);return dest;}
(async()=>{
 const assembly=read(path.join(here,'assembly.json'));
 for(const job of read(path.join(here,'jobs.json'))){
  const old=backup(job.path),meta=await sharp(old).metadata();
  const before=await sharp(old).ensureAlpha().raw().toBuffer();
  const native=await sharp(job.out).resize(meta.width,meta.height,{fit:'fill'}).ensureAlpha().raw().toBuffer();
  const output=Buffer.from(before);
  const regions=assembly.filter(a=>a.id===job.id&&a.state===job.state).map(a=>a.source_region);
  for(const[x0,y0,x1,y1]of regions)for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   const at=(y*meta.width+x)*4;native.copy(output,at,at,at+3);
  }
  await sharp(output,{raw:{width:meta.width,height:meta.height,channels:4}}).png().toFile(job.path);
 }
 const policy=' All animals: NO paw pads, NO toe beans, NO internal circular/oval sole or palm markings, NO emphasized sole plane. Raised feet remain smooth in the local fur color. Retain normal open finger division lines.';
 const runs=[...new Set(assembly.map(a=>a.run))];
 for(const run of runs){
  const reqFile=path.join(run,'sprite-request.json');backup(reqFile);const req=read(reqFile);
  if(!(req.style||'').includes('All animals: NO paw pads'))req.style=(req.style||'')+policy;
  req.paw_pad_policy={status:'forbidden',decided:'2026-10-16',source:'user request',preserve_finger_divisions:true};
  for(const state of Object.values(req.states)){if(state.action)state.action=state.action.replace('lifted heel may show sole','lifted feet have smooth fur, no sole plane or pad marks');}
  write(reqFile,req);
  const prompts=path.join(run,'prompts');if(fs.existsSync(prompts))for(const f of fs.readdirSync(prompts)){const p=path.join(prompts,f);if(!f.endsWith('.txt'))continue;backup(p);let text=fs.readFileSync(p,'utf8');text=text.replaceAll('lifted heel may show sole','lifted feet have smooth fur, no sole plane or pad marks');if(!text.includes('All animals: NO paw pads'))text+='\n'+policy+'\n';fs.writeFileSync(p,text);}
  const recipe=path.resolve(run,'../request.json');if(fs.existsSync(recipe)){backup(recipe);const r=read(recipe);if(!(r.style||'').includes('All animals: NO paw pads'))r.style=(r.style||'')+policy;r.paw_pad_policy=req.paw_pad_policy;write(recipe,r);}
 }
 console.log('Updated current raw rows and future prompt policy for',runs.length,'runs');
})();
