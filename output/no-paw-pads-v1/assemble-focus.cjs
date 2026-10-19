// Select the clearer native close-up edits into their original source-row regions.
const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const here=__dirname;
(async()=>{
 const fox=path.join(here,'generated/red-fox-right_walk.png');
 const foxBase=await sharp(fox).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const foxPatch=await sharp(path.join(here,'focus/fox-palm-edited.png')).resize(112,105,{fit:'fill'}).ensureAlpha().raw().toBuffer();
 for(let y=0;y<105;y++)for(let x=0;x<112;x++){const s=(y*112+x)*4,d=((447+y)*foxBase.info.width+432+x)*4;for(let c=0;c<3;c++)foxBase.data[d+c]=foxPatch[s+c];}
 await sharp(foxBase.data,{raw:foxBase.info}).png().toFile(fox);
 const cat=path.join(here,'generated/cat-up_walk.png');
 const catBase=await sharp(cat).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const patch=await sharp(path.join(here,'focus/cat-foot-edited.png')).resize(113,116,{fit:'fill'}).ensureAlpha().raw().toBuffer();
 for(let y=0;y<116;y++)for(let x=0;x<113;x++){const s=(y*113+x)*4,d=((571+y)*catBase.info.width+326+x)*4;for(let c=0;c<3;c++)catBase.data[d+c]=patch[s+c];}
 const crop=await sharp(patch,{raw:{width:113,height:116,channels:4}}).extract({left:16,top:38,width:76,height:54}).flop().resize(85,62,{fit:'fill'}).raw().toBuffer();
 for(let y=0;y<62;y++)for(let x=0;x<85;x++){const s=(y*85+x)*4,d=((600+y)*catBase.info.width+1454+x)*4;for(let c=0;c<3;c++)catBase.data[d+c]=crop[s+c];}
 await sharp(catBase.data,{raw:catBase.info}).png().toFile(cat);
 console.log('Close-up native edits assembled into two source rows');
})();
