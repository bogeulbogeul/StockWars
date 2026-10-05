import {cipherGridToScreen} from './CipherGrid.js';

// Source contact points are artwork measurements, independent of transparent padding.
export const CIPHER_FURNITURE_RASTERS={
    sofa:{file:'cipher-sofa-refined-v8.png',size:[1536,1024],span:1247,anchor:[482,1008],footprint:[1,2],outline:[[1025,17],[1045,19],[1113,58],[1134,102],[1410,278],[1424,297],[1424,542],[1413,558],[1413,593],[1353,624],[1326,609],[1326,600],[594,966],[576,968],[535,938],[533,978],[482,1008],[431,981],[431,955],[267,834],[230,850],[185,823],[184,785],[175,774],[175,501],[188,485],[255,451],[274,451],[286,459],[285,407],[300,390],[636,217],[653,217],[671,228],[670,212],[680,197]]},
    table:{file:'cipher-table-common-grid-v2.png',size:[1536,1024],span:1172,anchor:[768,954],footprint:[2,2],outline:[[768,72],[1353,400],[1354,472],[1344,479],[1344,610],[1300,644],[1250,615],[1250,555],[835,794],[835,918],[768,954],[700,916],[700,796],[287,555],[287,615],[238,644],[190,614],[190,481],[181,475],[181,404]]},
    plant:{file:'cipher-plant-common-grid-v2.png',size:[1254,1254],span:1012.5,anchor:[626,1174],footprint:[1,1]},
    carpet:{file:'cipher-carpet-parallel-v5.png',size:[1536,1024],span:1372,anchor:[547,919],footprint:[1,2],sourceMirror:true,outline:[[81,388],[526,130],[1453,653],[989,919]]},
    cornerDisplay:{file:'cipher-cornerDisplay-common-grid-v2.png',size:[1446,1087],span:1354,anchor:[724,698],footprint:[2,2]},
    counter:{file:'cipher-reception-desk-laptop-v6.png',size:[1254,1254],span:1178,anchor:[264,1204],footprint:[1,3]}
};
export function cipherRasterRect(item){
    const spec=CIPHER_FURNITURE_RASTERS[item.asset];if(!spec)return null;
    const gridU=cipherGridToScreen(spec.footprint[0],0);
    const gridV=cipherGridToScreen(0,spec.footprint[1]);
    const scale=Math.abs(gridU.x-gridV.x)/spec.span;
    const p=item.asset==='cornerDisplay'?{x:724,y:245}:item.asset==='counter'?cipherGridToScreen(item.u+2,item.v+3):item.asset==='plant'?cipherGridToScreen(item.u+.8,item.v+.8):cipherGridToScreen(item.u+spec.footprint[0],item.v+spec.footprint[1]);
    return {x:p.x-spec.anchor[0]*scale,y:p.y-spec.anchor[1]*scale,w:spec.size[0]*scale,h:spec.size[1]*scale};
}
export function paintCipherRaster(ctx,image,item){
    if(!image?.complete||!image.naturalWidth)return;
    const spec=CIPHER_FURNITURE_RASTERS[item.asset],r=cipherRasterRect(item);
    ctx.save();ctx.translate(r.x,r.y);ctx.scale(r.w/spec.size[0],r.h/spec.size[1]);
    if(spec.sourceMirror){ctx.translate(spec.size[0],0);ctx.scale(-1,1);}
    if(spec.outline){ctx.beginPath();spec.outline.forEach(([x,y],n)=>n?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();}
    ctx.drawImage(image,0,0,spec.size[0],spec.size[1]);ctx.restore();
}
