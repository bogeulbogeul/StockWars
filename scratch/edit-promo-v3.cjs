const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve('output/promo-video-v3'),old=path.resolve('output/promo-video-v2'),ff=process.argv[2];
const marks=JSON.parse(fs.readFileSync(root+'/marks.json'));const at=n=>{const m=marks.find(m=>m.name===n);if(!m)throw Error(n);return m.time};
fs.mkdirSync(root+'/edit-clips',{recursive:true});
const prior=JSON.parse(fs.readFileSync(old+'/edit-plan.json'));let files=[],plan=[],cursor=0;
function add(id,file,duration,source){files.push(file);plan.push({id,source,duration,editedStart:cursor,editedEnd:cursor+duration});cursor+=duration;}
for(let i=0;i<8;i++){let s=prior[i];add(s.id,old+'/edit-clips/'+String(i).padStart(2,'0')+'-'+s.id+'.mp4',s.duration,{version:2,start:s.sourceStart,end:s.sourceEnd});}
const spans=[['broker-room','broker-room','broker-room-end'],['market-browse','market-browse','market-browse-end'],['broker-company','broker-company','broker-company-end'],['broker-chart','broker-chart','broker-chart-end'],['chart-analysis','chart-analysis','chart-analysis-end'],['broker-order','broker-order','broker-order-end'],['purchase-result','purchase-result','purchase-result-end'],['portfolio','portfolio','portfolio-end'],['transactions','transactions','transactions-end']];
for(const[id,a,b] of spans){const start=at(a)+.08,end=id==='chart-analysis'?at(a)+4.95:at(b),frames=Math.ceil((end-start)*25),duration=frames/25,file=root+'/edit-clips/'+id+'.mp4';
cp.execFileSync(ff,['-hide_banner','-loglevel','error','-y','-ss',String(start),'-i',root+'/raw/new-capture.webm','-vf','fps=25,setsar=1,fade=t=in:st=0:d=0.12:color=0xfff6e6,fade=t=out:st='+(duration-.12)+':d=0.12:color=0xfff6e6','-frames:v',String(frames),'-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',file]);add(id,file,duration,{version:3,start,end});console.log(id,duration);}
add('end-title',old+'/edit-clips/12-end-title.mp4',6,{version:2});
fs.writeFileSync(root+'/edit-plan.json',JSON.stringify(plan,null,2));fs.writeFileSync(root+'/concat.txt',files.map(f=>"file '"+f.replaceAll('\\','/')+"'").join('\n'));
cp.execFileSync(ff,['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',root+'/concat.txt','-c','copy','-movflags','+faststart',root+'/stockwars-promo-v3-clean.mp4']);
const time=t=>{let cs=Math.round(t*100),h=Math.floor(cs/360000);cs%=360000;let m=Math.floor(cs/6000);cs%=6000;return h+':'+String(m).padStart(2,'0')+':'+String(Math.floor(cs/100)).padStart(2,'0')+'.'+String(cs%100).padStart(2,'0');};
const events=[['village','포포리에서 시작되는 새로운 하루'],['one-box','상자 하나를 차근차근 채워요'],['market-browse','궁금한 회사를 찾고'],['chart-analysis','차트를 읽으며 내 판단으로'],['portfolio','첫 투자, 내 계좌에 남는 경험']].map(([id,text])=>{const s=plan.find(s=>s.id===id);return 'Dialogue: 0,'+time(s.editedStart+.35)+','+time(Math.min(s.editedEnd-.2,s.editedStart+3.8))+',Head,,0,0,0,,{\\fad(180,180)}'+text}).join('\n');
const oldAss=fs.readFileSync(old+'/promo-captions.ass','utf8'),header=oldAss.slice(0,oldAss.indexOf('Dialogue:'));
fs.writeFileSync(root+'/promo-captions.ass',header+events+'\n');
cp.execFileSync(ff,['-hide_banner','-loglevel','error','-y','-i',root+'/stockwars-promo-v3-clean.mp4','-vf','ass=output/promo-video-v3/promo-captions.ass','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',root+'/stockwars-promo-v3.mp4']);console.log('READY',cursor);
