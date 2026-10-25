export function drawCipherIndex(display, index, history) {
    const { ctx, texture } = display;
    const value = Number(index?.val), change = Number(index?.diffPct);
    const valid = Number.isFinite(value) && Number.isFinite(change);
    ctx.fillStyle = '#13272a'; ctx.fillRect(0,0,1760,640);
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillStyle = '#efdfb8'; ctx.font = 'bold 65px sans-serif';
    ctx.fillText('포포리 시장 현황',58,69);
    ctx.textAlign = 'right'; ctx.font = '32px sans-serif'; ctx.fillStyle = '#92b7af';
    ctx.fillText('게임 시장',1700,70);
    ctx.textAlign = 'left'; ctx.fillStyle = '#f0f1e9'; ctx.font = 'bold 126px sans-serif';
    ctx.fillText(valid ? value.toLocaleString('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:2}) : '미연결',58,250);
    ctx.font = '40px sans-serif'; ctx.fillStyle = '#92b7af'; ctx.fillText('pt',62,345);
    const color = change > 0 ? '#ff9e96' : change < 0 ? '#8fc6ff' : '#bdcac6';
    ctx.fillStyle = color; ctx.font = 'bold 54px sans-serif';
    ctx.fillText(valid ? `${change > 0 ? '▲ +' : change < 0 ? '▼ ' : ''}${change.toFixed(2)}%` : '시세를 기다리는 중',58,435);
    const left=800, top=170, width=870, height=315;
    ctx.strokeStyle='#294346'; ctx.lineWidth=2;
    for(let i=0;i<4;i++) {
        const y=top+i*height/3;
        ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(left+width,y); ctx.stroke();
    }
    if(valid && history.length) {
        const values=history.map(point=>point.value);
        const low=Math.min(...values)-1, high=Math.max(...values)+1;
        const points=values.map((v,i)=>({x:left+(values.length===1 ? .5 : i/(values.length-1))*width,
            y:top+height-(v-low)/(high-low)*height}));
        ctx.strokeStyle=color; ctx.lineWidth=6; ctx.lineJoin='round'; ctx.beginPath();
        points.forEach((p,i)=>i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y)); ctx.stroke();
        const last=points.at(-1); ctx.fillStyle=color; ctx.beginPath(); ctx.arc(last.x,last.y,8,0,Math.PI*2); ctx.fill();
    }
    ctx.fillStyle='#92b7af'; ctx.font='30px sans-serif'; ctx.textAlign='left';
    ctx.fillText('로비에서 관측한 지수 추이 · 최근 60개',800,552);
    texture.needsUpdate=true;
}
