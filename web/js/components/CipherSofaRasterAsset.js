import {cipherGridToScreen} from './CipherGrid.js';

// Uniform scale preserves the approved illustration; placement uses the shared grid.
export function sofaAsset(item){
    const scale=196.8/1262;
    const p=cipherGridToScreen(item.u+.5,item.v+1);
    return {r:{x:p.x-793*scale,y:p.y-780*scale,w:1536*scale,h:1024*scale}};
}
