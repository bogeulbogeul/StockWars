import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {SPRITES,defaultRoomLayout,getVivianRoomHtml,propRectangle,vivianStaffRectangle} from '../web/js/components/store/VivianInteriorScene.js';
const sharp=createRequire(import.meta.url)('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const scene=new URL('../web/js/components/store/VivianInteriorScene.js',import.meta.url);
const uri=url=>'data:image/png;base64,'+readFileSync(url).toString('base64');
const items=defaultRoomLayout();
const layers=items.map(i=>{
 const s=SPRITES[i.assetId || i.id],r=propRectangle(i);
 if(i.kind==='carpet') return {z:0,html:''};
 return {z:i.kind==='wall'?1:r.groundY,html:`<svg x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" viewBox="${s.crop.join(' ')}"><image width="1254" height="1254" href="${uri(new URL((s.directory||'../../../assets/interiors/vivian-grid-v2/')+(i.assetId || i.id)+'.png',scene))}" transform="${s.transform||''}"/></svg>`};
});
const r=vivianStaffRectangle(items);
layers.push({z:r.groundY,html:`<image x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" href="${uri(new URL('../web/assets/characters/vivian/vivian-chibi-isometric-v3.png',import.meta.url))}"/>`});
const svg=getVivianRoomHtml().replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ').replace('</svg>',layers.sort((a,b)=>a.z-b.z).map(l=>l.html).join('')+'</svg>');
await sharp(Buffer.from(svg)).resize(1000).flatten({background:'#17232c'}).png().toFile('scratch/vivian-sizing-preview.png');

