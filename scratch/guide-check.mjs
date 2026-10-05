// Common interior units; the whole preview uses one uniform display zoom.
export const GUIDE_TILE={width:67.5,height:38.2,halfWidth:33.75,halfHeight:19.1};
// Anchor to the actual rear floor junction, not the upper wall corner.
// Preserve the common axis ratio; keep the grid inside the generated floor.
const zoom=1.8,origin={x:724,y:350};
export const guidePoint=(u,v)=>({x:origin.x+(u-v)*GUIDE_TILE.halfWidth*zoom,y:origin.y+(u+v)*GUIDE_TILE.halfHeight*zoom});
export function guideGrid(x,y){const a=(x-origin.x)/(GUIDE_TILE.halfWidth*zoom),b=(y-origin.y)/(GUIDE_TILE.halfHeight*zoom);return {u:(a+b)/2,v:(b-a)/2};}
// User-requested display adjustment for the v5 trial asset.
export function drawCipherRoomImage(ctx,image,marbleImage){
    // v5 has slightly different slopes above/below its side floor corners.
    // Anchor both halves at that shared edge instead of averaging the error.
    const scaleX=607.5/634,x=724-724*scaleX,width=1448*scaleX;
    // Use the seam junction behind the first cream pixel as the rear anchor.
    // This lowers the rear tiles slightly, tapering to zero at both side corners.
    const sourceRear=362,sourceSide=697,sourceFront=1047;
    const targetRear=guidePoint(0,0).y,targetSide=guidePoint(10,0).y,targetFront=guidePoint(10,10).y;
    const upperScale=(targetSide-targetRear)/(sourceSide-sourceRear);
    const lowerScale=(targetFront-targetSide)/(sourceFront-sourceSide);
    ctx.save();ctx.beginPath();ctx.rect(0,0,1448,targetSide);ctx.clip();
    ctx.drawImage(image,x,targetRear-sourceRear*upperScale,width,1086*upperScale);ctx.restore();
    ctx.save();ctx.beginPath();ctx.rect(0,targetSide,1448,1086-targetSide);ctx.clip();
    const mappedY=sy=>{
        const t=Math.max(0,Math.min(1,(sy-sourceSide)/(sourceFront-sourceSide)));
        return targetSide+(sy-sourceSide)*lowerScale+2.5*Math.sin(Math.PI*t);
    };
    // Overlap sampled strips to avoid the transparent hairlines from abutting crops.
    for(let sy=sourceSide;sy<1086;sy+=4){
        const start=Math.max(sourceSide,sy-.75),end=Math.min(1086,sy+4.75);
        const t=Math.max(0,Math.min(1,((start+end)/2-sourceSide)/(sourceFront-sourceSide)));
        const leftCorrection=2*Math.sin(Math.PI*t);
        ctx.drawImage(image,0,start,1448,end-start,x-leftCorrection,mappedY(start),width+leftCorrection,mappedY(end)-mappedY(start));
    }
    ctx.restore();
    if(marbleImage?.complete&&marbleImage.naturalWidth){
        const target=[guidePoint(0,0),guidePoint(10,0),guidePoint(10,10),guidePoint(0,10)];
        // Remove the old floor including its residual edge outside the logical floor.
        ctx.save();ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=1;ctx.fillStyle='#000';ctx.beginPath();
        [[724,350],[1342,697],[724,1050],[106,697]].forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
        ctx.closePath();ctx.fill();ctx.restore();
        // Sample inside the marble: the generated navy rim must not be stretched
        // into a second black border at the wall/floor joins.
        const source=[{x:732,y:378},{x:1372,y:715},{x:722,y:1074},{x:84,y:713}];
        ctx.save();ctx.beginPath();target.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();
        for(const indices of [[0,1,2],[0,2,3]]){
            const [a,b,c]=indices.map(i=>source[i]),[A,B,C]=indices.map(i=>target[i]);
            const ux=b.x-a.x,uy=b.y-a.y,vx=c.x-a.x,vy=c.y-a.y,det=ux*vy-uy*vx;
            const Ux=B.x-A.x,Uy=B.y-A.y,Vx=C.x-A.x,Vy=C.y-A.y;
            const m=(Ux*vy-Vx*uy)/det,n=(Uy*vy-Vy*uy)/det,p=(Vx*ux-Ux*vx)/det,q=(Vy*ux-Uy*vx)/det;
            ctx.save();ctx.beginPath();
            const center={x:(A.x+B.x+C.x)/3,y:(A.y+B.y+C.y)/3};
            [A,B,C].forEach((point,i)=>{const dx=point.x-center.x,dy=point.y-center.y,length=Math.hypot(dx,dy),x=point.x+dx/length,y=point.y+dy/length;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
            ctx.closePath();ctx.clip();ctx.transform(m,n,p,q,A.x-m*a.x-p*a.y,A.y-n*a.x-q*a.y);
            ctx.drawImage(marbleImage,0,0,1448,1086);ctx.restore();
        }
        ctx.restore();
        ctx.save();ctx.beginPath();
        const left=guidePoint(0,10),front=guidePoint(10,10),right=guidePoint(10,0);
        // Restore the blue plinth that frames the two open sides of the room.
        const thickness=4;
        ctx.moveTo(left.x,left.y);ctx.lineTo(front.x,front.y);ctx.lineTo(front.x,front.y+thickness);ctx.lineTo(left.x,left.y+thickness);ctx.closePath();
        ctx.fillStyle='#052654';ctx.fill();
        ctx.beginPath();ctx.moveTo(front.x,front.y);ctx.lineTo(right.x,right.y);ctx.lineTo(right.x,right.y+thickness);ctx.lineTo(front.x,front.y+thickness);ctx.closePath();
        ctx.fillStyle='#041d43';ctx.fill();
        ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(front.x,front.y);ctx.lineTo(right.x,right.y);
        ctx.strokeStyle='#073b8c';ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();
        ctx.beginPath();ctx.moveTo(left.x,left.y+thickness);ctx.lineTo(front.x,front.y+thickness);ctx.lineTo(right.x,right.y+thickness);
        ctx.strokeStyle='#051f42';ctx.lineWidth=2;ctx.stroke();ctx.restore();
        // Finish beneath the pillar foot, with the same depth as the floor rim.
        ctx.save();
        for(const [point,direction] of [[left,-1],[right,1]]){
            ctx.beginPath();ctx.moveTo(point.x,point.y-1);
            ctx.lineTo(point.x+direction*5,point.y-3);
            ctx.lineTo(point.x+direction*5,point.y+1);
            ctx.lineTo(point.x,point.y+thickness);ctx.closePath();
            ctx.fillStyle=direction<0?'#052654':'#041d43';ctx.fill();
        }
        ctx.restore();
    }
}
export function paintGuidePreview(ctx,items,size,selected,roomImage,marbleImage,showGrid=false){
    const polygon=(points,fill,stroke='#927f60')=>{ctx.beginPath();points.forEach((p,n)=>n?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();};
    const back=guidePoint(0,0),left=guidePoint(0,10),right=guidePoint(10,0),height=170;
    if(roomImage?.complete&&roomImage.naturalWidth){drawCipherRoomImage(ctx,roomImage,marbleImage);}
    else{for(const end of [left,right])polygon([back,end,{x:end.x,y:end.y-height},{x:back.x,y:back.y-height}],'#f3e4c8','#255377');}
    if(showGrid||!roomImage?.naturalWidth)for(let u=0;u<10;u++)for(let v=0;v<10;v++)polygon([guidePoint(u,v),guidePoint(u+1,v),guidePoint(u+1,v+1),guidePoint(u,v+1)],roomImage?.naturalWidth?'#07172520':(u+v)%2?'#e5d7b5':'#fff0d1',roomImage?.naturalWidth?'#ff448880':'#927f60');
    for(const item of [...items].sort((a,b)=>a.u+a.v-b.u-b.v)){
        const [w,h]=size(item),points=[guidePoint(item.u,item.v),guidePoint(item.u+w,item.v),guidePoint(item.u+w,item.v+h),guidePoint(item.u,item.v+h)];
        polygon(points,item.id===selected?'#40c9c2aa':'#174671aa',item.id===selected?'#68fff0':'#e5bc59');
        const center=guidePoint(item.u+w/2,item.v+h/2);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 16px sans-serif';ctx.fillText(`${({counter:'안내 데스크',sofa:'소파',table:'테이블',plant:'화분',carpet:'출입 카펫',cornerDisplay:'전광판'})[item.asset]||item.asset} ${w}×${h}`,center.x,center.y+5);
    }
    ctx.textAlign='left';ctx.fillStyle='#cbe3ed';ctx.font='18px sans-serif';ctx.fillText('공통 그리드 · 10×10 · 한 칸 67.5×38.2 · ±29.5066°',180,24);
    ctx.font='15px sans-serif';ctx.fillText('바닥 접지점 기준 정렬 · 생성 그림의 타일 각도 차이는 별도 검증 대상',180,48);
}
