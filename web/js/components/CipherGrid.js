// Uniform 10×10 square floor, projected with the existing room's two axes.
export const CIPHER_GRID_SIZE=10;
export function cipherGridToScreen(u,v){return {x:724+(u-v)*65.6,y:375+(u+v)*33.5};}
export const CIPHER_FLOOR=[[724,375],[1380,710],[724,1045],[68,710]];
export const CIPHER_GRID_LINES=[
 Array.from({length:11},(_,k)=>({m:65.6/33.5,b:724-375*65.6/33.5-131.2*k})),
 Array.from({length:11},(_,k)=>({m:-65.6/33.5,b:724+375*65.6/33.5+131.2*k}))
];
