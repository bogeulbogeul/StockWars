import {marketEngine} from '../engine/marketEngine.js';

export function drawMarketDisplay(ctx){
    const stocks=[...marketEngine.stocks.values()].slice(0,4);
    const panel=(x,y,slope,draw)=>{ctx.save();ctx.transform(1,slope,0,1,x,y);ctx.beginPath();ctx.rect(0,0,465,385);ctx.clip();draw();ctx.restore();};
    const text=(label,x,y,size=30,color='#d5e9f2')=>{ctx.font=`600 ${size}px sans-serif`;ctx.fillStyle=color;ctx.fillText(label,x,y);};
    panel(210,480,-.5,()=>{
        text('CIPHER MARKET',0,38,34,'#edc454');
        text('게임 내 종목 시세',0,78,25,'#8aacba');
        stocks.forEach((s,n)=>{
            const pct=s.prevPrice?100*(s.price-s.prevPrice)/s.prevPrice:0;
            const color=pct>=0?'#51dc9f':'#f47f87',y=128+n*76;
            text(s.name,0,y,29);text(`${Math.round(s.price).toLocaleString()} G`,0,y+34,29,color);
            text(`${pct>=0?'▲':'▼'} ${Math.abs(pct).toFixed(2)}%`,275,y+34,26,color);
        });
    });
    panel(775,235,.5,()=>{
        text('CIPHER INDEX',0,38,34,'#edc454');
        text(String(marketEngine.getCipherIndex().val),0,87,42,'#51dc9f');
        const stock=stocks[0],history=(marketEngine.priceHistory.get(stock?.id)||[]).slice(-30);
        text(stock?.name||'MARKET',0,130,27,'#8aacba');
        ctx.strokeStyle='#163746';ctx.lineWidth=1.5;
        for(let n=0;n<4;n++){ctx.beginPath();ctx.moveTo(0,170+n*55);ctx.lineTo(450,170+n*55);ctx.stroke();}
        if(history.length>1){const lo=Math.min(...history),hi=Math.max(...history),range=Math.max(1,hi-lo);ctx.beginPath();history.forEach((p,n)=>{const x=n/(history.length-1)*450,y=335-(p-lo)/range*160;n?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle='#51dc9f';ctx.lineWidth=5;ctx.stroke();}
        text('LIVE · 게임 시장',0,377,25,'#8aacba');
    });
}
