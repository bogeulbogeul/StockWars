import {cipherGridToScreen} from './CipherGrid.js';

// Source contact points are artwork measurements, independent of transparent padding.
export const CIPHER_FURNITURE_RASTERS={
    sofa:{file:'cipher-sofa-common-grid-v1.png',size:[1536,1024],span:1210,anchor:[518,1008],footprint:[1,2],outline:[[1028,32],[1098,63],[1118,133],[1399,273],[1409,308],[1409,575],[1394,583],[1394,618],[1353,643],[1310,619],[1304,583],[584,970],[560,955],[560,984],[516,1008],[476,984],[476,965],[273,845],[240,856],[204,834],[204,805],[195,789],[195,545],[204,514],[257,481],[307,499],[307,436],[322,402],[647,225],[681,232],[681,225]]},
    table:{file:'cipher-table-common-grid-v1.png',size:[1536,1024],span:1180,anchor:[768,954],footprint:[2,2],outline:[[768,78],[1354,398],[1361,438],[1358,511],[1351,514],[1351,641],[1317,666],[1258,633],[1258,574],[849,796],[846,917],[768,954],[690,916],[690,798],[279,574],[276,631],[242,668],[186,634],[183,517],[177,504],[177,439],[179,414]]},
    plant:{file:'cipher-plant-common-grid-v1.png',size:[1254,1254],span:1012.5,anchor:[626,1174],footprint:[1,1]},
    carpet:{file:'cipher-carpet-common-grid-v2.png',size:[1536,1024],span:1438,anchor:[953,920],footprint:[1,2],outline:[[50,361],[521,148],[1488,669],[953,920]]},
    cornerDisplay:{file:'cipher-cornerDisplay-common-grid-v1.png',size:[1446,1087],span:1290,anchor:[724,688],footprint:[2,2]},
    counter:{file:'cipher-reception-desk-common-grid-v4.png',size:[1254,1254],span:1178,anchor:[264,1144],footprint:[1,3]}
};
export function cipherRasterRect(item){
    const spec=CIPHER_FURNITURE_RASTERS[item.asset];if(!spec)return null;
    const scale=(spec.footprint[0]+spec.footprint[1])*60.75/spec.span;
    const p=item.asset==='cornerDisplay'?{x:724,y:310}:item.asset==='counter'?cipherGridToScreen(item.u+2,item.v+3):item.asset==='plant'?cipherGridToScreen(item.u+.8,item.v+.8):cipherGridToScreen(item.u+spec.footprint[0],item.v+spec.footprint[1]);
    return {x:p.x-spec.anchor[0]*scale,y:p.y-spec.anchor[1]*scale,w:spec.size[0]*scale,h:spec.size[1]*scale};
}
export function paintCipherRaster(ctx,image,item){
    if(!image?.complete||!image.naturalWidth)return;
    const spec=CIPHER_FURNITURE_RASTERS[item.asset],r=cipherRasterRect(item);
    ctx.save();ctx.translate(r.x,r.y);ctx.scale(r.w/spec.size[0],r.h/spec.size[1]);
    if(spec.outline){ctx.beginPath();spec.outline.forEach(([x,y],n)=>n?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();}
    ctx.drawImage(image,0,0,spec.size[0],spec.size[1]);ctx.restore();
}
