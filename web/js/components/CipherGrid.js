import {guidePoint, GUIDE_TILE} from './CipherGuidePreview.js';
export const CIPHER_GRID_SIZE=10;
export const cipherGridToScreen=guidePoint;
export const CIPHER_FLOOR=[[0,0],[10,0],[10,10],[0,10]].map(([u,v])=>{const p=guidePoint(u,v);return [p.x,p.y];});
const slope=GUIDE_TILE.halfWidth/GUIDE_TILE.halfHeight;
export const CIPHER_GRID_LINES=[
 Array.from({length:11},(_,k)=>{const p=guidePoint(0,k);return {m:slope,b:p.x-p.y*slope};}),
 Array.from({length:11},(_,k)=>{const p=guidePoint(k,0);return {m:-slope,b:p.x+p.y*slope};})
];
