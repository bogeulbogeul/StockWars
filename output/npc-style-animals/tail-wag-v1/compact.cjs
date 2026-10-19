// Lossless atlas packing: remove duplicate neutral drawings and reuse existing cells.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=__dirname,run=path.join(root,'dog/run');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
(async()=>{
 const manifest=read(path.join(run,'manifest.json')), rows={}, layers=[],placed=new Map();
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 async function put(state,index,col,row){
  const file=path.join(run,'frames',state,`frame-${index}.png`),raw=await sharp(file).ensureAlpha().raw().toBuffer(),key=hash(raw);
  const rect={x:col*320,y:row*400,w:320,h:400};
  layers.push({raw,rect});placed.set(key,rect);return rect;
 }
 // One motion per row. Carry variants stay together in a six-cell carry row.
 for(const [direction,idleRow,walkRow]of [['down',0,1],['right',2,3],['up',4,5]]){
  const walk=direction+'_walk',idle=direction+'_idle',wag=idle+'_wag';
  rows[walk]=[];for(let i=0;i<3;i++)rows[walk].push(await put(walk,i,i,walkRow));
  rows[idle]=[rows[walk][1]];
  rows[wag]=[await put(wag,0,0,idleRow),await put(wag,1,1,idleRow),await put(wag,2,2,idleRow)];
 }
 rows.right_carry=[];for(let i=0;i<4;i++)rows.right_carry.push(await put('right_carry',i,i,6));
 for(const [state,row]of [['down_sit',7],['right_sit',8]]){
  rows[state]=[await put(state,0,0,row)];
  rows[state+'_wag']=[await put(state+'_wag',0,1,row),rows[state][0],await put(state+'_wag',2,2,row)];
 }
 rows.right_carry_wag=[await put('right_carry_wag',0,4,6),rows.right_carry[0],await put('right_carry_wag',2,5,6)];
 rows.face_portrait=[await put('face_portrait',0,0,9)];
 const width=1920,atlas=Buffer.alloc(width*4000*4);
 for(const {raw,rect}of layers)for(let y=0;y<400;y++)raw.copy(atlas,((rect.y+y)*width+rect.x)*4,y*320*4,(y+1)*320*4);
 const png=await sharp(atlas,{raw:{width,height:4000,channels:4}}).png().toBuffer();
 const checks=[];
 for(const [state,rects]of Object.entries(rows))for(let i=0;i<rects.length;i++){
  const r=rects[i],actual=await sharp(png).extract({left:r.x,top:r.y,width:r.w,height:r.h}).raw().toBuffer();
  const expected=await sharp(path.join(run,'frames',state,`frame-${i}.png`)).ensureAlpha().raw().toBuffer();
  if(!actual.equals(expected))throw Error(`Changed pixels: ${state}/${i}`);
  checks.push({state,index:i,unchanged:true});
 }
 manifest.frame_layout={...manifest.frame_layout,sheetWidth:width,sheetHeight:4000,rows};
 manifest.animation.columns=6;
 for(const [state,info]of Object.entries(manifest.animation.rows)){
  info.row=rows[state][0].y/400;info.packed=true;
 }
 manifest.packing={physical_rows:10,columns:6,unique_frames:placed.size,placed_frames:layers.length,grouped_by_motion:true,coordinates:'frame_layout.rows is authoritative; carry walk and carry idle share row6'};
 fs.writeFileSync(path.join(run,'sprite-sheet-alpha.png'),png);
 fs.writeFileSync(path.join(run,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const reportPath=path.join(run,'sprite-sheet-alpha.report.json'),report=read(reportPath);
 for(const cell of report.cells||[])Object.assign(cell,rows[cell.state][cell.frame]);
 report.packing=manifest.packing;
 fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(path.join(run,'packing-verification.json'),JSON.stringify({size:[width,4000],unique_frames:placed.size,checks},null,2)+'\n');
 const asset=path.resolve(root,'../../../web/assets/characters/dog-npc-v2');
 fs.copyFileSync(path.join(run,'sprite-sheet-alpha.png'),path.join(asset,'atlas.png'));
 fs.copyFileSync(path.join(run,'manifest.json'),path.join(asset,'manifest.json'));
 fs.writeFileSync(path.resolve(root,'../../../web/js/components/DogSpriteData.js'),'export const DOG_FRAMES = '+JSON.stringify(manifest.frame_layout)+';\n');
 console.log(JSON.stringify(manifest.packing));
})();
