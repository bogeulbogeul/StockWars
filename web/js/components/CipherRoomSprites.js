import {OBJECTS,actorIsBehind} from './CipherRoomPackageGeometry.js';

const root=new URL('../../assets/interiors/cipher/separated-v2/',import.meta.url);
// Each PNG has its own real alpha channel. Boxes are layout slots in room
// coordinates; transparent padding is measured once and scale stays uniform.
export const SPRITES=[
    {id:'rug',asset:'rug',box:[788,486,570,290],ground:true},
    {id:'table-rug',asset:'rug',box:[915,586,300,153],ground:true},
    {id:'entryrug',asset:'entryrug',box:[439,606,238,124],ground:true},
    {id:'plant-back',asset:'backplant',box:[807,211,140,124]},
    {id:'desk',asset:'desk',box:[439,323,402,261]},
    {id:'plant-left',asset:'floorplant',box:[360,416,98,136]},
    {id:'brochures',asset:'brochures',box:[433,472,72,112]},
    {id:'sofa-left',asset:'sofa',box:[865,476,198,160]},
    {id:'sofa-right',asset:'sofa',box:[1141,508,184,161],flip:true},
    {id:'table',asset:'table',box:[968,566,202,138]},
    {id:'table-plant',asset:'plant',box:[1033,553,78,86],parent:'table'},
    {id:'laptop',asset:'laptop',box:[614,396,68,50],parent:'desk'},
    {id:'sign-left',asset:'sign',box:[546,414,54,70],parent:'desk'},
    {id:'sign-right',asset:'sign',box:[691,339,58,80],parent:'desk'}
];

export function spriteRect(def,crop){
    const [x,y,w,h]=def.box,scale=Math.min(w/crop.width,h/crop.height);
    return {x:x+(w-crop.width*scale)/2,y:y+h-crop.height*scale,width:crop.width*scale,height:crop.height*scale};
}

export class CipherRoomSprites {
    constructor(onload){this.assets=new Map();this.ready=this.load().then(()=>onload?.());}
    async load(){
        await Promise.all([...new Set(['room',...SPRITES.map(s=>s.asset)])].map(async name=>{
            const image=new Image();image.src=new URL(name+'.png',root).href;await image.decode();
            let crop={x:0,y:0,width:image.naturalWidth,height:image.naturalHeight};
            if(name!=='room'){
                const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
                const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
                const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
                let x0=canvas.width,y0=canvas.height,x1=-1,y1=-1;
                for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>8){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
                if(x1<0)throw new Error(`Empty room sprite: ${name}`);
                crop={x:x0,y:y0,width:x1-x0+1,height:y1-y0+1};
            }
            this.assets.set(name,{image,crop});
        }));
    }
    draw(ctx,def){
        const item=this.assets.get(def.asset);if(!item)return;
        const r=spriteRect(def,item.crop),s=item.crop;
        ctx.save();ctx.translate(r.x+(def.flip?r.width:0),r.y);if(def.flip)ctx.scale(-1,1);
        ctx.drawImage(item.image,s.x,s.y,s.width,s.height,0,0,r.width,r.height);ctx.restore();
    }
    drawGroup(ctx,id){for(const def of SPRITES)if(def.id===id||def.parent===id)this.draw(ctx,def);}
}

// A topological painter order handles long diagonal counters: comparing only
// sprite centre-Y draws players over the far end or under the near end.
export function roomDrawOrder(actors){
    const furniture=SPRITES.filter(s=>!s.ground&&!s.parent).map(s=>({kind:'object',id:s.id,object:OBJECTS.find(o=>o.id===s.id),depth:Math.max(...OBJECTS.find(o=>o.id===s.id).footprint.map(p=>p[1]))}));
    const nodes=[...furniture,...actors.map((actor,i)=>({kind:'actor',id:`actor-${i}`,actor,depth:actor.pose.y}))];
    const bounds=node=>node.kind==='actor'?(node.actor.bounds||[node.actor.pose.x-40,node.actor.pose.y-90,80,105]):SPRITES.filter(s=>s.id===node.id||s.parent===node.id).reduce((r,s)=>{const [x,y,w,h]=s.box;return [Math.min(r[0],x),Math.min(r[1],y),Math.max(r[2],x+w),Math.max(r[3],y+h)];},[Infinity,Infinity,-Infinity,-Infinity]).map((v,i,a)=>i>1?v-a[i-2]:v);
    const rectangles=nodes.map(bounds);
    const edges=nodes.map(()=>new Set()),incoming=nodes.map(()=>0);
    const edge=(a,b)=>{if(!edges[a].has(b)){edges[a].add(b);incoming[b]++;}};
    for(let a=0;a<nodes.length;a++)for(let b=a+1;b<nodes.length;b++){
        const left=nodes[a],right=nodes[b];
        const ar=rectangles[a],br=rectangles[b];
        if(ar[0]+ar[2]<br[0]||br[0]+br[2]<ar[0]||ar[1]+ar[3]<br[1]||br[1]+br[3]<ar[1])continue;
        if(left.kind===right.kind){if(left.depth<=right.depth)edge(a,b);else edge(b,a);continue;}
        const oi=left.kind==='object'?a:b,ai=oi===a?b:a,object=nodes[oi].object,actor=nodes[ai].actor;
        const behind=actor.forceBehind===object.id||(actor.seat?.sofa!==object.id&&actorIsBehind(actor.pose,object));
        if(behind)edge(ai,oi);else edge(oi,ai);
    }
    const result=[],remaining=new Set(nodes.map((_,i)=>i));
    while(remaining.size){
        const available=[...remaining].filter(i=>incoming[i]===0).sort((a,b)=>nodes[a].depth-nodes[b].depth);
        // Non-overlapping objects can induce harmless cycles with lateral actors.
        // Break those by normal foot depth, never by clipping actor rectangles.
        const next=available[0]??[...remaining].sort((a,b)=>nodes[a].depth-nodes[b].depth)[0];
        remaining.delete(next);result.push(nodes[next]);for(const i of edges[next])incoming[i]--;
    }
    return result;
}
