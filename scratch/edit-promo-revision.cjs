const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve('output/promo-video-v2'),ff=process.argv[2];
const marks=JSON.parse(fs.readFileSync(root+'/marks.json','utf8'));
const at=name=>{const m=marks.find(m=>m.name===name);if(!m)throw Error('Missing '+name);return m.time;};
const spans=[
 ['opening-1',at('opening-1')+.08,at('opening-1-end'),false],
 ['opening-2',at('opening-2')+.08,at('opening-2-end'),false],
 ['village',at('village')+.16,at('village-end'),false],
 ['anna-dialogue',at('anna-dialogue')+.16,at('anna-dialogue-end')-.24,false],
 ['paper-and-application',at('nickname-handoff-start')-.12,at('application-end')+.12,true],
 ['phone-full-handoff',at('phone-handoff-start')-.12,at('phone-handoff-end')+.12,true],
 ['one-box',at('one-box'),at('one-box-end')+.12,true],
 ['wage-and-envelope-full',at('wage-handoff-start')-.12,at('envelope-handoff-end')+.12,true],
 ['broker-room',at('broker-room')+.08,at('broker-room-end'),false],
 ['broker-company',at('broker-company')+.08,at('broker-company-end'),false],
 ['broker-chart',at('broker-chart')+.08,at('broker-chart-end'),false],
 ['broker-order',at('broker-order')+.08,at('broker-order-end'),false],
 ['end-title',at('title')+.5,at('title')+6.5,false]
];
fs.mkdirSync(root+'/edit-clips',{recursive:true});let plan=[],files=[],cursor=0;
for(let i=0;i<spans.length;i++){
 const[id,start,end,continuous]=spans[i],frames=Math.ceil((end-start)*25),duration=frames/25;
 const file=root+'/edit-clips/'+String(i).padStart(2,'0')+'-'+id+'.mp4';
 let filter='fps=25,setsar=1';
 if(!continuous)filter+=',fade=t=in:st=0:d=0.14:color=0xfff6e6,fade=t=out:st='+(duration-.14)+':d=0.14:color=0xfff6e6';
 cp.execFileSync(ff,['-hide_banner','-loglevel','error','-y','-ss',String(start),'-i',root+'/raw/new-capture.webm','-vf',filter,'-frames:v',String(frames),'-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',file]);
 files.push(file);plan.push({id,sourceStart:start,sourceEnd:end,duration,continuous,editedStart:cursor,editedEnd:cursor+duration});cursor+=duration;console.log('cut',id,duration);
}
fs.writeFileSync(root+'/edit-plan.json',JSON.stringify(plan,null,2));
fs.writeFileSync(root+'/concat.txt',files.map(f=>"file '"+f.replaceAll('\\','/')+"'").join('\n'));
cp.execFileSync(ff,['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',root+'/concat.txt','-c','copy','-movflags','+faststart',root+'/stockwars-promo-v2-clean.mp4']);
const time=t=>{let cs=Math.round(t*100),h=Math.floor(cs/360000);cs%=360000;let m=Math.floor(cs/6000);cs%=6000;return h+':'+String(m).padStart(2,'0')+':'+String(Math.floor(cs/100)).padStart(2,'0')+'.'+String(cs%100).padStart(2,'0');};
let events=[['village','포포리에서 시작되는 새로운 하루'],['one-box','상자 하나를 차근차근 채워요'],['broker-room','증권사에서 배우는 첫 투자']].map(([id,text])=>{let s=plan.find(s=>s.id===id);return 'Dialogue: 0,'+time(s.editedStart+.4)+','+time(Math.min(s.editedEnd-.2,s.editedStart+3.8))+',Head,,0,0,0,,{\\fad(180,180)}'+text;}).join('\n');
const header='[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 2\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Head,Malgun Gothic,48,&H0040513C,&H0040513C,&H18E6F6FF,&H18E6F6FF,-1,0,0,0,100,100,1,0,3,15,0,8,160,160,64,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';
fs.writeFileSync(root+'/promo-captions.ass',header+events+'\n');
cp.execFileSync(ff,['-hide_banner','-loglevel','error','-y','-i',root+'/stockwars-promo-v2-clean.mp4','-vf','ass=output/promo-video-v2/promo-captions.ass','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',root+'/stockwars-promo-v2.mp4']);
console.log('REVISION READY',cursor);
