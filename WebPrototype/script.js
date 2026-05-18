let gold = 10000;

const stocks = [
    { id: 'cipher', name: '사이퍼 증권', price: 1500, shares: 0, oldPrice: 1500 },
    { id: 'neon', name: '네온 물류', price: 800, shares: 0, oldPrice: 800 },
    { id: 'cozy', name: '빈티지 가구', price: 3200, shares: 0, oldPrice: 3200 }
];

function formatMoney(amount) {
    return amount.toLocaleString() + ' G';
}

function updateWallet() {
    let portfolioValue = 0;
    stocks.forEach(s => { portfolioValue += s.price * s.shares; });
    const netWorth = gold + portfolioValue;
    
    document.getElementById('gold').innerText = formatMoney(gold);
    document.getElementById('net-worth').innerText = formatMoney(netWorth);
    
    // 버튼 상태 갱신을 위해 렌더링 호출
    renderStocks();
}

function buyStock(id) {
    const stock = stocks.find(s => s.id === id);
    if (gold >= stock.price) {
        gold -= stock.price;
        stock.shares += 1;
        updateWallet();
    }
}

function sellStock(id) {
    const stock = stocks.find(s => s.id === id);
    if (stock.shares > 0) {
        gold += stock.price;
        stock.shares -= 1;
        updateWallet();
    }
}

function renderStocks() {
    const container = document.getElementById('stock-list');
    container.innerHTML = '';
    
    stocks.forEach(stock => {
        const diff = stock.price - stock.oldPrice;
        const diffClass = diff >= 0 ? 'up' : 'down';
        const diffSymbol = diff >= 0 ? '▲' : '▼';
        
        let percent = 0;
        if(stock.oldPrice > 0) {
            percent = (Math.abs(diff) / stock.oldPrice) * 100;
        }
        
        const card = document.createElement('div');
        card.className = 'stock-card';
        card.innerHTML = `
            <div class="stock-info">
                <div class="stock-name">${stock.name}</div>
                <div class="stock-shares">보유량: <strong>${stock.shares}</strong> 주</div>
            </div>
            <div class="stock-price-section">
                <div class="stock-price ${diffClass}">${formatMoney(stock.price)}</div>
                <div class="stock-diff ${diffClass}">${diffSymbol} ${Math.abs(diff)} (${percent.toFixed(2)}%)</div>
            </div>
            <div class="stock-actions">
                <button class="btn-buy" onclick="buyStock('${stock.id}')" ${gold < stock.price ? 'disabled' : ''}>매수</button>
                <button class="btn-sell" onclick="sellStock('${stock.id}')" ${stock.shares === 0 ? 'disabled' : ''}>매도</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function tick() {
    stocks.forEach(stock => {
        stock.oldPrice = stock.price;
        // 난수 기반 미니 변동성 로직 (-5% ~ +5%)
        const volatility = 0.05; 
        const changePercent = (Math.random() * volatility * 2) - volatility;
        let newPrice = Math.floor(stock.price * (1 + changePercent));
        
        // 최소가 보장
        if (newPrice < 10) newPrice = 10;
        
        stock.price = newPrice;
    });
    
    renderStocks();
    updateWallet();
}

// 초기화
renderStocks();
updateWallet();
// 2초마다 틱 갱신 (1시간 경과 시뮬레이션)
setInterval(tick, 2000);
