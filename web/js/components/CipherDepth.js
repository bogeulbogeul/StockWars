import {cipherGridToScreen} from './CipherGrid.js';

// The two foreground base edges form a V. Test the player's feet against
// that boundary at the player's actual screen X, rather than either grid axis.
export function cipherFrontBoundary(item,size,x){
    const [w,h]=size(item);
    const left=cipherGridToScreen(item.u,item.v+h);
    const front=cipherGridToScreen(item.u+w,item.v+h);
    const right=cipherGridToScreen(item.u+w,item.v);
    const [a,b]=x<=front.x?[left,front]:[front,right];
    const clamped=Math.max(a.x,Math.min(b.x,x));
    return a.y+(b.y-a.y)*(clamped-a.x)/(b.x-a.x);
}
export function cipherDepthCompare(a,b,size){
    if(a.asset==='carpet'||b.asset==='carpet')return (a.asset==='carpet'?-1:0)-(b.asset==='carpet'?-1:0);
    if(a.asset==='player'||b.asset==='player'){
        if(a.asset===b.asset)return 0;
        const player=a.asset==='player'?a:b, furniture=a.asset==='player'?b:a;
        if(player.seatedOn===furniture.id)return a.asset==='player'?1:-1;
        if(furniture.asset==='cornerDisplay')return a.asset==='player'?1:-1;
        const feet=cipherGridToScreen(player.u,player.v);
        const inFront=feet.y>=cipherFrontBoundary(furniture,size,feet.x)-.01;
        return (inFront?1:-1)*(a.asset==='player'?1:-1);
    }
    return a.u+a.v+size(a).reduce((s,n)=>s+n,0)-b.u-b.v-size(b).reduce((s,n)=>s+n,0);
}

export function cipherDrawOrder(items,player,size){
    const furniture=[...items].sort((a,b)=>cipherDepthCompare(a,b,size));
    if(!player)return furniture;
    // Partition explicitly: pairwise sorting a player among several large
    // footprints can produce contradictory comparisons and unstable layering.
    return [...furniture.filter(i=>cipherDepthCompare(player,i,size)>0),player,
        ...furniture.filter(i=>cipherDepthCompare(player,i,size)<=0)];
}
