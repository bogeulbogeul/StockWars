import fs from 'node:fs';
import {updateSomangiClearance as update} from '../../web/js/components/town3d/SomangiClearance.js';
// Provisional room-unit to game-unit conversion, not an installed pub collider.
function canStand(x,z){
    const y=-z/100; x/=100;
    const dx=Math.max(-3.10-x,0,x-1.10), dy=Math.max(.60-y,0,y-1.40);
    if(Math.hypot(dx,dy)<.22)return false;
    return [-2.45,-1,.45].every(cx=>Math.hypot(x-cx,y+.25)>=.47);
}
const results=[];
for(const direction of [-1,1]){
    const c={},transitions=[];let previous=false;
    for(let i=0;i<=460;i++){
        const x=direction<0?120-i:-340+i;
        update(c,direction,0,x,-30,canStand);
        if(c.somangiCrabAuto!==previous){transitions.push({x:x/100,auto:c.somangiCrabAuto});previous=c.somangiCrabAuto;}
    }
    results.push({direction,transitions});
}
fs.writeFileSync(new URL('auto-proxy.json',import.meta.url),JSON.stringify({
    warning:'Proxy collider only. Pub runtime and actual collision are not installed.',
    radius:22,scale:100,results
},null,2));
console.log(JSON.stringify(results));
