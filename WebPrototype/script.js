// ==========================================
// StockWars: Cozy & Cyber Prototype Script
// ==========================================

// 1. 초기 전역 상태 관리
let gold = 85000; // 보유 현금
let accumulatedPnl = 0; // 누적 실현 손익
let totalFeePaid = 0; // 누적 거래 수수료

// 종목 데이터베이스
const stocks = [
    { id: 'cipher', name: '사이퍼 증권', sector: 'IT', price: 15000, oldPrice: 15000, shares: 0, avgPrice: 0, history: [14500, 14700, 14600, 14900, 15000] },
    { id: 'neon', name: '네온 물류', sector: 'BIO', price: 8200, oldPrice: 8200, shares: 0, avgPrice: 0, history: [8500, 8300, 8400, 8100, 8200] },
    { id: 'cozy', name: '빈티지 가구', sector: 'IT', price: 3400, oldPrice: 3400, shares: 0, avgPrice: 0, history: [3200, 3300, 3100, 3500, 3400] },
    { id: 'space', name: '스타파이어 항공', sector: 'SPACE', price: 42000, oldPrice: 42000, shares: 0, avgPrice: 0, history: [41000, 43000, 42500, 41500, 42000] }
];

// 가상 이메일 보관함
let emails = [
    { id: 1, sender: '시스템 관리자', subject: '웰컴 트레이더 출입증 등록 완료', body: '환영합니다! 귀하의 Lv.3 트레이딩 룸 등록이 완료되었습니다. \n매주 월요일 유지비(2,800 G)가 청구되니 계좌 잔고 관리에 유의하시기 바랍니다. \n오늘도 풍성한 수확을 기원합니다. \n\n- 사이퍼 네트워크 재무팀', read: false, time: '오전 09:15', type: 'system' },
    { id: 2, sender: '줄리안 (가구점)', subject: '아케이드 가구 입고 소식!', body: '사장님! 이번 주에 8비트 감성의 아케이드 게임 책상과 네온 조명이 새로 들어왔어요. \n오피스를 멋지게 꾸미면 분석 효율도 올라가니 바쁘시더라도 한번 매장에 들러주세요! \n\n- 줄리안 올림', read: true, time: '오전 10:20', type: 'social' }
];

// 가상 찌라시 보관함
let rumors = [
    { id: 1, text: '[IT] 사이퍼 증권 내부 거래 속도 개선 알고리즘이 내일 발표된다는 소문이 있습니다. (신뢰도: 中)' }
];

// 경제 뉴스 템플릿 풀 (랜덤 발동용)
const newsTemplates = [
    { text: '사이퍼 증권, 차세대 분산 원장 알고리즘 전격 도입 소식에 시장 거래량 30% 폭증!', type: 'up', target: 'cipher', sector: 'IT' },
    { text: '네온 물류, 대규모 바이오 신약 콜드체인 수송 계약 체결로 글로벌 인프라 확장!', type: 'up', target: 'neon', sector: 'BIO' },
    { text: '스타파이어 항공, 기상 악화로 다음 세대 인공위성 발사 일정 3일 연기 발표.', type: 'down', target: 'space', sector: 'SPACE' },
    { text: '빈티지 가구, 뉴 코지 테마 가구 세트 판매량 신기록 달성 소식에 마진율 상승.', type: 'up', target: 'cozy', sector: 'IT' },
    { text: '글로벌 해킹 그룹의 금융망 공격 루머로 인해 사이퍼 증권사 일시적 서버 과부하 우려.', type: 'down', target: 'cipher', sector: 'IT' },
    { text: '스타파이어 항공, 우주 정거장 보급 도킹 성공 소식에 관련 업계 지수 동반 상승.', type: 'up', target: 'space', sector: 'SPACE' }
];

let activeNews = [];

// 스마트폰 라우팅 상태
let currentApp = 'home';
let currentCipherTab = 'home';
let selectedStockId = 'cipher';
let selectedSector = 'ALL';

// VI 상태 관리
let viActive = false;
let viTimeRemaining = 0;
let viTimerId = null;

// 비밀 메일 파기 상태 관리
let mailDestructActive = false;
let mailDestructTime = 10;
let mailDestructTimerId = null;

// ==========================================
// 2. 초기 기동 및 화면 드로잉
// ==========================================

window.onload = function () {
    // 폰 상태 시간 갱신
    updatePhoneTime();
    setInterval(updatePhoneTime, 30000);

    // 초기 화면 그리기
    renderMarketStocks();
    renderHoldings();
    renderNews();
    renderMails();
    renderMemos();
    updateUI();

    // 2.5초마다 주가 및 지수 틱 갱신 시작
    setInterval(tickMarket, 2500);
};

// 폰 상단 상태바 시간 동기화
function updatePhoneTime() {
    const now = new Date();
    let hrs = now.getHours().toString().padStart(2, '0');
    let mins = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('phone-time').innerText = `${hrs}:${mins}`;
}

// 오디오 효과음 비주얼 토스트 연출
function playSFX(emoji, text) {
    const toast = document.getElementById('audio-sfx-toast');
    toast.innerHTML = `<span>${emoji}</span> ${text}`;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 1200);
}

// 6종 앱 라우터
function openApp(appId) {
    playSFX('📱', '앱 실행');

    // 이전 메일 타이머 돌고 있다면 강제 종료 방지
    if (appId !== 'mail' && mailDestructActive) {
        // 다른 앱으로 가도 타이머는 계속 돌게 두되 UI 뷰만 스위치
    }

    // 뷰 전환
    document.querySelectorAll('.phone-screen > .phone-view').forEach(v => {
        v.classList.remove('active');
    });

    const targetView = document.getElementById(`view-${appId}`);
    if (targetView) {
        targetView.classList.add('active');
    }

    currentApp = appId;

    // 헤더 타이틀 교체
    let appTitle = '스마트폰 홈';
    if (appId === 'cipher-m') appTitle = '사이퍼 M';
    else if (appId === 'mail') appTitle = '메일 보관함';
    else if (appId === 'memo') appTitle = '찌라시 보관함';
    else if (appId === 'social') appTitle = 'Social 메신저';
    else if (appId === 'badge') appTitle = '업적 & 배지';
    else if (appId === 'option') appTitle = '설정';

    document.getElementById('phone-header-title').innerText = appTitle;

    // 뱃지 업데이트
    if (appId === 'mail') {
        emails.forEach(e => e.read = true);
        document.getElementById('mail-badge').style.display = 'none';
        renderMails();
    }
    if (appId === 'memo') {
        document.getElementById('memo-badge').style.display = 'none';
    }

    updateUI();
}

// 홈 화면으로 돌아가기 (물리 홈버튼 클릭)
function backToHome() {
    playSFX('🏠', '홈 화면');
    document.querySelectorAll('.phone-screen > .phone-view').forEach(v => {
        v.classList.remove('active');
    });
    document.getElementById('view-home').classList.add('active');
    document.getElementById('phone-header-title').innerText = '스마트폰 홈';
    currentApp = 'home';

    // 메일 내용 상세 뷰 열려있었다면 초기화
    showMailList();
}

// 마우스 호버 시 폰 헤더 텍스트 임시 갱신
function setPhoneHeader(title) {
    document.getElementById('phone-header-title').innerText = title;
}

function resetPhoneHeader() {
    let appTitle = '스마트폰 홈';
    if (currentApp === 'cipher-m') appTitle = '사이퍼 M';
    else if (currentApp === 'mail') appTitle = '메일 보관함';
    else if (currentApp === 'memo') appTitle = '찌라시 보관함';
    else if (currentApp === 'social') appTitle = 'Social 메신저';
    else if (currentApp === 'badge') appTitle = '업적 & 배지';
    else if (currentApp === 'option') appTitle = '설정';
    document.getElementById('phone-header-title').innerText = appTitle;
}

// ==========================================
// 3. 사이퍼 M (Cipher M) 메인 로직
// ==========================================

// 사이퍼 M 내부 서브 탭 스위칭
function switchCipherTab(tabId) {
    playSFX('🔘', '탭 전환');
    document.querySelectorAll('.cipher-content-wrapper > .cipher-tab-view').forEach(v => {
        v.classList.remove('active');
    });
    document.getElementById(`cipher-tab-${tabId}`).classList.add('active');

    // 탭 하단 아이콘 하이라이트
    document.querySelectorAll('.cipher-nav-bar > .nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // 클릭된 탭 아이템 활성화
    const tabIndexMap = { 'home': 0, 'market': 1, 'trade': 2, 'holdings': 3, 'news': 4 };
    document.querySelectorAll('.cipher-nav-bar > .nav-item')[tabIndexMap[tabId]].classList.add('active');

    currentCipherTab = tabId;

    if (tabId === 'trade') {
        selectStockForTrade(selectedStockId);
    }

    updateUI();
}

// 거래(Trade)할 특정 종목 선택 연동
function selectStockForTrade(stockId) {
    selectedStockId = stockId;
    const stock = stocks.find(s => s.id === stockId);

    // 거래창 헤더 그리기
    document.getElementById('trade-name').innerText = stock.name;
    document.getElementById('trade-price').innerText = formatMoney(stock.price);

    const diff = stock.price - stock.oldPrice;
    const percent = stock.oldPrice > 0 ? (diff / stock.oldPrice) * 100 : 0;
    const changeSpan = document.getElementById('trade-change');
    changeSpan.innerText = `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
    changeSpan.className = `trade-stock-percent ${percent >= 0 ? 'up' : 'down'}`;

    // 호가창(Orderbook) 업데이트
    renderOrderbook(stock.price);

    // 슬라이더 및 주문 예상 금액 계산
    calculateTradeTotal();

    // 차트선 갱신
    drawTradeChart(stock);
}

// 호가창 5단계 그리기
function renderOrderbook(basePrice) {
    const obPanel = document.querySelector('.orderbook-panel');
    obPanel.innerHTML = '';

    const steps = [1.02, 1.01, 1.0, 0.99, 0.98];
    const volumes = [120, 310, 850, 480, 210];

    steps.forEach((multiplier, i) => {
        const price = Math.round(basePrice * multiplier);
        const vol = Math.round(volumes[i] * (0.8 + Math.random() * 0.4));
        const isAsk = multiplier > 1.0;
        const isBid = multiplier < 1.0;
        const isActive = multiplier === 1.0;

        const row = document.createElement('div');
        row.className = `orderbook-row ${isAsk ? 'ask' : isBid ? 'bid' : 'active'}`;
        row.onclick = () => setOrderPrice(price);
        row.innerHTML = `
            <span class="ob-p">${price.toLocaleString()}</span>
            <span class="ob-v">${vol}</span>
        `;
        obPanel.appendChild(row);
    });
}

// 호가 클릭 시 현재 수량 기준으로 예상 총액 계산
function setOrderPrice(price) {
    playSFX('🖱️', '호가 지정');
    const stock = stocks.find(s => s.id === selectedStockId);
    stock.price = price; // 현재 주문 단가로 임시 조정
    document.getElementById('trade-price').innerText = formatMoney(price);
    calculateTradeTotal();
}

// 주문 예상 총금액 계산
function calculateTradeTotal() {
    const qty = parseInt(document.getElementById('trade-qty').value) || 0;
    const stock = stocks.find(s => s.id === selectedStockId);
    const total = qty * stock.price;
    const fee = Math.round(total * 0.0015); // 거래 수수료 0.15%

    document.getElementById('estimated-total').innerText = formatMoney(total + fee) + ` (수수료 ${fee}G 포함)`;

    // 물타기 실시간 예상 평단가 및 헬퍼 버튼 연동
    const avgDownBtnRow = document.getElementById('average-down-btn-row');
    const avgDownPreviewRow = document.getElementById('average-down-preview-row');

    if (stock.shares > 0) {
        avgDownBtnRow.style.display = 'block';
        avgDownPreviewRow.style.display = 'flex';

        // 신규 평단 계산: (기존 보유 평가액 + 신규 매수액) / (기존 수량 + 신규 수량)
        const currentValuation = stock.shares * stock.avgPrice;
        const newBuyValuation = qty * stock.price;
        const newQty = stock.shares + qty;
        const estimatedAvg = newQty > 0 ? Math.round((currentValuation + newBuyValuation) / newQty) : 0;

        document.getElementById('estimated-avg-price').innerText = formatMoney(estimatedAvg);
    } else {
        avgDownBtnRow.style.display = 'none';
        avgDownPreviewRow.style.display = 'none';
    }
}

// 수량 비율 퀵 단추 연동
function setRatio(ratio) {
    playSFX('⚡', '수량 조절');
    const stock = stocks.find(s => s.id === selectedStockId);

    // 매수 가능한 최대 수량 계산 (수수료 0.15% 고려)
    const maxAffordable = Math.floor(gold / (stock.price * 1.0015));

    let targetQty = Math.floor(maxAffordable * ratio);
    if (targetQty < 1) targetQty = 1;

    document.getElementById('trade-qty').value = targetQty;
    calculateTradeTotal();
}

// 시장가 매수 주문 실행
function executeBuy() {
    if (viActive) return;

    const stock = stocks.find(s => s.id === selectedStockId);
    const qty = parseInt(document.getElementById('trade-qty').value) || 0;
    const total = qty * stock.price;
    const fee = Math.round(total * 0.0015);
    const cost = total + fee;

    if (cost <= 0) return;

    if (gold >= cost) {
        gold -= cost;
        totalFeePaid += fee;

        // 평단가 계산 법칙: 신규 평단가 = (기존 총액 + 신규 매수액) / (기존 수량 + 신규 수량)
        const oldCost = stock.shares * stock.avgPrice;
        stock.shares += qty;
        stock.avgPrice = Math.round((oldCost + total) / stock.shares);

        playSFX('🪙', `${stock.name} 매수 완료!`);

        updateUI();
        renderHoldings();
        selectStockForTrade(selectedStockId);
    } else {
        playSFX('❌', '잔액이 부족합니다!');
    }
}

// 시장가 매도 주문 실행
function executeSell() {
    if (viActive) return;

    const stock = stocks.find(s => s.id === selectedStockId);
    const qty = parseInt(document.getElementById('trade-qty').value) || 0;

    if (qty <= 0) return;

    if (stock.shares >= qty) {
        const total = qty * stock.price;
        const fee = Math.round(total * 0.0015);
        const revenue = total - fee;

        // 실현 손익 계산: (매도가 - 매수평단가) * 수량 - 거래 수수료
        const pnl = (stock.price - stock.avgPrice) * qty - fee;
        accumulatedPnl += pnl;
        totalFeePaid += fee;

        gold += revenue;
        stock.shares -= qty;

        if (stock.shares === 0) {
            stock.avgPrice = 0;
        }

        playSFX('🔔', `${stock.name} 매도 정산 완료!`);

        updateUI();
        renderHoldings();
        selectStockForTrade(selectedStockId);
    } else {
        playSFX('❌', '보유 수량이 부족합니다!');
    }
}

// 물타기 헬퍼 함수
function applyAverageDownHelper() {
    const stock = stocks.find(s => s.id === selectedStockId);
    if (!stock || stock.shares <= 0) return;

    // 기존 보유 수량만큼 추가 매수를 제안 (물타기 2배)
    let targetQty = stock.shares;

    // 보유 현금 한도 체크 (수수료 0.15% 가산)
    const maxAffordable = Math.floor(gold / (stock.price * 1.0015));
    if (targetQty > maxAffordable) {
        targetQty = maxAffordable;
    }

    if (targetQty < 1) targetQty = 1;

    document.getElementById('trade-qty').value = targetQty;
    calculateTradeTotal();
    playSFX('💦', '물타기 수량 자동 산출');

    const dialog = document.getElementById('anna-dialog');
    dialog.innerText = `"사장님! 기존 보유량(${stock.shares}주)에 맞춰 평단가를 효율적으로 희석할 수 있도록 물타기 수량을 설정해 드렸어요."`;
}

let liquidationConfirmTimeout = null;

function resetLiquidationButton() {
    const btn = document.querySelector('.btn-liquidate-all');
    if (btn) {
        btn.classList.remove('confirm-pending');
        btn.innerText = "🚨 포트폴리오 전량 일괄 매도";
    }
}

// 포트폴리오 전량 일괄 매도 (더블 클릭 안전 승인 패턴)
function liquidateAllHoldings() {
    if (viActive) return;

    const ownedStocks = stocks.filter(s => s.shares > 0);
    if (ownedStocks.length === 0) {
        playSFX('❌', '보유한 주식이 없습니다.');
        return;
    }

    const btn = document.querySelector('.btn-liquidate-all');

    if (!btn.classList.contains('confirm-pending')) {
        // 1단계: 승인 대기 상태로 전환
        btn.classList.add('confirm-pending');
        btn.innerText = "⚠️ 정말로 일괄 매도합니까? (다시 클릭)";
        playSFX('⚠️', '매도 승인 대기');

        liquidationConfirmTimeout = setTimeout(() => {
            resetLiquidationButton();
        }, 3000); // 3초 이내 재클릭하지 않으면 원복
        return;
    }

    // 2단계: 실제 매도 수행
    clearTimeout(liquidationConfirmTimeout);
    resetLiquidationButton();

    let totalRevenue = 0;
    let totalFees = 0;
    let totalProfit = 0;
    let count = 0;

    ownedStocks.forEach(stock => {
        const sellVal = stock.shares * stock.price;
        const fee = Math.round(sellVal * 0.0015);
        const pnl = (stock.price - stock.avgPrice) * stock.shares - fee;

        totalRevenue += (sellVal - fee);
        totalFees += fee;
        totalProfit += pnl;

        stock.shares = 0;
        stock.avgPrice = 0;
        count++;
    });

    gold += totalRevenue;
    totalFeePaid += totalFees;
    accumulatedPnl += totalProfit;

    playSFX('🔔', '전체 일괄 매도 완료');
    
    updateUI();
    renderHoldings();
    
    // 주문 탭에 열려있는 종목 정보가 있다면 그것도 갱신
    selectStockForTrade(selectedStockId);

    const dialog = document.getElementById('anna-dialog');
    dialog.innerText = `"보유하고 계시던 모든 주식(${count}종목)을 전량 시장가로 신속히 매도했습니다. 총 ${totalRevenue.toLocaleString()} G의 자금을 안전하게 현금화했어요!"`;
}

// ==========================================
// 4. 주가 변동 및 마켓 틱 (Market Ticking)
// ==========================================

function tickMarket() {
    // 1. 개별 주가 난수 틱 변동
    stocks.forEach(stock => {
        // VI 상태일 경우 가격 고정
        if (viActive && selectedStockId === stock.id) {
            return;
        }

        stock.oldPrice = stock.price;
        const volatility = 0.04; // 기본 변동폭 ±4%
        const changePercent = (Math.random() * volatility * 2) - volatility;
        let newPrice = Math.floor(stock.price * (1 + changePercent));

        if (newPrice < 100) newPrice = 100; // 하한가 안전장치
        stock.price = newPrice;

        // 종목별 역사 가격 배열 갱신 (차트 렌더링용)
        stock.history.push(newPrice);
        if (stock.history.length > 8) stock.history.shift();
    });

    // 2. 글로벌 사이퍼 지수 산출 (시가총액 가중을 간소화하여 평균 지수 연출)
    const totalCurrent = stocks.reduce((sum, s) => sum + s.price, 0);
    const globalIndex = (totalCurrent / 4) * 0.165; // 고정 지수 스케일러 적용

    const indexValSpan = document.getElementById('global-index-val');
    const indexChangeSpan = document.getElementById('global-index-change');

    const oldIndex = parseFloat(indexValSpan.innerText.replace(/,/g, ''));
    const indexDiff = globalIndex - oldIndex;
    const indexPercent = (indexDiff / oldIndex) * 100;

    indexValSpan.innerText = globalIndex.toFixed(2);
    indexChangeSpan.innerText = `${indexDiff >= 0 ? '▲' : '▼'} ${Math.abs(indexDiff).toFixed(2)} (${indexDiff >= 0 ? '+' : ''}${indexPercent.toFixed(2)}%)`;
    indexChangeSpan.className = `ticker-change ${indexDiff >= 0 ? 'up' : 'down'}`;

    // 3. 무작위 실시간 뉴스 돌발 발행 (18% 확률)
    if (Math.random() < 0.18) {
        triggerRandomNews();
    }

    // 4. 활성화된 화면에 따른 실시간 드로잉 갱신
    if (currentApp === 'cipher-m') {
        if (currentCipherTab === 'market') {
            renderMarketStocks();
        } else if (currentCipherTab === 'trade') {
            selectStockForTrade(selectedStockId);
        } else if (currentCipherTab === 'holdings') {
            renderHoldings();
        }
    }
    updateUI();
}

// 무작위 뉴스 발생기 및 시장 충격 시뮬레이션
function triggerRandomNews() {
    const template = newsTemplates[Math.floor(Math.random() * newsTemplates.length)];
    const time = new Date();
    let hrs = time.getHours().toString().padStart(2, '0');
    let mins = time.getMinutes().toString().padStart(2, '0');

    const newsItem = {
        time: `${hrs}:${mins}`,
        sector: template.sector,
        text: template.text,
        type: template.type
    };

    activeNews.unshift(newsItem);
    if (activeNews.length > 10) activeNews.pop();

    // 뉴스 발생 시 타겟 종목에 충격파 적용 (폭등 +10% / 폭락 -10%)
    const stock = stocks.find(s => s.id === template.target);
    if (stock) {
        if (template.type === 'up') {
            stock.price = Math.floor(stock.price * 1.10);
            playSFX('📈', `호재 속보: ${stock.name} 급등!`);
        } else {
            stock.price = Math.floor(stock.price * 0.90);
            playSFX('📉', `악재 속보: ${stock.name} 급락!`);
        }
        stock.history.push(stock.price);
        if (stock.history.length > 8) stock.history.shift();
    }

    // 안나 코멘트 변경 연동
    const dialog = document.getElementById('anna-dialog');
    if (template.type === 'up') {
        dialog.innerText = `\"방금 [${stock.name}]에 아주 좋은 뉴스가 들어왔어요! 가격 흐름이 위로 당겨지고 있네요!\"`;
    } else {
        dialog.innerText = `\"어라... [${stock.name}] 관련해서 시장 소문이 안 좋게 보도되었어요. 조심하셔야겠어요!\"`;
    }

    renderNews();
}

// ==========================================
// 5. 컴포넌트 렌더링 함수들
// ==========================================

// 주식 시장 탭 리스트 출력
function renderMarketStocks() {
    const listContainer = document.getElementById('cipher-market-list');
    listContainer.innerHTML = '';

    stocks.forEach(stock => {
        // 섹터 필터링
        if (selectedSector !== 'ALL' && stock.sector !== selectedSector) return;

        const diff = stock.price - stock.oldPrice;
        const percent = stock.oldPrice > 0 ? (diff / stock.oldPrice) * 100 : 0;
        const isUp = diff >= 0;

        const row = document.createElement('div');
        row.className = 'stock-row';
        row.onclick = () => {
            selectedStockId = stock.id;
            switchCipherTab('trade');
        };

        row.innerHTML = `
            <div class="s-name-col">
                <span class="s-name">${stock.name}</span>
                <span class="s-sector">${stock.sector} 섹터</span>
            </div>
            <div class="s-chart-col">
                <!-- 단순 미니 그래프 데코 -->
                <svg viewBox="0 0 50 20" style="width:100%; height:100%;">
                    <path d="M 0 15 Q 15 ${isUp ? 5 : 18} 30 ${isUp ? 8 : 15} L 50 ${isUp ? 2 : 18}" fill="none" stroke="${isUp ? '#22d3ee' : '#ff6b6b'}" stroke-width="1.5"></path>
                </svg>
            </div>
            <div class="s-price-col">
                <span class="s-price ${isUp ? 'up' : 'down'}">${stock.price.toLocaleString()} G</span>
                <span class="s-change ${isUp ? 'up' : 'down'}">${isUp ? '▲' : '▼'} ${percent.toFixed(2)}%</span>
            </div>
        `;
        listContainer.appendChild(row);
    });
}

// 보유 계좌 탭 종목 목록 출력
function renderHoldings() {
    const listContainer = document.getElementById('cipher-holdings-list');
    listContainer.innerHTML = '';

    const ownedStocks = stocks.filter(s => s.shares > 0);

    if (ownedStocks.length === 0) {
        listContainer.innerHTML = `<div class="no-holdings-placeholder">보유 중인 주식이 없습니다. <br>시장 탭에서 주식을 구매해 보세요!</div>`;
        document.getElementById('holdings-total-val').innerText = '0 G';
        document.getElementById('holdings-total-profit').innerText = '+0 G';
        return;
    }

    let totalValuation = 0;

    ownedStocks.forEach(stock => {
        const currentVal = stock.shares * stock.price;
        totalValuation += currentVal;
        const investCost = stock.shares * stock.avgPrice;
        const profit = currentVal - investCost;
        const profitPercent = investCost > 0 ? (profit / investCost) * 100 : 0;
        const isUp = profit >= 0;

        const card = document.createElement('div');
        card.className = 'h-card';
        card.innerHTML = `
            <div class="h-card-header">
                <span>${stock.name}</span>
                <span class="${isUp ? 'up' : 'down'}">${isUp ? '+' : ''}${profitPercent.toFixed(2)}%</span>
            </div>
            <div class="card-row">
                <span class="h-card-qty">보유량: ${stock.shares}주 (평단 ${stock.avgPrice.toLocaleString()}G)</span>
                <span class="${isUp ? 'up' : 'down'}">${profit >= 0 ? '+' : ''}${profit.toLocaleString()} G</span>
            </div>
        `;
        listContainer.appendChild(card);
    });

    document.getElementById('holdings-total-val').innerText = formatMoney(totalValuation);
    document.getElementById('holdings-total-profit').innerText = `${accumulatedPnl >= 0 ? '+' : ''}${accumulatedPnl.toLocaleString()} G`;
    document.getElementById('holdings-total-fee').innerText = `${totalFeePaid.toLocaleString()} G`;
}

// 뉴스 목록 출력
function renderNews() {
    const feed = document.getElementById('cipher-news-feed');
    feed.innerHTML = '';

    if (activeNews.length === 0) {
        feed.innerHTML = `<div class="no-holdings-placeholder">아직 발표된 뉴스 속보가 없습니다.</div>`;
        return;
    }

    activeNews.forEach(item => {
        const card = document.createElement('div');
        card.className = `news-card ${item.type === 'up' ? 'news-up' : 'news-down'}`;
        card.innerHTML = `
            <div class="news-meta">
                <span>[${item.sector}] 속보 • ${item.time}</span>
                <span class="news-impact-badge ${item.type}">${item.type === 'up' ? '▲ 호재' : '▼ 악재'}</span>
            </div>
            <div class="news-title">${item.text}</div>
        `;
        feed.appendChild(card);
    });
}

// 메일 보관함 리스트 출력
function renderMails() {
    const list = document.getElementById('mail-list-container');
    list.innerHTML = '';

    emails.forEach(email => {
        const item = document.createElement('div');
        item.className = `mail-item ${email.read ? '' : 'unread'}`;
        item.onclick = () => viewMailDetail(email.id);
        item.innerHTML = `
            <div class="mail-meta">
                <span>${email.sender}</span>
                <span>${email.time}</span>
            </div>
            <div class="mail-subject">${email.subject}</div>
            <div class="mail-preview">${email.body}</div>
        `;
        list.appendChild(item);
    });
}

// 메모장(찌라시) 리스트 출력
function renderMemos() {
    const list = document.getElementById('memo-list-container');
    list.innerHTML = '';

    if (rumors.length === 0) {
        list.innerHTML = `<div class="no-memo-placeholder">아직 입수된 찌라시 정보가 없습니다.</div>`;
        return;
    }

    rumors.forEach(r => {
        const card = document.createElement('div');
        card.className = 'memo-card';
        card.innerHTML = `
            <span class="memo-tag">비밀 첩보</span>
            <div class="memo-text">${r.text}</div>
        `;
        list.appendChild(card);
    });
}

// 획득 찌라시 검색창 및 필터 바인딩
function selectSector(sectorName) {
    playSFX('🔘', '섹터 필터');
    selectedSector = sectorName;

    // 알약 버튼 활성화 UI 스왑
    document.querySelectorAll('.sector-tabs > .sector-pill').forEach(pill => {
        pill.classList.remove('active');
    });

    const sectorIndices = { 'ALL': 0, 'IT': 1, 'BIO': 2, 'SPACE': 3 };
    document.querySelectorAll('.sector-tabs > .sector-pill')[sectorIndices[sectorName]].classList.add('active');

    renderMarketStocks();
}

// 검색창 문자 필터링
function filterStocks(query) {
    const listContainer = document.getElementById('cipher-market-list');
    listContainer.innerHTML = '';

    stocks.forEach(stock => {
        if (!stock.name.includes(query)) return;
        if (selectedSector !== 'ALL' && stock.sector !== selectedSector) return;

        const diff = stock.price - stock.oldPrice;
        const percent = stock.oldPrice > 0 ? (diff / stock.oldPrice) * 100 : 0;
        const isUp = diff >= 0;

        const row = document.createElement('div');
        row.className = 'stock-row';
        row.onclick = () => {
            selectedStockId = stock.id;
            switchCipherTab('trade');
        };
        row.innerHTML = `
            <div class="s-name-col">
                <span class="s-name">${stock.name}</span>
                <span class="s-sector">${stock.sector} 섹터</span>
            </div>
            <div class="s-chart-col">
                <svg viewBox="0 0 50 20" style="width:100%; height:100%;">
                    <path d="M 0 15 Q 15 ${isUp ? 5 : 18} 30 ${isUp ? 8 : 15} L 50 ${isUp ? 2 : 18}" fill="none" stroke="${isUp ? '#22d3ee' : '#ff6b6b'}" stroke-width="1.5"></path>
                </svg>
            </div>
            <div class="s-price-col">
                <span class="s-price ${isUp ? 'up' : 'down'}">${stock.price.toLocaleString()} G</span>
                <span class="s-change ${isUp ? 'up' : 'down'}">${isUp ? '▲' : '▼'} ${percent.toFixed(2)}%</span>
            </div>
        `;
        listContainer.appendChild(row);
    });
}

// 거래 라인 차트선 그리기
function drawTradeChart(stock) {
    const svg = document.getElementById('trade-chart-line');
    const points = stock.history;
    const maxVal = Math.max(...points) * 1.05;
    const minVal = Math.min(...points) * 0.95;
    const range = maxVal - minVal;

    let pathD = "";
    const stepX = 200 / (points.length - 1);

    points.forEach((val, i) => {
        const x = i * stepX;
        const y = 80 - ((val - minVal) / range) * 60 - 10; // 패딩 10 포함
        if (i === 0) pathD += `M ${x} ${y} `;
        else pathD += `L ${x} ${y} `;
    });

    const isUp = stock.price >= stock.oldPrice;
    svg.innerHTML = `<path d="${pathD}" fill="none" stroke="${isUp ? '#22d3ee' : '#ff6b6b'}" stroke-width="2.5"></path>`;
}

// ==========================================
// 6. 가방 & 옵션 & 설정 연동
// ==========================================

function updateUI() {
    // 자산 총합 연산
    let stockWorth = 0;
    stocks.forEach(s => { stockWorth += s.price * s.shares; });
    const netWorth = gold + stockWorth;

    // 지갑 및 헤더 동기화
    document.getElementById('cipher-net-worth').innerText = formatMoney(netWorth);
    document.getElementById('cipher-cash').innerText = formatMoney(gold);

    const totalInvestCost = stocks.reduce((sum, s) => sum + (s.shares * s.avgPrice), 0);
    const totalPnl = stockWorth - totalInvestCost;
    const totalPnlPercent = totalInvestCost > 0 ? (totalPnl / totalInvestCost) * 100 : 0;

    const pnlSpan = document.getElementById('cipher-pnl');
    pnlSpan.innerText = `${totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()} G (${totalPnl >= 0 ? '+' : ''}${totalPnlPercent.toFixed(2)}%)`;
    pnlSpan.className = totalPnl >= 0 ? 'up' : 'down';

    // 배지 업적 잠금 해제 조건 체크
    if (netWorth >= 100000) {
        document.getElementById('badge-rich').classList.remove('locked');
        document.getElementById('badge-rich').classList.add('earned');
    }
}

// 화폐 포맷
function formatMoney(amount) {
    return amount.toLocaleString() + ' G';
}

// 설정 앱 - 폰 케이스 스킨 디자인 스왑
function changePhoneSkin(theme) {
    playSFX('⚙️', '테마 색상 스왑');
    const device = document.getElementById('smartphone-device');
    device.className = 'phone';

    document.querySelectorAll('.skin-selector-grid > .skin-pill').forEach(pill => {
        pill.classList.remove('active');
    });

    if (theme === 'mint') {
        device.classList.add('skin-mint');
        document.querySelectorAll('.skin-selector-grid > .skin-pill')[1].classList.add('active');
    } else if (theme === 'dark') {
        device.classList.add('skin-dark');
        document.querySelectorAll('.skin-selector-grid > .skin-pill')[2].classList.add('active');
    } else {
        document.querySelectorAll('.skin-selector-grid > .skin-pill')[0].classList.add('active');
    }
}

// ==========================================
// 7. 메일 앱 - 쉐도우 메일 자동 폭파 로직
// ==========================================

function viewMailDetail(id) {
    playSFX('✉️', '메일 열기');
    const email = emails.find(e => e.id === id);

    document.getElementById('mail-list-container').style.display = 'none';
    const detail = document.getElementById('mail-detail-container');
    detail.style.display = 'flex';
    detail.classList.remove('self-destructed'); // 파괴 효과 리셋

    document.getElementById('mail-det-subject').innerText = email.subject;
    document.getElementById('mail-det-meta').innerText = `보낸이: ${email.sender} | ${email.time}`;
    document.getElementById('mail-det-body').innerText = email.body;

    const timerDiv = document.getElementById('mail-self-destruct-timer');

    // 폭파 비밀 메일인지 검증
    if (email.type === 'shadow') {
        timerDiv.style.display = 'block';
        mailDestructActive = true;
        mailDestructTime = 10;
        timerDiv.innerText = `🚨 이 쉐도우 비밀 메일은 10초 후에 자동 파기됩니다!`;

        // 이전 실행되던 타이머 삭제
        if (mailDestructTimerId) clearInterval(mailDestructTimerId);

        mailDestructTimerId = setInterval(() => {
            mailDestructTime--;
            timerDiv.innerText = `🚨 이 쉐도우 비밀 메일은 ${mailDestructTime}초 후에 자동 파기됩니다!`;

            if (mailDestructTime <= 3) {
                playSFX('⚠️', '비밀 메일 폭발 대기');
            }

            if (mailDestructTime <= 0) {
                clearInterval(mailDestructTimerId);
                triggerMailSelfDestruction(email.id);
            }
        }, 1000);
    } else {
        timerDiv.style.display = 'none';
        mailDestructActive = false;
        if (mailDestructTimerId) clearInterval(mailDestructTimerId);
    }
}

function showMailList() {
    document.getElementById('mail-detail-container').style.display = 'none';
    document.getElementById('mail-list-container').style.display = 'flex';

    if (mailDestructTimerId) {
        clearInterval(mailDestructTimerId);
    }
    mailDestructActive = false;
}

// 메일 폭파 파괴 애니메이션 실행
function triggerMailSelfDestruction(mailId) {
    const detail = document.getElementById('mail-detail-container');
    detail.classList.add('self-destructed');

    playSFX('💥', '쉐도우 메일 자동 파기 완료!');

    setTimeout(() => {
        // 메일 리스트에서 해당 메일 완전 제거
        emails = emails.filter(e => e.id !== mailId);
        renderMails();
        showMailList();

        const dialog = document.getElementById('anna-dialog');
        dialog.innerText = `"헉! 방금 메일이 혼자 펑 하고 사라졌어요! 쉐도우의 비밀 지령 메일이었나 봐요... 무서워라."`;
    }, 500);
}

// ==========================================
// 8. 메신저 소셜 대화 입력 처리
// ==========================================

function handleChatKeyPress(e) {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chat-input-text');
    const msg = input.value.trim();
    if (!msg) return;

    playSFX('📤', '메시지 전송');

    const chatBox = document.getElementById('chat-box');

    // 내 메시지 렌더링
    const myMsg = document.createElement('div');
    myMsg.className = 'msg sent';
    myMsg.innerHTML = `<div class="msg-bubble">${msg}</div>`;
    chatBox.appendChild(myMsg);

    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // 1초 뒤 줄리안의 가상 자동 응답
    setTimeout(() => {
        playSFX('📥', '메시지 수신');
        const reply = document.createElement('div');
        reply.className = 'msg received';

        let replyText = "네? 자세히 못 들었습니다. ㅎㅎ 가구 상점으로 놀러 오세요!";
        if (msg.includes('가구') || msg.includes('할인')) {
            replyText = "할인은 단골 트레이더님께 당연히 해드리죠! 전용 접견실 가구도 입고됐으니 보러 오세요!";
        } else if (msg.includes('돈') || msg.includes('주식') || msg.includes('사이퍼')) {
            replyText = "주식 대박 나시면 최고급 황금 엠퍼러 체어(55,000G) 하나 들여놓으시는 겁니다!";
        }

        reply.innerHTML = `
            <span class="msg-sender">줄리안</span>
            <div class="msg-bubble">${replyText}</div>
        `;
        chatBox.appendChild(reply);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1200);
}

// ==========================================
// 9. 시뮬레이션 제어판 트리거 핸들러
// ==========================================

// 🚨 VI 발동 시뮬레이션 트리거
function triggerVI_Simulation() {
    if (viActive) return; // 중복 발동 방지

    playSFX('🚨', 'VI 사이렌 긴급 경보 발동!');
    viActive = true;
    viTimeRemaining = 15; // 시연을 위해 15초 세팅

    // 1. UI 비상 모드 노출
    document.getElementById('vi-banner').style.display = 'block';
    document.getElementById('vi-banner').innerText = `🚨 [VI WARNING] 급격한 시세 변동! 거래 정지 15.0s`;
    document.getElementById('vi-siren-anim').style.display = 'block';
    document.querySelector('.trade-chart-box').classList.add('vi-active');

    // 2. 주문 매수/매도 버튼 잠금
    document.getElementById('btn-trade-buy').disabled = true;
    document.getElementById('btn-trade-sell').disabled = true;

    // 3. 안나 전용 코멘트 스왑
    const dialog = document.getElementById('anna-dialog');
    dialog.innerText = `"사장님! [${stocks.find(s => s.id === selectedStockId).name}]에 변동성 완화 장치(VI) 사이렌이 켜졌어요! 30초간 거래가 멈추니 대기해 주세요!"`;

    // 4. 타이머 루프
    if (viTimerId) clearInterval(viTimerId);
    viTimerId = setInterval(() => {
        viTimeRemaining -= 0.5;
        document.getElementById('vi-banner').innerText = `🚨 [VI WARNING] 급격한 시세 변동! 거래 정지 ${viTimeRemaining.toFixed(1)}s`;

        if (viTimeRemaining <= 0) {
            clearInterval(viTimerId);
            viActive = false;

            // UI 복구
            document.getElementById('vi-banner').style.display = 'none';
            document.getElementById('vi-siren-anim').style.display = 'none';
            document.querySelector('.trade-chart-box').classList.remove('vi-active');

            document.getElementById('btn-trade-buy').disabled = false;
            document.getElementById('btn-trade-sell').disabled = false;

            playSFX('🟢', '거래 재개');
            dialog.innerText = `"휴, 거래 정지가 풀렸어요. 바로 가격 추이를 확인해 매매를 결정하세요!"`;
        }
    }, 500);
}

// ✉️ 가상 비밀 메일 수신 시뮬레이션
function triggerShadowMail() {
    playSFX('📬', '비밀 메일 도착');

    // 쉐도우 비밀 메일 객체 생성
    const newMail = {
        id: Date.now(),
        sender: '👤 쉐도우 (Shadow)',
        subject: '[비밀] 미드나잇 펍 찌라시 딜러 접선 요강',
        body: '※ 본 내용은 대외비입니다. \n\n내일 23:00 미드나잇 펍의 구석 어두운 바 테이블에서 주점 주인 안드레가 찌라시 거래를 제안할 것입니다. \n\n그가 요구할 거래 정보 비용(8,000 G)을 확보해 두십시오. \n\n본 메일은 읽는 순간 추적 방지를 위해 10초 후에 자동 완전 파기됩니다.',
        read: false,
        time: '방금 전',
        type: 'shadow'
    };

    emails.unshift(newMail);

    // 뱃지 알림 켜기
    const badge = document.getElementById('mail-badge');
    badge.innerText = parseInt(badge.innerText || 0) + 1;
    badge.style.display = 'flex';

    const dialog = document.getElementById('anna-dialog');
    dialog.innerText = `"사장님! 발신인을 알 수 없는 이상한 비밀 편지가 왔어요. 한번 확인해 보세요!"`;

    renderMails();
}

// 🕵️ 가상 주점 찌라시 획득 시뮬레이션
function triggerRumorAcquisition() {
    playSFX('📝', '찌라시 정보 획득');

    const newRumor = {
        id: Date.now(),
        text: `[SPACE] 스타파이어 항공의 다음 주 정부 합작 대형 위성 수주 입찰 단독 참여 소식이 확인되었습니다. (신뢰도: 高)`
    };

    rumors.unshift(newRumor);

    const badge = document.getElementById('memo-badge');
    badge.innerText = parseInt(badge.innerText || 0) + 1;
    badge.style.display = 'flex';

    const dialog = document.getElementById('anna-dialog');
    dialog.innerText = `"미드나잇 펍의 주인 안드레에게 입수한 최신 첩보가 스마트폰 메모장에 기록되었어요!"`;

    renderMemos();
}
