const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve('.'),out=path.join(root,'output/somangi-reference-shape-v6');
const reports=JSON.parse(fs.readFileSync(path.join(out,'geometry-validation.json')));
const prior=fs.existsSync(path.join(out,'install-validation.json'))?JSON.parse(fs.readFileSync(path.join(out,'install-validation.json'))):[];
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),installed=[];
for(const r of reports){
 const relative='web/assets/characters/3d/somangi/'+r.file,source=path.join(out,r.file);
 for(const [index,target] of [path.join(root,relative),path.join(root,'electron-app/dist/win-unpacked/resources',relative)].entries()){
  if(!target.startsWith(root+path.sep))throw Error('Target outside workspace');
  const current=hash(target);if(current!==r.sourceHash&&current!==r.outputHash&&current!==prior.find(p=>p.file===r.file)?.sha256)throw Error('Source changed since build: '+target);
  if(current!==r.outputHash){try{fs.copyFileSync(source,target);}catch(error){const backup=path.join(out,`before-install-${index}-${r.file}`);if(fs.existsSync(backup))throw error;fs.renameSync(target,backup);fs.copyFileSync(source,target);}}
  if(hash(target)!==r.outputHash)throw Error('Install hash mismatch');
 }
 installed.push({file:r.file,sha256:r.outputHash,web:true,runtime:true});
}
fs.writeFileSync(path.join(out,'install-validation.json'),JSON.stringify(installed,null,2));
console.log('Installed and verified',installed.length,'Somangi model variants.');
