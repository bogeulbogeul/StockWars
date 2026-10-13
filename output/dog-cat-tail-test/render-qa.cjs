const fs=require('fs'),vm=require('vm');
const sharp=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const html=fs.readFileSync(__dirname+'/preview.html','utf8');
const source=html.split('<script>')[1].split('const states=')[0];
const context=vm.createContext({URL,Map,Math,performance:{now:()=>0},Image:class{}});vm.runInContext(source,context);
(async()=>{const states=['right_walk','up_walk','right_sit'];const images=[];let n=0;for(const state of states)for(const styleId of ['dog','black-cat']){const [direction,mode]=state.split('_');const svg=vm.runInContext(`characterSpriteSVG(${JSON.stringify({styleId,direction,moving:mode==='walk',seated:mode==='sit',time:0})})`,context);const buffer=await sharp(Buffer.from(svg)).resize(256,296).png().toBuffer();images.push({input:buffer,left:(n%2)*280+12,top:Math.floor(n/2)*320+12});n++}await sharp({create:{width:560,height:960,channels:4,background:'#faf9f4'}}).composite(images).png().toFile(__dirname+'/tail-qa.png')})().catch(e=>{console.error(e);process.exit(1)});
