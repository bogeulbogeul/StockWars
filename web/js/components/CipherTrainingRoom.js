import {marketEngine} from '../engine/marketEngine.js';
import {StockChartRenderer} from './chart.js';
import {SECTORS} from '../data/stocksData.js?v=v72';

export class CipherTrainingRoom {
    constructor(container,engine=marketEngine){
        this.engine=engine;
        this.desktopMode=engine===marketEngine;this.stockFilter='all';
        try{this.watchlist=new Set(JSON.parse(localStorage.getItem('stockwars.training.watchlist')||'[]'));}catch{this.watchlist=new Set();}
        this.dialog=document.createElement('dialog');this.dialog.className='cipher-training';
        this.dialog.setAttribute('aria-label','트레이닝룸 주식 거래');
        this.dialog.innerHTML=`<header><div><small>CIPHER SECURITIES · DESKTOP HTS</small><h2>트레이닝룸</h2></div><button data-close>로비로 돌아가기 · Esc</button></header>
        <div class="training-workspace"><aside><h3>주식 시장</h3><input type="search" aria-label="종목 검색" placeholder="종목 이름 검색"><div class="training-stocks"></div></aside>
        <main><section class="training-stock-heading"><h2 data-name></h2><strong data-price></strong><span data-sector></span></section><section class="training-chart"><canvas aria-label="선택 종목 가격 차트"></canvas></section><section><h3>호가</h3><div class="training-book"></div></section></main>
        <aside class="training-order"><h3>주문</h3><p>보유 현금 <strong data-cash></strong></p><label>주문 수량<input type="number" min="1" step="1" value="1" aria-label="주문 수량"></label><p>예상 주문 금액 <strong data-total></strong></p><div class="training-actions"><button data-buy>매수</button><button data-sell>매도</button></div><p class="training-result" role="status" aria-live="polite"></p><h3>내 보유 종목</h3><div class="training-portfolio"></div></aside></div>`;
        container.append(this.dialog);
        this.leverage=1;this.shortMode=false;
        const controls=document.createElement('div');controls.innerHTML='<label>거래 방식<select aria-label="거래 방식"><option value="long">매수 (롱)</option><option value="short">공매도 (숏)</option></select></label><label>레버리지<select aria-label="레버리지"><option value="1">1배</option><option value="2">2배</option><option value="3">3배</option><option value="5">5배</option></select></label><small class="training-unlock-hint"></small>';
        this.dialog.querySelector('.training-order h3').after(controls);
        this.modeSelect=controls.querySelector('[aria-label="거래 방식"]');this.leverageSelect=controls.querySelector('[aria-label="레버리지"]');
        this.modeSelect.onchange=()=>{this.shortMode=this.modeSelect.value==='short';this.renderDetails();};
        this.leverageSelect.onchange=()=>{this.leverage=Number(this.leverageSelect.value);this.renderDetails();};
        const sectors=document.createElement('select');sectors.setAttribute('aria-label','업종 분류');
        for(const [value,label] of [['ALL','전체 업종'],...Object.entries(SECTORS).map(([id,s])=>[id,s.name])]){
            const option=document.createElement('option');option.value=value;option.textContent=label;sectors.append(option);
        }
        this.dialog.querySelector('[type=search]').after(sectors);this.sectors=sectors;sectors.onchange=()=>this.render();
        const accountButton=document.createElement('button');accountButton.textContent='내 계좌';accountButton.onclick=()=>{this.accountVisible=!this.accountVisible;this.renderAccount();};
        this.dialog.querySelector('header').insertBefore(accountButton,this.dialog.querySelector('[data-close]'));
        this.account=document.createElement('section');this.account.className='training-account';this.account.hidden=true;
        this.dialog.querySelector('header').after(this.account);
        if(this.desktopMode){
            this.dialog.classList.add('training-desktop');
            this.summary=document.createElement('section');this.summary.className='training-summary';this.dialog.querySelector('header').after(this.summary);
            const filter=document.createElement('select');filter.setAttribute('aria-label','종목 목록 필터');for(const [value,label] of [['all','전체 종목'],['watch','관심 종목'],['held','보유 종목']]){const option=document.createElement('option');option.value=value;option.textContent=label;filter.append(option);}filter.onchange=()=>{this.stockFilter=filter.value;this.render();};sectors.after(filter);
            const star=document.createElement('button');star.setAttribute('data-watch','');star.onclick=()=>{if(this.watchlist.has(this.selected))this.watchlist.delete(this.selected);else this.watchlist.add(this.selected);localStorage.setItem('stockwars.training.watchlist',JSON.stringify([...this.watchlist]));this.render();};this.dialog.querySelector('.training-stock-heading').append(star);
            this.info=document.createElement('details');this.info.open=true;this.info.style.cssText='margin-top:18px;padding:16px 18px;background:#12283a;border:1px solid #345268;border-radius:12px';
            const infoTitle=document.createElement('summary');infoTitle.textContent='기업 정보 · 투자 판단 자료';infoTitle.style.cssText='cursor:pointer;font-weight:700;color:#e5c267';
            this.infoBody=document.createElement('div');this.info.append(infoTitle,this.infoBody);this.dialog.querySelector('.training-chart').before(this.info);
            const infoButton=document.createElement('button');infoButton.textContent='ⓘ 기업 정보';infoButton.onclick=()=>{this.info.open=!this.info.open;if(this.info.open)this.info.scrollIntoView({behavior:'smooth',block:'nearest'});};this.dialog.querySelector('.training-stock-heading').append(infoButton);
            const sizes=document.createElement('div');sizes.className='training-quantity-shortcuts';
            for(const ratio of [.25,.5,1]){const button=document.createElement('button');button.textContent=ratio===1?'최대':`${ratio*100}%`;button.onclick=()=>{const stock=this.engine.stocks.get(this.selected);if(!stock)return;const capacity=this.engine.getExecutionPreview?.(this.shortMode?'short':'buy',this.selected,Number.MAX_SAFE_INTEGER,this.leverage,'brokerage').quantity ?? Math.floor(this.engine.cash*this.leverage/stock.price);this.dialog.querySelector('[type=number]').value=Math.max(1,Math.floor(capacity*ratio));this.renderDetails();};sizes.append(button);}this.dialog.querySelector('[type=number]').after(sizes);
        }
        if(!document.getElementById('cipher-training-style')){
            const style=document.createElement('style');style.id='cipher-training-style';style.textContent=`
            .cipher-training{box-sizing:border-box;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:24px;background:#081221;color:#eaf0f8;border:0;font-family:inherit}
            .cipher-training[open]{display:flex;flex-direction:column;gap:22px}.cipher-training header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #263e55;padding-bottom:18px}.cipher-training h2{margin:6px 0}.cipher-training small{color:#e4bb59;letter-spacing:2px}.cipher-training h3{font-size:15px;color:#a6bace}.cipher-training button,.cipher-training input{font:inherit;border:1px solid #344e68;border-radius:8px;padding:10px;background:#14283e;color:#eaf0f8}.cipher-training button{cursor:pointer}.training-workspace{display:grid;grid-template-columns:260px minmax(0,1fr) 300px;gap:18px;min-height:0;flex:1}.training-workspace>aside,.training-workspace>main{background:#0e1d2e;border:1px solid #233950;border-radius:14px;padding:18px;overflow:auto}.cipher-training select{width:100%;padding:10px;margin-bottom:8px;background:#14283e;color:#eaf0f8;border:1px solid #344e68;border-radius:8px}.training-account{padding:14px 20px;background:#14283e;border:1px solid #344e68;border-radius:12px;max-height:230px;overflow:auto}.training-account[hidden]{display:none}.training-workspace input{box-sizing:border-box;width:100%;margin:8px 0}.training-stocks button{display:flex;width:100%;justify-content:space-between;margin:8px 0;text-align:left;gap:12px}.training-stocks button.active{border-color:#e4bb59;background:#223449}.training-stock-heading{display:flex;align-items:baseline;gap:18px;flex-wrap:wrap}.training-stock-heading strong{font-size:28px;color:#ffd875}.training-stock-heading span{color:#8da8bd}.training-chart{height:clamp(240px,45vh,550px);margin-top:20px}.training-book>div,.training-portfolio>div{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #233950;gap:12px}.training-actions{display:flex;gap:10px}.training-actions button{flex:1;font-weight:700}.training-actions [data-buy]{background:#923b46}.training-actions [data-sell]{background:#225a94}.training-result{min-height:48px;line-height:1.6;color:#e4bb59}.training-order label{display:block;margin:22px 0}.training-order p{line-height:1.7}
            .training-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;background:#12283b;border:1px solid #2b475e;border-radius:12px;padding:14px 18px}.training-summary small{display:block;letter-spacing:0;color:#9fb7ca;margin-bottom:6px}.training-summary strong{font-size:22px;color:#f5d583}.training-desktop .training-chart{height:clamp(240px,32vh,360px)}.training-desktop .training-book{display:grid;grid-template-columns:1fr 1fr;gap:16px}.training-desktop .training-book section>div{padding:10px 0;border-bottom:1px solid #294157;font-size:14px}.training-quantity-shortcuts{display:flex;gap:8px;margin-top:8px}.training-quantity-shortcuts button{flex:1;padding:7px}.training-desktop .training-stocks button small{display:block;letter-spacing:0;font-size:12px}.training-desktop [data-watch]{font-size:13px;margin-left:auto}@media(max-width:640px){.training-summary{grid-template-columns:1fr 1fr}}
            .cipher-training:not(.cipher-arena){overflow-y:auto;overscroll-behavior:contain}
            .cipher-training:not(.cipher-arena)>*{flex-shrink:0}
            .cipher-training:not(.cipher-arena)>.training-workspace{flex:none;min-height:560px;align-items:start}
            .cipher-training:not(.cipher-arena)>.training-workspace>main,.cipher-training:not(.cipher-arena)>.training-workspace>.training-order{overflow:visible;min-width:0}
            .cipher-training:not(.cipher-arena) .training-stocks{max-height:560px;overflow-y:auto}
            @media(max-width:1000px){.training-workspace{grid-template-columns:200px minmax(0,1fr)}.training-order{grid-column:1/-1}}@media(max-width:640px){.cipher-training{padding:12px}.training-workspace{grid-template-columns:1fr}.training-order{grid-column:auto}.training-stocks{max-height:180px;overflow:auto}}`;
            document.head.append(style);
        }
        this.chart=new StockChartRenderer(this.dialog.querySelector('canvas'));
        const chartArea=this.dialog.querySelector('.training-chart');chartArea.tabIndex=0;chartArea.setAttribute('role','button');chartArea.setAttribute('aria-label','전체 차트 정밀 분석 열기');chartArea.style.cursor='zoom-in';
        chartArea.onclick=()=>this.onAnalyze?.(this.selected);
        chartArea.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();this.onAnalyze?.(this.selected);}};
        const chartHint=document.createElement('p');chartHint.textContent='차트를 클릭하면 전체 화면에서 정밀 분석할 수 있습니다.';chartHint.style.cssText='color:#8da8bd;font-size:12px';chartArea.after(chartHint);
        this.dialog.querySelector('[data-close]').onclick=()=>this.close();
        this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();});
        this.dialog.addEventListener('keydown',e=>e.stopPropagation());
        this.dialog.querySelector('[type=search]').oninput=()=>this.render();
        this.dialog.querySelector('[type=number]').oninput=()=>this.renderDetails();
        this.dialog.querySelector('[data-buy]').onclick=()=>this.order('buy');
        this.dialog.querySelector('[data-sell]').onclick=()=>this.order('sell');
        this.engine.subscribe(()=>{if(this.dialog.open)this.render();});
    }
    open(){this.dialog.showModal();this.render();requestAnimationFrame(()=>this.renderDetails());}
    close(){this.dialog.close();this.onClose?.();}
    render(){
        const stocks=[...this.engine.stocks.values()];
        if(!this.engine.stocks.has(this.selected))this.selected=stocks[0]?.id;
        const query=this.dialog.querySelector('[type=search]').value.trim().toLowerCase();
        const list=this.dialog.querySelector('.training-stocks');list.replaceChildren();
        for(const stock of stocks.filter(s=>(this.sectors.value==='ALL'||s.sector===this.sectors.value)&&`${s.name} ${s.id}`.toLowerCase().includes(query)&&(this.stockFilter!=='watch'||this.watchlist.has(s.id))&&(this.stockFilter!=='held'||this.engine.portfolio.has(s.id)))){
            const button=document.createElement('button');button.classList.toggle('active',stock.id===this.selected);
            const name=document.createElement('span');name.textContent=stock.name;
            const price=document.createElement('span');price.textContent=`${stock.price.toLocaleString()}G`;
            if(this.desktopMode){const change=(stock.price/stock.prevPrice-1)*100;const rate=document.createElement('small');rate.textContent=`${change>=0?'+':''}${change.toFixed(2)}%`;rate.style.color=change>=0?'#ff929c':'#7abbff';price.append(rate);}
            button.append(name,price);button.onclick=()=>{this.selected=stock.id;this.dialog.querySelector('.training-result').textContent='';this.render();};list.append(button);
        }
        this.renderDetails();
        this.renderAccount();
        if(this.summary){const state=this.engine.getState();this.summary.replaceChildren();for(const [label,value] of [['총자산',state.totalNetWorth],['보유 현금',state.cash],['보유 평가액',state.portfolioValue],['평가손익',state.totalProfitLoss]]){const card=document.createElement('div'),caption=document.createElement('small'),amount=document.createElement('strong');caption.textContent=label;amount.textContent=`${Math.round(value).toLocaleString()}G`;card.append(caption,amount);this.summary.append(card);}}
    }
    renderDetails(){
        const stock=this.engine.stocks.get(this.selected);if(!stock)return;
        const unlocked=this.engine.isLevel10Unlocked;
        this.modeSelect.querySelector('[value=short]').disabled=!unlocked;
        for(const option of this.leverageSelect.options)option.disabled=Number(option.value)>=2&&!unlocked;
        if(!unlocked){if(this.leverage>=2){this.leverage=1;this.leverageSelect.value='1';}this.shortMode=false;this.modeSelect.value='long';}
        this.dialog.querySelector('.training-unlock-hint').textContent=unlocked?'': '공매도 · 2배 · 3배 · 5배는 레벨 10에서 해금됩니다.';
        this.dialog.querySelector('[data-buy]').textContent=this.shortMode?'공매도':'매수';
        const set=(selector,value)=>this.dialog.querySelector(selector).textContent=value;
        set('[data-name]',stock.name);set('[data-price]',`${stock.price.toLocaleString()}G`);set('[data-sector]',`${SECTORS[stock.sector]?.name||''} · ${stock.id}`);
        set('[data-cash]',`${this.engine.cash.toLocaleString()}G`);
        if(this.desktopMode)set('[data-watch]',this.watchlist.has(stock.id)?'★ 관심 종목':'☆ 관심 등록');
        if(this.infoBody)this.renderInfo(stock);
        const qty=Math.max(1,Math.floor(Number(this.dialog.querySelector('[type=number]').value)||1));
        const quote=this.usesServerOrders ? null : this.engine.getExecutionPreview?.(this.shortMode?'short':'buy',stock.id,qty,this.leverage,'brokerage');
        set('[data-total]',quote ? `${quote.total.toLocaleString()}G (수수료 ${quote.fee.toLocaleString()}G · ${(quote.feeRate * 100).toFixed(3)}% 포함) · 예상 ${quote.quantity}/${qty}주 · 평균 ${quote.averagePrice.toLocaleString(undefined,{maximumFractionDigits:2})}G${quote.remaining ? " · 잔량 취소" : ""}` : `${Math.round(stock.price*qty/this.leverage).toLocaleString()}G (증거금 · ${this.leverage}배)`);
        this.chart.render(this.engine.priceHistory.get(stock.id)||[]);
        const book=this.dialog.querySelector('.training-book');book.replaceChildren();
        const orders=this.engine.getOrderBook(stock.id);
        for(const [label,rows] of [['매도',orders?.asks||[]],['매수',orders?.bids||[]]]){const column=this.desktopMode?document.createElement('section'):book;if(this.desktopMode){const title=document.createElement('h3');title.textContent=`${label} 호가`;title.style.color=label==='매도'?'#7abbff':'#ff929c';column.append(title);book.append(column);}for(const row of rows.slice(0,5)){
            const line=document.createElement('div');line.textContent=`${Number(row.price).toLocaleString()}G   ·   ${row.qty??row.quantity??row.volume??row.vol??0}주`;if(!this.desktopMode)line.textContent=`${label} ${line.textContent}`;column.append(line);
        }}
        const portfolio=this.dialog.querySelector('.training-portfolio');portfolio.replaceChildren();
        for(const position of this.engine.portfolio.values()){
            const line=document.createElement('div');line.textContent=`${this.engine.stocks.get(position.id)?.name||position.id} · ${position.qty??position.quantity??0}주`;portfolio.append(line);
        }
        if(!portfolio.childElementCount)portfolio.textContent='보유 종목이 없습니다.';
        if(this.desktopMode){portfolio.replaceChildren();const position=this.engine.getState().portfolio.find(item=>item.id===this.selected);const line=document.createElement('p');line.style.cssText='line-height:1.9;color:#b4cadb';line.textContent=position?`${stock.name} · ${position.qty}주\n평균 매수가 ${Math.round(position.avgPrice).toLocaleString()}G · 평가손익 ${Math.round(position.profitLoss).toLocaleString()}G`:`${stock.name} 보유 수량 0주`;portfolio.append(line);}
    }
    renderInfo(stock){
        const related=(this.engine.news||[]).filter(news=>news.stockId===stock.id||news.sector===stock.sector).slice(0,3);
        const signature=JSON.stringify([stock.id,related]);if(signature===this.infoSignature)return;this.infoSignature=signature;
        this.infoBody.replaceChildren();
        const description=document.createElement('p');description.textContent=stock.richDesc||stock.desc||'등록된 기업 설명이 없습니다.';description.style.cssText='line-height:1.7;color:#c1d3df';this.infoBody.append(description);
        const metrics=document.createElement('div');metrics.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px';
        const number=(value,suffix='')=>Number.isFinite(value)?`${value.toLocaleString()}${suffix}`:'정보 없음';
        const risk={Low:'낮음',Mid:'보통',High:'높음'};
        for(const [label,value,tip] of [
            ['업종',SECTORS[stock.sector]?.name||stock.sector,'기업의 사업 분야'],
            ['위험도',risk[stock.risk]||stock.risk||'정보 없음','게임에 설정된 종목 위험도'],
            ['시가총액',stock.marketCap||'정보 없음','게임 설정에 등록된 기업 규모'],
            ['발행 주식',stock.totalSupply||'정보 없음','등록된 주식 수'],
            ['PER',number(stock.per,'배'),'주가수익비율 · 이익에 비해 주가가 얼마나 높은지 나타내는 지표'],
            ['PBR',number(stock.pbr,'배'),'주가순자산비율 · 순자산 대비 주가 수준'],
            ['ROE',number(stock.roe,'%'),'자기자본이익률 · 자본 대비 이익을 내는 정도'],
            ['배당률',number(Number.isFinite(stock.dividend)?stock.dividend*100:undefined,'%'),'게임에 등록된 배당률']
        ]){const card=document.createElement('div');card.title=tip;card.style.cssText='padding:12px;background:#0b1b2b;border-radius:8px';const caption=document.createElement('small');caption.textContent=label;caption.style.cssText='display:block;color:#90aabd;letter-spacing:0;margin-bottom:6px';const valueLabel=document.createElement('strong');valueLabel.textContent=value;valueLabel.style.fontSize='14px';card.append(caption,valueLabel);metrics.append(card);}this.infoBody.append(metrics);
        const note=document.createElement('p');note.textContent='게임 설정 지표 · 실시간 가격에 따라 재계산되는 수치는 아닙니다. 지표 이름에 마우스를 올리면 설명을 볼 수 있습니다.';note.style.cssText='font-size:12px;line-height:1.6;color:#8faabc';this.infoBody.append(note);
        const newsTitle=document.createElement('h3');newsTitle.textContent='관련 뉴스 · 가상 시장';this.infoBody.append(newsTitle);
        if(!related.length){const empty=document.createElement('p');empty.textContent='현재 이 종목과 업종에 등록된 뉴스가 없습니다.';empty.style.color='#91a9bc';this.infoBody.append(empty);}
        for(const news of related){const article=document.createElement('article');article.style.cssText='padding:12px 0;border-top:1px solid #2c485b';const heading=document.createElement('strong');heading.textContent=news.title;const text=document.createElement('p');text.textContent=news.content||'';text.style.cssText='font-size:13px;line-height:1.6;color:#b4cad9;margin:8px 0';const meta=document.createElement('small');meta.textContent=`${news.stockId===stock.id?'종목 관련':'업종 관련'} · ${news.time||''} · ${news.type||'뉴스'}${news.credibility?` · ${news.credibility}`:''}`;meta.style.cssText='letter-spacing:0;color:#8faabc';article.append(heading,text,meta);this.infoBody.append(article);}
    }
    order(side){
        const input=this.dialog.querySelector('[type=number]');if(!input.reportValidity())return;
        const qty=Number(input.value);if(!Number.isSafeInteger(qty)||qty<1)return;
        if((this.shortMode||this.leverage>=2)&&!this.engine.isLevel10Unlocked){this.dialog.querySelector('.training-result').textContent='레벨 10 해금 후 이용할 수 있습니다.';return;}
        const result=side==='buy'?(this.shortMode?this.engine.shortStock(this.selected,qty,this.leverage,'brokerage'):this.engine.buyStock(this.selected,qty,this.leverage,'brokerage')):this.engine.sellStock(this.selected,qty,'brokerage');
        this.dialog.querySelector('.training-result').textContent=result.msg;this.render();
    }
    renderAccount(){
        this.account.hidden=!this.accountVisible;if(!this.accountVisible)return;
        const state=this.engine.getState(),money=n=>`${Math.round(n).toLocaleString()}G`;
        this.account.replaceChildren();
        const title=document.createElement('h3');title.textContent='내 계좌';this.account.append(title);
        const cards=document.createElement('div');cards.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px';
        for(const [label,value] of [['총 자산',state.totalNetWorth],['보유 현금',state.cash],['보유 평가액',state.portfolioValue],['평가손익',state.totalProfitLoss]]){
            const card=document.createElement('div');card.style.cssText='padding:16px;background:#0b1a2b;border:1px solid #2b435a;border-radius:10px';
            const caption=document.createElement('small');caption.textContent=label;caption.style.cssText='display:block;color:#90a8bd;letter-spacing:0;margin-bottom:8px';
            const amount=document.createElement('strong');amount.textContent=money(value);amount.style.cssText=`font-size:22px;color:${label==='평가손익'?(value<0?'#79b8ff':'#ff939c'):'#f5d583'}`;card.append(caption,amount);cards.append(card);
        }this.account.append(cards);
        for(const item of state.portfolio){
            const row=document.createElement('p');row.textContent=`${item.name||this.engine.stocks.get(item.id)?.name} · ${item.isShort?'공매도':'매수'} ${item.leverage}배 · ${item.qty}주 · 평균가 ${money(item.avgPrice)} · 평가손익 ${money(item.profitLoss)}`;this.account.append(row);
        }
        if(!state.portfolio.length){const empty=document.createElement('p');empty.textContent='보유 종목이 없습니다.';this.account.append(empty);}
    }
}





