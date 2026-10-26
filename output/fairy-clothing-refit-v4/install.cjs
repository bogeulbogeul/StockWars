const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve('.'),out=path.join(root,'output/fairy-clothing-refit-v4');
const manifest=JSON.parse(fs.readFileSync('output/fairy-body-narrow-v1/validation.json')).filter(e => ['moa-bench-sit.glb','moa-bench-doze.glb','tori.glb','information-room.glb','bongbong.glb'].includes(e.output));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rows=[];
for(const e of manifest){
 const relative=e.output==='bongbong.glb'?'web/assets/characters/3d/bongbong/Bongbong.glb':e.source;
 const source=path.join(out,e.output),targets=[path.join(root,relative),path.join(root,'electron-app/dist/win-unpacked/resources',relative)];
 const expected=sha(source);
 for(let i=0;i<targets.length;i++){
  const target=targets[i];if(!target.startsWith(root+path.sep))throw Error('Target outside workspace');
  try{fs.copyFileSync(source,target);}catch(error){
   // Windows may memory-map an existing GLB. Retain it at an explicit backup path.
   const backup=path.join(out,`before-install-${i}-${e.output}`);
   if(!backup.startsWith(root+path.sep)||fs.existsSync(backup))throw error;
   fs.renameSync(target,backup);fs.copyFileSync(source,target);
  }
  if(sha(target)!==expected)throw Error('Install hash mismatch');
 }
 rows.push({file:e.output,target:relative,sha256:expected,web:true,runtime:true});
}
fs.writeFileSync(path.join(out,'install-validation.json'),JSON.stringify(rows,null,2));
console.log('Installed and hash verified 5 clothing GLBs in web and runtime.');

