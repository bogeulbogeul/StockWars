const fs=require('fs'),path=require('path');
const root=__dirname,run=path.join(root,'run');
let html=fs.readFileSync(path.join(root,'preview-template.html'),'utf8').replace('__SCALE__',fs.readFileSync(path.join(root,'scale.json'),'utf8'));
html=html.replace('__MANIFEST__',fs.readFileSync(path.join(run,'manifest.json'),'utf8')).replace('__ATLAS__','data:image/png;base64,'+fs.readFileSync(path.join(run,'sprite-sheet-alpha.png')).toString('base64')).replace('__PARCEL__','data:image/png;base64,'+fs.readFileSync(path.resolve(root,'../../../web/assets/minigames/logistics/parcel.png')).toString('base64'));
const dog=path.resolve(root,'../../dog-sprite-test/directions-v2');
const dogData=JSON.stringify({scale:JSON.parse(fs.readFileSync(path.join(dog,'scale.json'),'utf8')),manifest:JSON.parse(fs.readFileSync(path.join(dog,'run/manifest.json'),'utf8')),atlas:'data:image/png;base64,'+fs.readFileSync(path.join(dog,'run/sprite-sheet-alpha.png')).toString('base64')});
html=html.replace('</script>',`</script><script>
const dogData=${dogData},dogAtlas=new Image();dogAtlas.src=dogData.atlas;
const dogCards=cards.map(({state,c})=>{const parent=c.canvas.parentElement;const name=document.createElement('p');name.textContent='고양이 / 강아지 원본';parent.insertBefore(name,c.canvas);const canvas=document.createElement('canvas');canvas.width=256;canvas.height=320;parent.append(canvas);return {state,c:canvas.getContext('2d')}});
function drawDog(){for(const {state,c} of dogCards){c.clearRect(0,0,256,320);const flip=state.startsWith('left_'),s=flip?state.replace('left_','right_'):state,frames=dogData.manifest.frame_layout.rows[s],seq=frames.length===4?[0,1,2,3]:frames.length===3?[0,1,2,1]:[0],f=frames[seq[Math.floor(phase)%seq.length]],scale=dogData.scale.uniformScale*Number(document.querySelector('#zoom').value);c.save();c.translate(128,296);c.scale(scale,scale);if(flip)c.scale(-1,1);c.translate(-128,-dogData.scale.groundY);if(dogAtlas.complete&&dogAtlas.naturalWidth)c.drawImage(dogAtlas,f.x,f.y,f.w,f.h,0,0,256,320);c.restore()}requestAnimationFrame(drawDog)}requestAnimationFrame(drawDog);
</script><style>main{grid-template-columns:repeat(auto-fit,minmax(540px,1fr))}</style>`);
fs.writeFileSync(path.join(root,'preview.html'),html);
