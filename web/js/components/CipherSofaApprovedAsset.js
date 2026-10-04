import {cipherGridToScreen} from './CipherGrid.js';
import {approvedSofa} from './CipherSofaApprovedImage.js';

// Keep the user's actual illustration intact. Only correct its projection axes.
// Measured from the approved image's three visible foot contact points.
const frontFoot=[109,231],rightFoot=[279,170],leftFoot=[34,185];
const longSlope=(rightFoot[1]-frontFoot[1])/(rightFoot[0]-frontFoot[0]);
const depthSlope=(frontFoot[1]-leftFoot[1])/(frontFoot[0]-leftFoot[0]);
const gridSlope=33.5/65.6;
const verticalScale=2*gridSlope/(depthSlope-longSlope);
const shear=-gridSlope-verticalScale*longSlope;
const silhouette='M32 113 Q32 107 40 105 L54 100 L54 93 Q54 88 60 85 L133 50 L143 46 L200 21 Q206 18 213 23 L219 28 L224 46 L286 77 Q291 79 292 84 L292 150 L288 157 L288 165 L279 170 L274 167 L274 161 L118 219 L116 227 L109 231 L102 226 L102 219 L46 183 L41 189 L34 185 L34 178 L32 176 Z';
export function sofaAsset(item){
    const scale=131.2/(rightFoot[0]-frontFoot[0]);
    const p=cipherGridToScreen(item.u+1,item.v+2);
    const anchorY=shear*frontFoot[0]+verticalScale*frontFoot[1]+24;
    const r={x:p.x-frontFoot[0]*scale,y:p.y-anchorY*scale,w:324*scale,h:292*scale};
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${r.w}" height="${r.h}" viewBox="0 0 324 292"><defs><clipPath id="sofa"><path d="${silhouette}"/></clipPath></defs><g transform="matrix(1 ${shear} 0 ${verticalScale} 0 24)"><image href="${approvedSofa}" width="324" height="269" clip-path="url(#sofa)"/></g></svg>`;
    return {r,svg};
}
