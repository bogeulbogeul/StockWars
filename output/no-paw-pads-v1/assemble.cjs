// Assemble image_gen-edited regions only; no programmatic painting or recoloring.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const here=__dirname,root=path.resolve(here,'../..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function backup(file){const rel=path.relative(root,file),dest=path.join(here,'before',rel);fs.mkdirSync(path.dirname(dest),{recursive:true});if(!fs.existsSync(dest))fs.copyFileSync(file,dest);return dest;}
(async()=>{
const jobs=read(path.join(here,'assembly.json')),runs=new Map(),checks=[];
for(const j of jobs){
 const file=path.join(j.run,'frames',j.state,`frame-${j.index}.png`);const beforeFile=backup(file);
 const before=await sharp(beforeFile).ensureAlpha().raw().toBuffer();
 const generated=await sharp(j.candidate).ensureAlpha().raw().toBuffer();
 const output=Buffer.from(before),[x0,y0,x1,y1]=j.region;
 let changed=0;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
  const at=(y*320+x)*4;if(before[at+3]<240||generated[at+3]<240)continue;
  // Keep the original outer contour and exact alpha, including the AA ramp.
  let interior=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(before[((y+dy)*320+x+dx)*4+3]<240)interior=false;
  if(!interior)continue;
  for(let c=0;c<3;c++)output[at+c]=generated[at+c];
 }
 for(let y=0;y<400;y++)for(let x=0;x<320;x++){
  const at=(y*320+x)*4;const diff=!before.subarray(at,at+4).equals(output.subarray(at,at+4));
  if(diff){if(x<x0||x>=x1||y<y0||y>=y1)throw Error('Changed outside selected generated region');changed++;}
  if(output[at+3]!==before[at+3])throw Error('Alpha changed');
 }
 if(!changed)throw Error('No edited pixels '+j.id+'/'+j.state+'/'+j.index);
 await sharp(output,{raw:{width:320,height:400,channels:4}}).png().toFile(file);
 if(!runs.has(j.run))runs.set(j.run,[]);runs.get(j.run).push({...j,file});
 checks.push({...j,changedPixels:changed,unchangedOutsideRegion:true,alphaIdentical:true,beforeSha256:hash(before),afterSha256:hash(output)});
}
for(const[run,changes]of runs){
 const manifestPath=path.join(run,'manifest.json'),manifest=read(manifestPath);
 const atlasPath=path.join(run,'sprite-sheet-alpha.png');const oldAtlas=backup(atlasPath);
 const meta=await sharp(oldAtlas).metadata();const pixels=await sharp(oldAtlas).ensureAlpha().raw().toBuffer();
 for(const j of changes){const rect=manifest.frame_layout.rows[j.state][j.index],frame=await sharp(j.file).ensureAlpha().raw().toBuffer();for(let y=0;y<400;y++)frame.copy(pixels,((rect.y+y)*meta.width+rect.x)*4,y*320*4,(y+1)*320*4);}
 await sharp(pixels,{raw:{width:meta.width,height:meta.height,channels:4}}).png().toFile(atlasPath);
 // Coordinates and animation metadata intentionally remain byte-identical.
 write(path.join(run,'no-paw-pads-verification.json'),{method:'native image_gen edit; canonical chroma/component extraction; selected generated region assembly',frameLayoutUnchanged:true,animationMetadataUnchanged:true,checks:checks.filter(c=>c.run===run)});
 if(run.includes('tail-wag-v1')||run.includes('unified-v2')&&run.includes('cat')){
  const id=run.includes('tail-wag-v1')?'dog-npc-v2':'black-cat-npc-v2';const asset=path.join(root,'web/assets/characters',id,'atlas.png');backup(asset);fs.copyFileSync(atlasPath,asset);
 }
 console.log(path.relative(root,run),'assembled',changes.length,'frames');
}
write(path.join(here,'verification.json'),{ok:true,checks,allAlphaPreserved:true,allPixelsOutsideEditedRegionsPreserved:true});
})();
