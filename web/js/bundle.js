/**
 * StockWars Web Demo - Complete Self-Contained Bundle
 * Features: Smartphone OS Shell, Stock HTS, Interactive Charts, 5-Tier Orderbook,
 * Stock Info Panel (기업 정보), News Detail Modal (뉴스 상세), 7-Day Settlement,
 * Short Selling (공매도) & Margin Leverage (1x/2x/3x/5x), Level 20 Unlock Toggle.
 */

(function() {
    // 1. DATA DEFINITIONS
    const SECTORS = {
        IT: { name: 'IT/기술', color: '#00e5ff', bg: 'rgba(0, 229, 255, 0.15)', icon: '💻' },
        Entertainment: { name: '엔터/미디어', color: '#ff4081', bg: 'rgba(255, 64, 129, 0.15)', icon: '🎬' },
        Infrastructure: { name: '인프라/통신', color: '#e0a96d', bg: 'rgba(224, 169, 109, 0.15)', icon: '🌐' },
        Bio: { name: '바이오/제약', color: '#00e676', bg: 'rgba(0, 230, 118, 0.15)', icon: '🧬' },
        Aerospace: { name: '우주/항공', color: '#b388ff', bg: 'rgba(179, 136, 255, 0.15)', icon: '🚀' },
        Retail: { name: '유통/소비재', color: '#1de9b6', bg: 'rgba(29, 233, 182, 0.15)', icon: '🛒' },
        Energy: { name: '에너지/친환경', color: '#ffd600', bg: 'rgba(255, 214, 0, 0.15)', icon: '⚡' },
        Finance: { name: '금융/핀테크', color: '#ff9100', bg: 'rgba(255, 145, 0, 0.15)', icon: '🏦' }
    };

    const INITIAL_STOCKS = [
        {
            id: 'CLOUDBERRY',
            name: '클라우드 베리',
            sector: 'IT',
            price: 850,
            prevPrice: 850,
            risk: 'Low',
            desc: '암호화된 분산 서버 공급 업체. 시장 독점 우량주.',
            richDesc: '클라우드 베리는 도심 스마트 인프라 및 정부 부처에 암호화 분산 클라우드 데이터 센터를 공급하는 독점 기업입니다. 99.99% 이상의 서버 가동률과 견고한 B2G 매출 구조를 자랑합니다.',
            tier: 'C',
            dividend: 0.03,
            per: 14.2,
            pbr: 1.8,
            roe: 12.7,
            marketCap: '8,500억 Gold',
            totalSupply: '1,000,000 주',
            high52: 920,
            low52: 780
        },
        {
            id: 'SYNAPSENET',
            name: '시냅스 망',
            sector: 'IT',
            price: 890,
            prevPrice: 875,
            risk: 'Low',
            desc: '도시 전역의 뉴럴 링크 인프라 구축 기업.',
            richDesc: '도시 전역 초고속 가상 신경망 통신 인프라를 건설하는 대표 기관 주식입니다. 저지연 데이터 전송 특허 40여 개를 소유하고 있습니다.',
            tier: 'C',
            dividend: 0.031,
            per: 15.8,
            pbr: 2.1,
            roe: 13.5,
            marketCap: '10,680억 Gold',
            totalSupply: '1,200,000 주',
            high52: 950,
            low52: 810
        },
        {
            id: 'TECHDOME',
            name: '테크 돔',
            sector: 'IT',
            price: 910,
            prevPrice: 910,
            risk: 'Low',
            desc: '차세대 운영체제 "돔 OS" 독점 공급사.',
            richDesc: '스마트 오피스 및 자율주행 단말용 차세대 보안 OS인 "Dome OS" 개발사로 안정적인 라이선스 수수료를 징수하고 있습니다.',
            tier: 'C',
            dividend: 0.032,
            per: 16.4,
            pbr: 2.3,
            roe: 14.1,
            marketCap: '13,650억 Gold',
            totalSupply: '1,500,000 주',
            high52: 980,
            low52: 840
        },
        {
            id: 'MOMOSOLUTION',
            name: '모모 솔루션',
            sector: 'IT',
            price: 320,
            prevPrice: 310,
            risk: 'Mid',
            desc: '전역 AI 비서 엔진 및 자동화 툴 개발사.',
            richDesc: 'AI 자산 관리 비서 모모(MOMO) 엔진을 개발하는 핀테크/IT 융합 기업입니다. 최근 기관 투자자 수주가 늘어나며 가파른 성장세를 보입니다.',
            tier: 'B',
            dividend: 0.015,
            per: 22.5,
            pbr: 3.4,
            roe: 15.2,
            marketCap: '960억 Gold',
            totalSupply: '300,000 주',
            high52: 410,
            low52: 240
        },
        {
            id: 'PATCHWORK',
            name: '패치워크',
            sector: 'IT',
            price: 110,
            prevPrice: 118,
            risk: 'High',
            desc: '시스템 글리치 및 보안 취약점 패치 소형주.',
            richDesc: '네트워크 위기 상황이나 해킹 글리치 수리를 전담하는 사이버 보안 벤처 기업입니다. 변동성이 크지만 보안 슈팅 이슈 시 주가가 폭등합니다.',
            tier: 'A',
            dividend: 0.002,
            per: 38.1,
            pbr: 4.8,
            roe: 8.9,
            marketCap: '110억 Gold',
            totalSupply: '100,000 주',
            high52: 180,
            low52: 85
        },
        {
            id: 'STARDUST',
            name: '스타더스트',
            sector: 'Entertainment',
            price: 780,
            prevPrice: 760,
            risk: 'Low',
            desc: '글로벌 가상 아이돌 및 IP 매니지먼트사.',
            richDesc: '세계 최고의 버추얼 가상 아이돌 그룹의 음원 및 라이브 콘서트 IP를 독점 소유한 엔터테인먼트 거대 공룡 기업입니다.',
            tier: 'C',
            dividend: 0.028,
            per: 18.3,
            pbr: 2.5,
            roe: 14.8,
            marketCap: '7,800억 Gold',
            totalSupply: '1,000,000 주',
            high52: 860,
            low52: 690
        },
        {
            id: 'STUDIOLUNA',
            name: '스튜디오 루나',
            sector: 'Entertainment',
            price: 290,
            prevPrice: 298,
            risk: 'Mid',
            desc: '픽셀 아트 기반 흥행작 전문 인디 제작사.',
            richDesc: '글로벌 히트 인디 게임 및 애니메이션 개발사입니다. 차작 프로젝트 발표 소식에 따라 거친 주가 변동을 보여주는 중형주입니다.',
            tier: 'B',
            dividend: 0.012,
            per: 24.1,
            pbr: 3.1,
            roe: 13.0,
            marketCap: '870억 Gold',
            totalSupply: '300,000 주',
            high52: 380,
            low52: 210
        },
        {
            id: 'SOCIALMIX',
            name: '소셜 믹스',
            sector: 'Entertainment',
            price: 160,
            prevPrice: 150,
            risk: 'High',
            desc: '짧은 영상 중심 고속 급성장 소셜 네트워크.',
            richDesc: 'MZ세대를 겨냥한 숏폼 트레이딩 알고리즘 미디어 플랫폼입니다. 찌라시 유포와 바이럴 마케팅으로 폭발적인 거래량을 보여줍니다.',
            tier: 'S',
            dividend: 0.002,
            per: 45.2,
            pbr: 5.2,
            roe: 6.4,
            marketCap: '288억 Gold',
            totalSupply: '180,000 주',
            high52: 290,
            low52: 95
        },
        {
            id: 'FORESTLAB',
            name: '포레스트 랩',
            sector: 'Bio',
            price: 650,
            prevPrice: 650,
            risk: 'Low',
            desc: '천연물질 가공 기초 바이오 의약 연구 우량주.',
            richDesc: '천연 추출 기반의 피로 회복제 및 바이오 헬스케어 보급을 전담하는 안정적인 대형 바이오 제약사입니다.',
            tier: 'C',
            dividend: 0.025,
            per: 13.9,
            pbr: 1.6,
            roe: 11.5,
            marketCap: '5,200억 Gold',
            totalSupply: '800,000 주',
            high52: 720,
            low52: 590
        },
        {
            id: 'LIFECURE',
            name: '라이프 큐어',
            sector: 'Bio',
            price: 120,
            prevPrice: 115,
            risk: 'High',
            desc: '난치성 표적 항암제 후보 물질 보유 고위험군.',
            richDesc: '임상 3상 결과를 앞둔 초고위험 잭팟형 바이오 신약 벤처주입니다. 승인 성공 여부에 따라 주가가 수배 뛸 수 있습니다.',
            tier: 'A',
            dividend: 0.0,
            per: 98.0,
            pbr: 8.4,
            roe: -4.2,
            marketCap: '120억 Gold',
            totalSupply: '100,000 주',
            high52: 240,
            low52: 70
        },
        {
            id: 'AURORAAERO',
            name: '오로라 에어로',
            sector: 'Aerospace',
            price: 160,
            prevPrice: 152,
            risk: 'High',
            desc: '민간 우주 체류 및 지구 궤도 호텔 패키지.',
            richDesc: '민간인 대상 저궤도 우주 호텔 1호기 발사 사업을 추진하는 꿈과 희망의 테마주입니다. 찌라시 호재에 민감하게 반응합니다.',
            tier: 'A',
            dividend: 0.0,
            per: 55.4,
            pbr: 6.1,
            roe: 5.1,
            marketCap: '240억 Gold',
            totalSupply: '150,000 주',
            high52: 310,
            low52: 110
        },
        {
            id: 'ECOBATTERY',
            name: '에코 배터리',
            sector: 'Energy',
            price: 210,
            prevPrice: 220,
            risk: 'High',
            desc: '차세대 주력 전고체 전해질 배터리 전용 소재.',
            richDesc: '전기 항공기 및 자율주행 차량에 탑재되는 차세대 전고체 전해질 소재 연구사입니다. 공급망 차질 뉴스에 따라 변동 폭이 큽니다.',
            tier: 'A',
            dividend: 0.003,
            per: 32.1,
            pbr: 4.2,
            roe: 9.8,
            marketCap: '420억 Gold',
            totalSupply: '200,000 주',
            high52: 340,
            low52: 160
        },
        {
            id: 'COZYPAY',
            name: '코지 페이',
            sector: 'Finance',
            price: 900,
            prevPrice: 890,
            risk: 'Low',
            desc: '전 국민 점유 간편 결제 페이 기반 핀테크 주식.',
            richDesc: '스마트 오피스 및 타운 상점 점유율 1위의 간편 결제 플랫폼 기업입니다. 매주 발생하는 엄청난 수수료 수입이 주가 기반이 됩니다.',
            tier: 'C',
            dividend: 0.035,
            per: 15.1,
            pbr: 1.9,
            roe: 15.6,
            marketCap: '10,800억 Gold',
            totalSupply: '1,200,000 주',
            high52: 960,
            low52: 830
        }
    ];

    const INITIAL_NEWS = [
        {
            id: 'NEWS_01',
            title: '클라우드 베리, 전역 차세대 데이터 센터 4기 증설 수주 공식 체결',
            sector: 'IT',
            stockId: 'CLOUDBERRY',
            time: '10분 전',
            content: '클라우드 베리가 스마트 시티 공공 데이터 센터 4기 공급 수주 계약(총액 1,200억 Gold 규모)을 최종 체결했습니다. 공공 기관 서버 납품 독점권이 3년간 연장됨에 따라 영업이익률이 24% 이상 폭증할 것으로 증권가는 전망하고 있습니다.',
            impact: '+5.2%',
            isPositive: true,
            type: '공시',
            credibility: 'High (공식 공시 확인 완료)',
            analystComment: 'B2G 계약에 따른 안정적 실현 매출 확정. 주가 상방 압력 우세.'
        },
        {
            id: 'RUMOR_01',
            title: '[찌라시] 오로라 에어로, 민간 궤도 호텔 1호기 테스트 발사 성공 임박설',
            sector: 'Aerospace',
            stockId: 'AURORAAERO',
            time: '32분 전',
            content: '익명의 우주항공 연구소 관계자에 따르면 오로라 에어로의 민간 우주 호텔 1호기 발사 무인 테스트가 성공적으로 마무리 단계에 진입했다고 합니다. 내주 공식 브리핑에서 민간 예약 가동 일정이 발표될 예정이라는 소문이 증권가를 중심으로 빠르게 퍼지고 있습니다.',
            impact: '+12.4%',
            isPositive: true,
            type: '찌라시',
            credibility: 'Unverified (교증 절차 진행 중)',
            analystComment: '찌라시 성격이 강하나 단기 숏 커버링 및 매수세 유입 가능성 높음.'
        },
        {
            id: 'NEWS_02',
            title: '에코 배터리, 원자재 수급 차질로 3분기 실적 하향 우려',
            sector: 'Energy',
            stockId: 'ECOBATTERY',
            time: '1시간 전',
            content: '희귀 금속 광산 항만 파업으로 전고체 배터리 핵심 전해질 소재 공급망 차질이 가시화되었습니다. 생산 라인의 일시 중단에 따라 3분기 영업이익이 전년 대비 18% 감소할 것으로 예상됩니다.',
            impact: '-4.8%',
            isPositive: false,
            type: '뉴스',
            credibility: 'High (팩트 확인 완료)',
            analystComment: '공급망 해소 전까지 단기 조정을 피하기 어려움.'
        },
        {
            id: 'RUMOR_02',
            title: '[찌라시] 코지 페이, 세이프 뱅크와의 메가 핀테크 지분 교환 타진',
            sector: 'Finance',
            stockId: 'COZYPAY',
            time: '2시간 전',
            content: '금융권 찌라시 찌라시 채널에 따르면 코지 페이가 상업 은행 1위 세이프 뱅크와의 지분 교환을 통한 거대 핀테크 유니콘 연합체 출범을 논의 중이라는 찌라시가 돌고 있습니다. 양사 공식 입장은 무응답입니다.',
            impact: '+8.1%',
            isPositive: true,
            type: '찌라시',
            credibility: 'Tier 1 Rumor (시장 주목도 최상)',
            analystComment: '합병 타진 성공 시 금융 섹터 지각 변동 예상.'
        }
    ];

    // 2. CANVAS CHART RENDERER
    class StockChartRenderer {
        constructor(canvasElement) {
            this.canvas = canvasElement;
            this.ctx = canvasElement.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }

        resize() {
            if (!this.canvas || !this.canvas.parentElement) return;
            const rect = this.canvas.parentElement.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
            this.canvas.style.width = `${rect.width}px`;
            this.canvas.style.height = `${rect.height}px`;
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(dpr, dpr);
            this.width = rect.width;
            this.height = rect.height;
        }

        render(priceHistory = [], isPositive = true) {
            if (!this.ctx || priceHistory.length < 2) return;
            this.resize();

            const ctx = this.ctx;
            const width = this.width;
            const height = this.height;

            ctx.clearRect(0, 0, width, height);

            const padding = { top: 20, right: 55, bottom: 25, left: 15 };
            const chartW = width - padding.left - padding.right;
            const chartH = height - padding.top - padding.bottom;

            const minPrice = Math.min(...priceHistory) * 0.97;
            const maxPrice = Math.max(...priceHistory) * 1.03;
            const range = maxPrice - minPrice || 1;

            ctx.setLineDash([3, 3]);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = '600 10px "JetBrains Mono", sans-serif';
            ctx.textAlign = 'right';

            for (let i = 0; i <= 4; i++) {
                const y = padding.top + (chartH / 4) * i;
                const gridPrice = maxPrice - (range / 4) * i;

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();

                ctx.fillText(`${Math.round(gridPrice).toLocaleString()}G`, width - 5, y + 3);
            }
            ctx.setLineDash([]);

            // Draw X-Axis Time Labels (시간 축: 00:00 시:분 형식)
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.font = '600 9px "JetBrains Mono", sans-serif';

            const now = new Date();
            const timeLabels = [];
            for (let i = 4; i >= 0; i--) {
                const t = new Date(now.getTime() - i * 5 * 60 * 1000);
                const hrs = String(t.getHours()).padStart(2, '0');
                const mins = String(t.getMinutes()).padStart(2, '0');
                timeLabels.push(`${hrs}:${mins}`);
            }

            for (let i = 0; i < timeLabels.length; i++) {
                const x = padding.left + (i / (timeLabels.length - 1)) * chartW;
                ctx.fillText(timeLabels[i], x, height - 5);
            }

            const points = priceHistory.map((val, idx) => {
                const x = padding.left + (idx / (priceHistory.length - 1)) * chartW;
                const y = padding.top + chartH - ((val - minPrice) / range) * chartH;
                return { x, y, val };
            });

            const lineColor = isPositive ? '#00e5ff' : '#ff3b5c';
            const gradTop = isPositive ? 'rgba(0, 229, 255, 0.35)' : 'rgba(255, 59, 92, 0.35)';
            const gradBot = isPositive ? 'rgba(0, 229, 255, 0.0)' : 'rgba(255, 59, 92, 0.0)';

            const fillGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
            fillGradient.addColorStop(0, gradTop);
            fillGradient.addColorStop(1, gradBot);

            ctx.fillStyle = fillGradient;
            ctx.beginPath();
            ctx.moveTo(points[0].x, height - padding.bottom);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = lineColor;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            points.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
            ctx.shadowBlur = 0;

            const lastP = points[points.length - 1];
            ctx.fillStyle = lineColor;
            ctx.beginPath();
            ctx.arc(lastP.x, lastP.y, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '600 11px "JetBrains Mono", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${Math.round(lastP.val).toLocaleString()}G`, width - padding.right, lastP.y - 8);
        }
    }

    // 2.5 DETAILED EXPANDED CHART RENDERER (14-Day, Line & Candlestick, Crosshair & Tooltip)
    class DetailedChartRenderer {
        constructor(canvasElement, tooltipElement) {
            this.canvas = canvasElement;
            this.ctx = canvasElement.getContext('2d');
            this.tooltip = tooltipElement;
            this.timeframe = '1D'; // '1D', '1W', '1M', '1Y'
            this.chartType = 'line'; // 'line', 'candle'
            this.points = [];

            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.initInteractivity();
        }

        resize() {
            if (!this.canvas) return;
            let width = 1400;
            if (this.timeframe === '1D') width = 1400;
            else if (this.timeframe === '1W') width = 1400;
            else if (this.timeframe === '1M') width = 1800;
            else if (this.timeframe === '1Y') width = 2200;

            const height = 320;
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;

            const inner = document.getElementById('detailedCanvasInner');
            if (inner) {
                inner.style.width = `${width}px`;
                inner.style.height = `${height}px`;
            }

            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(dpr, dpr);
            this.width = width;
            this.height = height;
        }

        initInteractivity() {
            if (!this.canvas) return;

            const wrapper = document.getElementById('detailedChartScrollWrapper') || this.canvas.parentElement;
            let isDragging = false;
            let startX = 0;
            let scrollLeft = 0;
            let hasMoved = false;

            if (wrapper) {
                const onStart = (clientX) => {
                    isDragging = true;
                    hasMoved = false;
                    wrapper.classList.add('active-drag');
                    startX = clientX - wrapper.offsetLeft;
                    scrollLeft = wrapper.scrollLeft;
                };

                const onMove = (clientX) => {
                    if (!isDragging) return;
                    const x = clientX - wrapper.offsetLeft;
                    const walk = (x - startX) * 1.4;
                    if (Math.abs(walk) > 3) {
                        hasMoved = true;
                        wrapper.scrollLeft = scrollLeft - walk;
                    }
                };

                const onEnd = () => {
                    isDragging = false;
                    wrapper.classList.remove('active-drag');
                };

                wrapper.addEventListener('mousedown', (e) => onStart(e.clientX));
                window.addEventListener('mousemove', (e) => onMove(e.clientX));
                window.addEventListener('mouseup', () => onEnd());

                wrapper.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX), { passive: true });
                wrapper.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), { passive: true });
                wrapper.addEventListener('touchend', () => onEnd());
            }

            const handleHover = (e) => {
                if (isDragging && hasMoved) return;
                if (!this.points || this.points.length === 0) return;
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
                const mouseY = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

                let closest = this.points[0];
                let minDist = Math.abs(mouseX - closest.x);

                this.points.forEach(p => {
                    const dist = Math.abs(mouseX - p.x);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = p;
                    }
                });

                this.renderWithCrosshair(closest, mouseX, mouseY);
            };

            const handleLeave = () => {
                if (this.tooltip) this.tooltip.classList.add('hidden');
                this.render(this.lastHistory, this.lastIsPos, this.lastStockInfo);
            };

            this.canvas.addEventListener('mousemove', handleHover);
            this.canvas.addEventListener('mouseleave', handleLeave);
        }

        render(priceHistory = [], isPositive = true, stockInfo = {}) {
            this.lastHistory = priceHistory;
            this.lastIsPos = isPositive;
            this.lastStockInfo = stockInfo;

            if (!this.ctx || priceHistory.length < 2) return;
            this.resize();

            const ctx = this.ctx;
            const width = this.width;
            const height = this.height;

            ctx.clearRect(0, 0, width, height);

            let displayData = [...priceHistory];
            if (this.timeframe === '1D') {
                // Generate/slice 25 data points across 24 hours (00:00 to 24:00)
                if (displayData.length < 25) {
                    const base = displayData[displayData.length - 1] || 100;
                    const generated = [];
                    let curr = displayData[0] || base;
                    for (let h = 0; h <= 24; h++) {
                        const change = (Math.random() - 0.48) * 0.04;
                        curr = Math.max(10, Math.round(curr * (1 + change)));
                        generated.push(curr);
                    }
                    displayData = generated;
                } else {
                    displayData = displayData.slice(-25);
                }
            } else if (this.timeframe === '1W') {
                displayData = displayData.slice(-70);
            } else if (this.timeframe === '2W') {
                displayData = displayData.slice(-140);
            } else if (this.timeframe === '1M') {
                displayData = displayData.slice(-200);
            }

            const padding = { top: 25, right: 25, bottom: 30, left: 20 };
            const chartW = width - padding.left - padding.right;
            const chartH = height - padding.top - padding.bottom;

            const minPrice = Math.min(...displayData) * 0.97;
            const maxPrice = Math.max(...displayData) * 1.03;
            const range = maxPrice - minPrice || 1;

            ctx.setLineDash([3, 3]);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.font = '600 10px "JetBrains Mono", sans-serif';
            ctx.textAlign = 'right';

            for (let i = 0; i <= 4; i++) {
                const y = padding.top + (chartH / 4) * i;
                const gridPrice = maxPrice - (range / 4) * i;

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();

                ctx.fillText(`${Math.round(gridPrice).toLocaleString()}G`, width - padding.right - 4, y - 4);
            }
            ctx.setLineDash([]);

            const now = new Date();
            let totalDays = 14;
            if (this.timeframe === '1D') totalDays = 1;
            else if (this.timeframe === '1W') totalDays = 7;
            else if (this.timeframe === '2W') totalDays = 14;
            else if (this.timeframe === '1M') totalDays = 30;

            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.font = '600 11px "JetBrains Mono", sans-serif';

            if (this.timeframe === '1D') {
                // Intraday timeline from 00:00 to current clock time (e.g., 04:58)
                const currentMins = Math.max(30, now.getHours() * 60 + now.getMinutes());
                const tickCount = 6;
                for (let i = 0; i < tickCount; i++) {
                    const fraction = i / (tickCount - 1);
                    const x = padding.left + fraction * chartW;
                    const tickVal = Math.round(fraction * currentMins);
                    const hrsStr = String(Math.floor(tickVal / 60)).padStart(2, '0');
                    const minsStr = String(tickVal % 60).padStart(2, '0');
                    const labelText = `${hrsStr}:${minsStr}`;
                    ctx.fillText(labelText, x, height - 8);
                }
            } else {
                const labelCount = this.timeframe === '1W' ? 7 : (this.timeframe === '2W' ? 14 : 15);
                for (let i = 0; i < labelCount; i++) {
                    const fraction = i / (labelCount - 1 || 1);
                    const x = padding.left + fraction * chartW;
                    const daysAgo = Math.round((1 - fraction) * (totalDays - 1));
                    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const date = String(d.getDate()).padStart(2, '0');
                    const labelText = `${m}/${date}`;
                    ctx.fillText(labelText, x, height - 8);
                }
            }

            this.points = displayData.map((val, idx) => {
                const fraction = idx / (displayData.length - 1 || 1);
                const x = padding.left + fraction * chartW;
                const y = padding.top + chartH - ((val - minPrice) / range) * chartH;
                const dayNum = Math.max(1, Math.round(fraction * totalDays));
                return { x, y, val, idx, dayNum, fraction };
            });

            const lineColor = isPositive ? '#00e5ff' : '#ff3b5c';

            const gradTop = isPositive ? 'rgba(0, 229, 255, 0.35)' : 'rgba(255, 59, 92, 0.35)';
            const fillGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
            fillGradient.addColorStop(0, gradTop);
            fillGradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

            ctx.fillStyle = fillGradient;
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, height - padding.bottom);
            this.points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(this.points[this.points.length - 1].x, height - padding.bottom);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = lineColor;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            this.points.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        renderWithCrosshair(point, mouseX, mouseY) {
            this.render(this.lastHistory, this.lastIsPos, this.lastStockInfo);
            if (!point || !this.ctx) return;

            const ctx = this.ctx;
            const width = this.width;
            const height = this.height;

            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(point.x, 25);
            ctx.lineTo(point.x, height - 30);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(15, point.y);
            ctx.lineTo(width - 65, point.y);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            if (this.tooltip) {
                this.tooltip.classList.remove('hidden');
                const startPrice = this.lastHistory[0] || point.val;
                const changePct = ((point.val - startPrice) / startPrice) * 100;
                const isPos = changePct >= 0;

                let timeLbl = '';
                if (this.timeframe === '1D') {
                    const now = new Date();
                    const currentMins = Math.max(30, now.getHours() * 60 + now.getMinutes());
                    const targetMinutes = Math.min(currentMins, Math.max(0, Math.round(point.fraction * currentMins)));
                    const hrs = String(Math.floor(targetMinutes / 60)).padStart(2, '0');
                    const mins = String(targetMinutes % 60).padStart(2, '0');
                    timeLbl = `${hrs}:${mins}`;
                } else {
                    const totalDays = this.timeframe === '1W' ? 7 : (this.timeframe === '2W' ? 14 : 30);
                    const daysAgo = Math.round((1 - point.fraction) * (totalDays - 1));
                    const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const date = String(d.getDate()).padStart(2, '0');
                    timeLbl = `${m}/${date} (${totalDays - daysAgo}일차)`;
                }

                const ttTime = this.tooltip.querySelector('#ttTime');
                const ttPrice = this.tooltip.querySelector('#ttPrice');
                const ttChange = this.tooltip.querySelector('#ttChange');

                if (ttTime) ttTime.textContent = `📅 ${timeLbl}`;
                if (ttPrice) ttPrice.textContent = `💰 ${Math.round(point.val).toLocaleString()} Gold`;
                if (ttChange) {
                    ttChange.textContent = `${isPos ? '+' : ''}${changePct.toFixed(2)}%`;
                    ttChange.className = `tt-change ${isPos ? 'gainer' : 'loser'}`;
                }

                let tipX = point.x + 10;
                if (tipX + 130 > width) tipX = point.x - 140;
                this.tooltip.style.left = `${Math.max(10, tipX)}px`;
                this.tooltip.style.top = `15px`;
            }
        }
    }

    // 3. MARKET SIMULATION ENGINE (With Short & Margin Support)
    class MarketEngine {
        constructor() {
            this.stocks = new Map();
            this.news = [...INITIAL_NEWS];
            this.cash = 5000;
            this.targetRent = 5000;
            this.day = 1;
            this.maxDays = 7;
            this.portfolio = new Map();
            this.priceHistory = new Map();
            this.listeners = new Set();
            this.tickTimer = null;

            this.init();
        }

        init() {
            INITIAL_STOCKS.forEach(stock => {
                const stockCopy = { ...stock, history: [stock.prevPrice, stock.price] };
                this.stocks.set(stock.id, stockCopy);
                this.priceHistory.set(stock.id, this.generateInitialHistory(stock.price));
            });
            this.startEngine();
        }

        generateInitialHistory(basePrice) {
            const history = [];
            let curr = basePrice * (0.8 + Math.random() * 0.15);
            for (let i = 0; i < 140; i++) {
                const changePct = (Math.random() - 0.49) * 0.035;
                curr = Math.max(10, Math.round(curr * (1 + changePct)));
                history.push(curr);
            }
            history.push(basePrice);
            return history;
        }

        startEngine() {
            if (this.tickTimer) clearInterval(this.tickTimer);
            this.tickTimer = setInterval(() => this.tick(), 2500);
        }

        tick() {
            let anyPriceChanged = false;
            this.stocks.forEach(stock => {
                let volatility = 0.02;
                if (stock.tier === 'S') volatility = 0.07;
                else if (stock.tier === 'A') volatility = 0.04;
                else if (stock.tier === 'B') volatility = 0.025;

                const changePct = (Math.random() - 0.49) * volatility;
                const newPrice = Math.max(10, Math.round(stock.price * (1 + changePct)));

                if (newPrice !== stock.price) {
                    stock.prevPrice = stock.price;
                    stock.price = newPrice;
                    const hist = this.priceHistory.get(stock.id);
                    hist.push(newPrice);
                    if (hist.length > 200) hist.shift();
                    anyPriceChanged = true;
                }
            });

            if (anyPriceChanged) this.notify();
        }

        subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }

        notify() {
            this.listeners.forEach(fn => fn(this.getState()));
        }

        getState() {
            const stockList = Array.from(this.stocks.values());
            const portfolioValue = this.getPortfolioValue();
            const totalNetWorth = this.cash + portfolioValue;
            const totalProfitLoss = this.getPortfolioProfitLoss();

            return {
                stocks: stockList,
                news: this.news,
                cash: this.cash,
                portfolio: Array.from(this.portfolio.entries()).map(([id, item]) => {
                    const stock = this.stocks.get(id);
                    const currentPrice = stock ? stock.price : 0;
                    let currentVal = currentPrice * item.qty;
                    let profitLoss = 0;
                    let profitLossPct = 0;

                    if (item.isShort) {
                        // Short position profit: when current price falls below entry price
                        profitLoss = (item.avgPrice - currentPrice) * item.qty * item.leverage;
                        currentVal = (item.avgPrice * item.qty) + profitLoss;
                        profitLossPct = item.avgPrice > 0 ? ((item.avgPrice - currentPrice) / item.avgPrice) * 100 * item.leverage : 0;
                    } else {
                        // Long position profit
                        profitLoss = (currentPrice - item.avgPrice) * item.qty * item.leverage;
                        profitLossPct = item.avgPrice > 0 ? ((currentPrice - item.avgPrice) / item.avgPrice) * 100 * item.leverage : 0;
                    }

                    return {
                        id,
                        stock,
                        qty: item.qty,
                        avgPrice: item.avgPrice,
                        isShort: item.isShort || false,
                        leverage: item.leverage || 1,
                        currentVal,
                        profitLoss,
                        profitLossPct
                    };
                }),
                portfolioValue,
                totalNetWorth,
                totalProfitLoss,
                day: this.day,
                maxDays: this.maxDays,
                targetRent: this.targetRent,
                cipherIndex: this.getCipherIndex()
            };
        }

        getCipherIndex() {
            const stocks = Array.from(this.stocks.values());
            if (stocks.length === 0) return { name: '🌐 글로벌 사이퍼 지수', val: '2,540.20', diffPct: 0, unit: 'pt' };

            let totalCurr = 0;
            let totalPrev = 0;

            stocks.forEach(s => {
                totalCurr += s.price;
                totalPrev += s.prevPrice;
            });

            const ratio = totalPrev > 0 ? (totalCurr / totalPrev) : 1;
            const cipherPct = totalPrev > 0 ? ((totalCurr - totalPrev) / totalPrev) * 100 : 0;
            const cipherIndexVal = 2540.20 * ratio;

            return {
                name: '🌐 글로벌 사이퍼 지수',
                val: cipherIndexVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                diffPct: cipherPct,
                unit: 'pt'
            };
        }

        getPortfolioValue() {
            let total = 0;
            this.portfolio.forEach((item, id) => {
                const stock = this.stocks.get(id);
                if (stock) {
                    if (item.isShort) {
                        const pl = (item.avgPrice - stock.price) * item.qty * (item.leverage || 1);
                        total += Math.max(0, (item.avgPrice * item.qty) + pl);
                    } else {
                        total += stock.price * item.qty;
                    }
                }
            });
            return total;
        }

        getPortfolioProfitLoss() {
            let totalPL = 0;
            this.portfolio.forEach((item, id) => {
                const stock = this.stocks.get(id);
                if (stock) {
                    if (item.isShort) {
                        totalPL += (item.avgPrice - stock.price) * item.qty * (item.leverage || 1);
                    } else {
                        totalPL += (stock.price - item.avgPrice) * item.qty * (item.leverage || 1);
                    }
                }
            });
            return totalPL;
        }

        buyStock(stockId, qty, leverage = 1, isShort = false) {
            const stock = this.stocks.get(stockId);
            if (!stock || qty <= 0) return { success: false, msg: '유효하지 않은 수량입니다.' };

            const marginRequired = Math.round((stock.price * qty) / leverage);
            if (this.cash < marginRequired) {
                return { success: false, msg: `증거금이 부족합니다. (필요: ${marginRequired.toLocaleString()}G, 보유: ${this.cash.toLocaleString()}G)` };
            }

            this.cash -= marginRequired;
            const existing = this.portfolio.get(stockId) || { qty: 0, avgPrice: 0, leverage, isShort };
            const newQty = existing.qty + qty;
            const newAvgPrice = Math.round(((existing.avgPrice * existing.qty) + (stock.price * qty)) / newQty);

            this.portfolio.set(stockId, { qty: newQty, avgPrice: newAvgPrice, leverage, isShort });
            this.notify();

            const modeLabel = isShort ? '공매도 (Short)' : '매수 (Long)';
            return { success: true, msg: `${stock.name} ${qty}주 ${modeLabel} [${leverage}x] 실행 완료.` };
        }

        sellStock(stockId, qty) {
            const stock = this.stocks.get(stockId);
            const existing = this.portfolio.get(stockId);
            if (!stock || !existing || qty <= 0 || existing.qty < qty) {
                return { success: false, msg: '매도/청산 가능한 포지션이 부족합니다.' };
            }

            let marginReturn = 0;
            if (existing.isShort) {
                // Short cover profit return
                const profit = (existing.avgPrice - stock.price) * qty * (existing.leverage || 1);
                marginReturn = Math.max(0, Math.round((existing.avgPrice * qty) / existing.leverage + profit));
            } else {
                const profit = (stock.price - existing.avgPrice) * qty * (existing.leverage || 1);
                marginReturn = Math.max(0, Math.round((existing.avgPrice * qty) / existing.leverage + profit));
            }

            this.cash += marginReturn;

            const remainingQty = existing.qty - qty;
            if (remainingQty <= 0) {
                this.portfolio.delete(stockId);
            } else {
                this.portfolio.set(stockId, { qty: remainingQty, avgPrice: existing.avgPrice, leverage: existing.leverage, isShort: existing.isShort });
            }

            this.notify();
            return { success: true, msg: `${stock.name} ${qty}주 포지션 청산 완료. (+${marginReturn.toLocaleString()}G 환급)` };
        }

        getOrderBook(stockId) {
            const stock = this.stocks.get(stockId);
            if (!stock) return { asks: [], bids: [] };

            const base = stock.price;
            const asks = [];
            const bids = [];

            for (let i = 5; i >= 1; i--) {
                const price = Math.round(base * (1 + i * 0.004));
                const vol = Math.floor(50 + Math.random() * 450);
                asks.push({ price, vol, pct: Math.min(100, (vol / 500) * 100) });
            }

            for (let i = 1; i <= 5; i++) {
                const price = Math.max(10, Math.round(base * (1 - i * 0.004)));
                const vol = Math.floor(50 + Math.random() * 450);
                bids.push({ price, vol, pct: Math.min(100, (vol / 500) * 100) });
            }

            return { asks, bids, currentPrice: base, prevPrice: stock.prevPrice };
        }

        nextDay() {
            if (this.day < this.maxDays) {
                this.day++;
                this.stocks.forEach(stock => {
                    const dayJump = (Math.random() - 0.48) * 0.06;
                    stock.price = Math.max(10, Math.round(stock.price * (1 + dayJump)));
                });
                this.notify();
            }
        }

        reset() {
            this.cash = 5000;
            this.day = 1;
            this.portfolio.clear();
            this.init();
            this.notify();
        }
    }

    const marketEngine = new MarketEngine();

    // 4. MAIN APP UI CONTROLLER
    class StockWarsApp {
        constructor() {
            this.selectedStockId = 'CLOUDBERRY';
            this.selectedNewsId = null;
            this.selectedSector = 'ALL';
            this.chartRenderer = null;
            this.tradeQty = 1;
            this.isShortMode = false;
            this.selectedLeverage = 1;
            this.isLevel20Unlocked = false; // Toggle for Lv.20 demo override
            this.recentlyViewedIds = ['MOMO', 'SOCIAL', 'ECOBAT', 'PATCHWORK'];
            this.favorites = this.loadFavorites();
            this.selectedSortMode = 'POPULAR'; // 'POPULAR', 'CHANGE', 'PRICE', 'NAME'
            window.stockWarsApp = this; // Global reference for inline events

            this.initDOM();
            this.initEventListeners();
            this.initChart();

            marketEngine.subscribe(state => this.render(state));
            this.render(marketEngine.getState());
        }

        initDOM() {
            this.btnToggleFrame = document.getElementById('btnToggleFrame');
            this.txtFrameToggle = document.getElementById('txtFrameToggle');
            this.btnUnlockLevel20 = document.getElementById('btnUnlockLevel20');
            this.txtUnlockToggle = document.getElementById('txtUnlockToggle');
            this.btnFastForwardDay = document.getElementById('btnFastForwardDay');
            this.btnTriggerSettlement = document.getElementById('btnTriggerSettlement');
            this.btnResetDemo = document.getElementById('btnResetDemo');

            this.homeScreen = document.getElementById('homeScreen');
            this.stockApp = document.getElementById('stockApp');
            this.btnPhysicalHome = document.getElementById('btnPhysicalHome');
            this.iconStockApp = document.getElementById('iconStockApp');
            this.statusClock = document.getElementById('statusClock');
            this.headerDayBadge = document.getElementById('headerDayBadge');

            // Top Main Status HUD Elements
            this.hudTimeVal = document.getElementById('hudTimeVal');
            this.hudDayVal = document.getElementById('hudDayVal');
            this.hudCashVal = document.getElementById('hudCashVal');
            this.hudTotalAssetVal = document.getElementById('hudTotalAssetVal');
            this.hudPnlVal = document.getElementById('hudPnlVal');

            this.btnHudRanking = document.getElementById('btnHudRanking');
            this.btnHudBook = document.getElementById('btnHudBook');
            this.btnHudHelp = document.getElementById('btnHudHelp');
            this.btnHudSettings = document.getElementById('btnHudSettings');

            this.tickerMarquee = document.getElementById('tickerMarquee');

            this.homeNetWorth = document.getElementById('homeNetWorth');
            this.homeCash = document.getElementById('homeCash');
            this.homePortfolioVal = document.getElementById('homePortfolioVal');
            this.homeProfitLoss = document.getElementById('homeProfitLoss');
            this.settlementDDay = document.getElementById('settlementDDay');
            this.rentGoalText = document.getElementById('rentGoalText');
            this.rentProgressFill = document.getElementById('rentProgressFill');
            this.recentStocksGrid = document.getElementById('recentStocksGrid') || document.getElementById('hotStocksGrid');

            this.searchInput = document.getElementById('searchInput');
            this.sectorChips = document.getElementById('sectorChips');
            this.marketSortBar = document.getElementById('marketSortBar');
            this.marketSortSelect = document.getElementById('marketSortSelect');
            this.stockListContainer = document.getElementById('stockListContainer');

            this.newsListContainer = document.getElementById('newsListContainer');

            this.portfolioListContainer = document.getElementById('portfolioListContainer');
            this.sectorDonutChart = document.getElementById('sectorDonutChart');
            this.donutCenterVal = document.getElementById('donutCenterVal');
            this.allocationLegendList = document.getElementById('allocationLegendList');
            this.btnProfileSettlement = document.getElementById('btnProfileSettlement');
            this.btnProfileReset = document.getElementById('btnProfileReset');

            this.navTabs = document.querySelectorAll('.nav-tab');
            this.tabViews = document.querySelectorAll('.tab-view');

            // Trade Modal & Subtabs
            this.tradeModal = document.getElementById('tradeModal');
            this.btnCloseTradeModal = document.getElementById('btnCloseTradeModal');
            this.btnSubtabChart = document.getElementById('btnSubtabChart');
            this.btnSubtabInfo = document.getElementById('btnSubtabInfo');
            this.tradeSubtabChartContent = document.getElementById('tradeSubtabChartContent');
            this.tradeSubtabInfoContent = document.getElementById('tradeSubtabInfoContent');

            // Order Type & Leverage Selectors
            this.btnOrderTypeLong = document.getElementById('btnOrderTypeLong');
            this.btnOrderTypeShort = document.getElementById('btnOrderTypeShort');
            this.shortLockTag = document.getElementById('shortLockTag');

            this.modalStockName = document.getElementById('modalStockName');
            this.btnFavoriteStock = document.getElementById('btnFavoriteStock');
            this.modalStockCode = document.getElementById('modalStockCode');
            this.modalStockSector = document.getElementById('modalStockSector');
            this.modalStockPrice = document.getElementById('modalStockPrice');
            this.modalStockChange = document.getElementById('modalStockChange');
            this.orderbookRows = document.getElementById('orderbookRows');
            this.tradeQtyInput = document.getElementById('tradeQtyInput');
            this.btnQtyMinus = document.getElementById('btnQtyMinus');
            this.btnQtyPlus = document.getElementById('btnQtyPlus');
            this.btnQtyMax = document.getElementById('btnQtyMax');
            this.modalTotalCost = document.getElementById('modalTotalCost');
            this.btnBuyExecute = document.getElementById('btnBuyExecute');
            this.btnSellExecute = document.getElementById('btnSellExecute');

            // Stock Info DOM
            this.infoRichDesc = document.getElementById('infoRichDesc');
            this.infoPER = document.getElementById('infoPER');
            this.infoPBR = document.getElementById('infoPBR');
            this.infoROE = document.getElementById('infoROE');
            this.infoDividend = document.getElementById('infoDividend');
            this.infoMarketCap = document.getElementById('infoMarketCap');
            this.infoHighLow = document.getElementById('infoHighLow');
            this.infoRisk = document.getElementById('infoRisk');
            this.infoTier = document.getElementById('infoTier');
            this.infoRelatedNews = document.getElementById('infoRelatedNews');

            // News Detail Modal DOM
            this.newsDetailModal = document.getElementById('newsDetailModal');
            this.btnCloseNewsDetailModal = document.getElementById('btnCloseNewsDetailModal');
            this.newsDetailType = document.getElementById('newsDetailType');
            this.newsDetailStockBadge = document.getElementById('newsDetailStockBadge');
            this.newsDetailTime = document.getElementById('newsDetailTime');
            this.newsDetailTitle = document.getElementById('newsDetailTitle');
            this.newsDetailContent = document.getElementById('newsDetailContent');
            this.newsDetailImpact = document.getElementById('newsDetailImpact');
            this.newsDetailCredibility = document.getElementById('newsDetailCredibility');
            this.newsDetailComment = document.getElementById('newsDetailComment');
            this.btnNewsTradeStock = document.getElementById('btnNewsTradeStock');

            // Settlement Modal DOM
            this.settlementModal = document.getElementById('settlementModal');
            this.btnCloseSettlement = document.getElementById('btnCloseSettlement');
            this.settleCash = document.getElementById('settleCash');
            this.settlePortfolio = document.getElementById('settlePortfolio');
            this.settleTotalWorth = document.getElementById('settleTotalWorth');
            this.settleRentDeduction = document.getElementById('settleRentDeduction');
            this.settleFinalRemain = document.getElementById('settleFinalRemain');
            this.resultStamp = document.getElementById('resultStamp');
            this.resultGrade = document.getElementById('resultGrade');

            // Detailed Chart Modal DOM
            this.detailedChartModal = document.getElementById('detailedChartModal');
            this.btnCloseDetailedChartModal = document.getElementById('btnCloseDetailedChartModal');
            this.btnExpandChart = document.getElementById('btnExpandChart');
            this.detailedModalDate = document.getElementById('detailedModalDate');
            this.detailedModalStockName = document.getElementById('detailedModalStockName');
            this.detailedModalStockCode = document.getElementById('detailedModalStockCode');
            this.detailedModalStockSector = document.getElementById('detailedModalStockSector');
            this.detailedModalPrice = document.getElementById('detailedModalPrice');
            this.detailedModalChange = document.getElementById('detailedModalChange');
            this.detailedModalHigh = document.getElementById('detailedModalHigh');
            this.detailedModalLow = document.getElementById('detailedModalLow');
            this.detailedModalAvg = document.getElementById('detailedModalAvg');
            this.timeframeSelector = document.getElementById('timeframeSelector');
            this.detailedCanvasChart = document.getElementById('detailedCanvasChart');
            this.chartCrosshairTooltip = document.getElementById('chartCrosshairTooltip');
            this.detailedChartRenderer = null;

            this.updateClock();
            setInterval(() => this.updateClock(), 1000);
        }

        initChart() {
            const canvas = document.getElementById('stockCanvasChart');
            if (canvas) this.chartRenderer = new StockChartRenderer(canvas);

            if (this.detailedCanvasChart && this.chartCrosshairTooltip) {
                this.detailedChartRenderer = new DetailedChartRenderer(this.detailedCanvasChart, this.chartCrosshairTooltip);
            }
        }

        updateClock() {
            const now = new Date();
            const hours24 = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const ampm = hours24 >= 12 ? 'PM' : 'AM';
            const hours12 = String(hours24 % 12 || 12).padStart(2, '0');

            const formattedTime = `${hours12}:${minutes}:${seconds} ${ampm}`;
            const phoneTimeStr = `${String(hours24).padStart(2, '0')}:${minutes}`;

            if (this.hudTimeVal) this.hudTimeVal.textContent = formattedTime;
            if (this.statusClock) this.statusClock.textContent = phoneTimeStr;
        }

        initEventListeners() {
            this.btnToggleFrame?.addEventListener('click', () => {
                document.body.classList.remove('phone-minimized');
                document.body.classList.toggle('phone-view-active');
                const isActive = document.body.classList.contains('phone-view-active');
                if (this.txtFrameToggle) {
                    this.txtFrameToggle.textContent = isActive ? '전체 화면 전환' : '스마트폰 프레임 전환';
                }
            });

            // Unlock Level 20 Demo Toggle
            this.btnUnlockLevel20?.addEventListener('click', () => {
                this.isLevel20Unlocked = !this.isLevel20Unlocked;
                if (this.isLevel20Unlocked) {
                    this.txtUnlockToggle.textContent = '🔓 레벨 20 해금됨 (클릭 시 원복)';
                    this.btnUnlockLevel20.style.background = 'rgba(0, 230, 118, 0.2)';
                    this.btnUnlockLevel20.style.borderColor = 'var(--accent-green)';
                    this.btnUnlockLevel20.style.color = 'var(--accent-green)';
                    this.showToast('🔓 시현 모드: 레벨 20 기능(공매도 & 5x 마진)이 해금되었습니다!');
                } else {
                    this.txtUnlockToggle.textContent = '공매도/레버리지 해금 (Lv.20)';
                    this.btnUnlockLevel20.style.background = '';
                    this.btnUnlockLevel20.style.borderColor = '';
                    this.btnUnlockLevel20.style.color = '';
                    this.showToast('🔒 공매도 및 레버리지 기능이 기본 잠금 상태로 돌아왔습니다.');
                }
                this.updateLockBadges();
            });

            this.btnFastForwardDay?.addEventListener('click', () => {
                marketEngine.nextDay();
                this.showToast('📅 다음 날로 진행되었습니다.');
            });

            this.btnTriggerSettlement?.addEventListener('click', () => this.showSettlementModal());
            this.btnProfileSettlement?.addEventListener('click', () => this.showSettlementModal());
            this.btnCloseSettlement?.addEventListener('click', () => this.settlementModal.classList.add('hidden'));

            this.btnResetDemo?.addEventListener('click', () => {
                marketEngine.reset();
                this.showToast('🔄 시현 데모 데이터가 초기화되었습니다.');
            });
            this.btnProfileReset?.addEventListener('click', () => {
                marketEngine.reset();
                this.showToast('🔄 시현 데모 데이터가 초기화되었습니다.');
            });

            // Top HUD Nav Button Listeners
            this.btnHudRanking?.addEventListener('click', () => this.showToast('🏆 랭킹 시스템: 데모 버전 준비중입니다.'));
            this.btnHudBook?.addEventListener('click', () => this.showToast('📖 주식 도감: 데모 버전 준비중입니다.'));
            this.btnHudHelp?.addEventListener('click', () => this.showToast('❓ 도움말: 7일 동안 주식 투자로 수익을 극대화하세요!'));
            this.btnHudSettings?.addEventListener('click', () => this.showToast('⚙️ 환경 설정: 데모 옵션'));

            // Click outside smartphone frame to minimize & show Isometric Rooftop view
            const deviceContainer = document.querySelector('.device-container');
            const phoneShell = document.querySelector('.phone-shell');
            const floatingPhoneBtn = document.getElementById('floatingPhoneBtn');

            if (deviceContainer && phoneShell) {
                deviceContainer.addEventListener('click', (e) => {
                    if (document.body.classList.contains('phone-view-active') &&
                        !phoneShell.contains(e.target) && 
                        !e.target.closest('.modal-overlay') && 
                        !e.target.closest('.demo-top-bar')) {
                        document.body.classList.add('phone-minimized');
                    }
                });
            }

            const restorePhone = (e) => {
                if (e) e.stopPropagation();
                document.body.classList.remove('phone-minimized');
            };

            floatingPhoneBtn?.addEventListener('click', restorePhone);

            this.btnPhysicalHome?.addEventListener('click', () => {
                this.stockApp.classList.remove('active');
                this.homeScreen.classList.add('active');
            });
            this.iconStockApp?.addEventListener('click', () => {
                this.homeScreen.classList.remove('active');
                this.stockApp.classList.add('active');
            });

            document.getElementById('summaryCard')?.addEventListener('click', () => {
                this.switchTab('Profile');
            });

            this.navTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    this.switchTab(tab.dataset.tab);
                });
            });

            if (this.sectorChips) {
                const el = this.sectorChips;
                el.addEventListener('wheel', (e) => {
                    if (e.deltaY !== 0) {
                        e.preventDefault();
                        el.scrollLeft += e.deltaY;
                    }
                }, { passive: false });

                let isDown = false, startX, scrollLeft;
                el.addEventListener('mousedown', (e) => {
                    isDown = true;
                    startX = e.pageX - el.offsetLeft;
                    scrollLeft = el.scrollLeft;
                });
                el.addEventListener('mouseleave', () => isDown = false);
                el.addEventListener('mouseup', () => isDown = false);
                el.addEventListener('mousemove', (e) => {
                    if (!isDown) return;
                    e.preventDefault();
                    const x = e.pageX - el.offsetLeft;
                    el.scrollLeft = scrollLeft - (x - startX) * 1.5;
                });
            }

            this.sectorChips?.addEventListener('click', e => {
                if (e.target.classList.contains('chip-btn')) {
                    document.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
                    e.target.classList.add('active');
                    this.selectedSector = e.target.dataset.sector;
                    this.render(marketEngine.getState());
                }
            });

            this.marketSortSelect?.addEventListener('change', e => {
                this.selectedSortMode = e.target.value;
                this.render(marketEngine.getState());
            });

            this.searchInput?.addEventListener('input', () => this.render(marketEngine.getState()));

            // Order Type (Long vs Short) Toggle
            this.btnOrderTypeLong?.addEventListener('click', () => {
                this.isShortMode = false;
                this.btnOrderTypeLong.classList.add('active');
                this.btnOrderTypeShort.classList.remove('active', 'short-active');
                this.updateTradeModalCalculations();
            });

            this.btnOrderTypeShort?.addEventListener('click', () => {
                if (!this.isLevel20Unlocked) {
                    this.showToast('🔒 공매도(Short Selling)는 레벨 20 (서밋 라운지) 해금 전용 기능입니다!', false);
                    return;
                }
                this.isShortMode = true;
                this.btnOrderTypeShort.classList.add('active', 'short-active');
                this.btnOrderTypeLong.classList.remove('active');
                this.updateTradeModalCalculations();
            });

            // Leverage Selection Buttons
            document.querySelectorAll('.lev-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const lev = parseInt(btn.dataset.lev) || 1;
                    if ((lev === 3 || lev === 5) && !this.isLevel20Unlocked) {
                        this.showToast(`🔒 ${lev}x 마진 레버리지는 레벨 20 해금 필요 기능입니다!`, false);
                        return;
                    }
                    document.querySelectorAll('.lev-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.selectedLeverage = lev;
                    this.updateTradeModalCalculations();
                });
            });

            // Trade Modal & Subtabs
            this.btnCloseTradeModal?.addEventListener('click', () => this.tradeModal.classList.add('hidden'));
            this.btnFavoriteStock?.addEventListener('click', () => this.toggleFavorite());

            this.btnSubtabChart?.addEventListener('click', () => {
                this.btnSubtabChart.classList.add('active');
                this.btnSubtabInfo.classList.remove('active');
                this.tradeSubtabChartContent.classList.remove('hidden');
                this.tradeSubtabChartContent.classList.add('active');
                this.tradeSubtabInfoContent.classList.add('hidden');
                this.tradeSubtabInfoContent.classList.remove('active');
                this.updateTradeModal();
            });

            this.btnSubtabInfo?.addEventListener('click', () => {
                this.btnSubtabInfo.classList.add('active');
                this.btnSubtabChart.classList.remove('active');
                this.tradeSubtabInfoContent.classList.remove('hidden');
                this.tradeSubtabInfoContent.classList.add('active');
                this.tradeSubtabChartContent.classList.add('hidden');
                this.tradeSubtabChartContent.classList.remove('active');
                this.updateStockInfoPanel();
            });

            this.btnQtyMinus?.addEventListener('click', () => {
                this.tradeQty = Math.max(1, this.tradeQty - 1);
                this.tradeQtyInput.value = this.tradeQty;
                this.updateTradeModalCalculations();
            });
            this.btnQtyPlus?.addEventListener('click', () => {
                this.tradeQty += 1;
                this.tradeQtyInput.value = this.tradeQty;
                this.updateTradeModalCalculations();
            });
            this.tradeQtyInput?.addEventListener('input', e => {
                this.tradeQty = Math.max(1, parseInt(e.target.value) || 1);
                this.updateTradeModalCalculations();
            });

            document.querySelectorAll('.q-btn').forEach(b => {
                b.addEventListener('click', () => {
                    const val = b.dataset.qty;
                    if (val === 'MAX') {
                        const state = marketEngine.getState();
                        const stock = marketEngine.stocks.get(this.selectedStockId);
                        if (stock && stock.price > 0) {
                            const marginPerShare = stock.price / this.selectedLeverage;
                            this.tradeQty = Math.max(1, Math.floor(state.cash / marginPerShare));
                        }
                    } else {
                        this.tradeQty = parseInt(val) || 1;
                    }
                    this.tradeQtyInput.value = this.tradeQty;
                    this.updateTradeModalCalculations();
                });
            });

            this.btnBuyExecute?.addEventListener('click', () => {
                const res = marketEngine.buyStock(this.selectedStockId, this.tradeQty, this.selectedLeverage, this.isShortMode);
                this.showToast(res.msg, res.success);
                if (res.success) this.updateTradeModalCalculations();
            });
            this.btnSellExecute?.addEventListener('click', () => {
                const res = marketEngine.sellStock(this.selectedStockId, this.tradeQty);
                this.showToast(res.msg, res.success);
                if (res.success) this.updateTradeModalCalculations();
            });

            // News Detail Modal Events
            this.btnCloseNewsDetailModal?.addEventListener('click', () => this.newsDetailModal.classList.add('hidden'));
            this.btnNewsTradeStock?.addEventListener('click', () => {
                if (this.selectedStockId) {
                    this.newsDetailModal.classList.add('hidden');
                    this.openTradeModal(this.selectedStockId);
                }
            });

            // Detailed Chart Modal Events
            const triggerExpand = (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                this.openDetailedChartModal(this.selectedStockId);
            };

            this.btnExpandChart?.addEventListener('click', triggerExpand);
            document.getElementById('btnExpandChart')?.addEventListener('click', triggerExpand);
            document.getElementById('stockCanvasChart')?.addEventListener('click', triggerExpand);

            this.btnCloseDetailedChartModal?.addEventListener('click', () => {
                if (this.detailedChartModal) {
                    this.detailedChartModal.style.display = 'none';
                    this.detailedChartModal.classList.add('hidden');
                }
            });

            this.timeframeSelector?.addEventListener('click', (e) => {
                const btn = e.target.closest('.tf-btn');
                if (!btn) return;
                this.timeframeSelector.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (this.detailedChartRenderer) {
                    this.detailedChartRenderer.timeframe = btn.dataset.tf;
                    this.updateDetailedChartModal();
                }
            });
        }

        switchTab(targetTab) {
            if (!targetTab) return;
            this.navTabs.forEach(t => {
                if (t.dataset.tab === targetTab) t.classList.add('active');
                else t.classList.remove('active');
            });
            this.tabViews.forEach(v => v.classList.remove('active'));
            const view = document.getElementById(`tab${targetTab}View`);
            if (view) view.classList.add('active');
        }

        updateLockBadges() {
            if (this.shortLockTag) {
                this.shortLockTag.textContent = this.isLevel20Unlocked ? '🔓 해금' : '🔒 Lv.20';
            }
            const lev3 = document.getElementById('lev3Btn');
            const lev5 = document.getElementById('lev5Btn');
            if (lev3) lev3.querySelector('.lock-tag').textContent = this.isLevel20Unlocked ? '🔓' : '🔒';
            if (lev5) lev5.querySelector('.lock-tag').textContent = this.isLevel20Unlocked ? '🔓' : '🔒';
        }

        loadFavorites() {
            try {
                const saved = localStorage.getItem('stockwars_favorites');
                if (saved) {
                    return new Set(JSON.parse(saved));
                }
            } catch (e) {}
            return new Set();
        }

        saveFavorites() {
            try {
                localStorage.setItem('stockwars_favorites', JSON.stringify(Array.from(this.favorites)));
            } catch (e) {}
        }

        toggleFavorite(stockId) {
            const targetId = stockId || this.selectedStockId;
            if (!targetId) return;
            const stock = marketEngine.stocks.get(targetId);
            const name = stock ? stock.name : targetId;

            if (!this.favorites) this.favorites = this.loadFavorites();

            if (this.favorites.has(targetId)) {
                this.favorites.delete(targetId);
                this.showToast(`☆ ${name} 종목이 관심 종목에서 해제되었습니다.`);
            } else {
                this.favorites.add(targetId);
                this.showToast(`⭐ ${name} 종목이 관심 종목으로 등록되었습니다!`);
            }

            this.saveFavorites();
            this.updateFavoriteBtnState();
            this.render(marketEngine.getState());
        }

        updateFavoriteBtnState() {
            if (!this.btnFavoriteStock) return;
            if (!this.favorites) this.favorites = this.loadFavorites();
            const isFav = this.favorites.has(this.selectedStockId);
            if (isFav) {
                this.btnFavoriteStock.textContent = '⭐';
                this.btnFavoriteStock.classList.add('active');
                this.btnFavoriteStock.title = '관심 종목 해제';
            } else {
                this.btnFavoriteStock.textContent = '⭐';
                this.btnFavoriteStock.classList.remove('active');
                this.btnFavoriteStock.title = '관심 종목 등록';
            }
        }

        recordRecentlyViewed(stockId) {
            if (!stockId) return;
            if (!this.recentlyViewedIds) this.recentlyViewedIds = ['MOMO', 'SOCIAL', 'ECOBAT', 'PATCHWORK'];
            this.recentlyViewedIds = [stockId, ...this.recentlyViewedIds.filter(id => id !== stockId)].slice(0, 4);
        }

        openTradeModal(stockId) {
            this.recordRecentlyViewed(stockId);
            this.selectedStockId = stockId;
            this.tradeQty = 1;
            this.isShortMode = false;
            this.selectedLeverage = 1;
            if (this.tradeQtyInput) this.tradeQtyInput.value = 1;

            // Reset selectors
            this.btnOrderTypeLong?.classList.add('active');
            this.btnOrderTypeShort?.classList.remove('active', 'short-active');
            document.querySelectorAll('.lev-btn').forEach((b, i) => {
                if (i === 0) b.classList.add('active');
                else b.classList.remove('active');
            });

            this.updateLockBadges();

            // Reset subtab to Chart by default
            this.btnSubtabChart.classList.add('active');
            this.btnSubtabInfo.classList.remove('active');
            this.tradeSubtabChartContent.classList.remove('hidden');
            this.tradeSubtabChartContent.classList.add('active');
            this.tradeSubtabInfoContent.classList.add('hidden');
            this.tradeSubtabInfoContent.classList.remove('active');

            this.tradeModal.classList.remove('hidden');
            this.updateTradeModal();
        }

        openDetailedChartModal(stockId) {
            this.selectedStockId = stockId || this.selectedStockId || 'CLOUDBERRY';
            const stock = marketEngine.stocks.get(this.selectedStockId);
            if (!stock) return;

            if (this.detailedModalStockName) this.detailedModalStockName.textContent = stock.name;
            if (this.detailedModalStockCode) this.detailedModalStockCode.textContent = stock.id;
            if (this.detailedModalStockSector) {
                const sec = SECTORS[stock.sector] || { name: stock.sector, color: '#00e5ff', bg: 'rgba(0,229,255,0.15)' };
                this.detailedModalStockSector.textContent = sec.name;
                this.detailedModalStockSector.style.background = sec.bg;
                this.detailedModalStockSector.style.color = sec.color;
            }

            if (this.detailedChartModal) {
                this.detailedChartModal.style.display = 'flex';
                this.detailedChartModal.classList.remove('hidden');
            }

            this.showToast(`📊 ${stock.name} 상세 차트 모달을 열었습니다.`);

            setTimeout(() => {
                if (this.detailedChartRenderer) {
                    this.detailedChartRenderer.resize();
                    this.updateDetailedChartModal();
                }
                const wrapper = document.getElementById('detailedChartScrollWrapper');
                if (wrapper) {
                    wrapper.scrollLeft = wrapper.scrollWidth;
                }
            }, 30);
        }

        updateDetailedChartModal() {
            const stock = marketEngine.stocks.get(this.selectedStockId);
            if (!stock || !this.detailedChartRenderer) return;

            if (this.detailedModalDate) {
                const now = new Date();
                const yyyy = now.getFullYear();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                this.detailedModalDate.textContent = `📅 ${yyyy}/${mm}/${dd}`;
            }

            const fullHistory = marketEngine.priceHistory.get(this.selectedStockId) || [stock.price];

            let displayHistory = [...fullHistory];
            const tf = this.detailedChartRenderer.timeframe || '1D';

            if (tf === '1D') {
                displayHistory = displayHistory.slice(-25);
            } else if (tf === '1W') {
                displayHistory = displayHistory.slice(-70);
            } else if (tf === '1M') {
                displayHistory = displayHistory.slice(-200);
            } else if (tf === '1Y') {
                displayHistory = displayHistory.slice(-365);
            }

            const currentPrice = stock.price;
            const startPrice = displayHistory[0] || currentPrice;
            const diff = currentPrice - startPrice;
            const diffPct = startPrice > 0 ? (diff / startPrice) * 100 : 0;
            const isPos = diff >= 0;

            const maxPrice = Math.max(...displayHistory);
            const minPrice = Math.min(...displayHistory);
            const avgPrice = Math.round(displayHistory.reduce((a, b) => a + b, 0) / displayHistory.length);

            if (this.detailedModalPrice) this.detailedModalPrice.textContent = `${currentPrice.toLocaleString()} Gold`;
            if (this.detailedModalChange) {
                this.detailedModalChange.textContent = `${isPos ? '+' : ''}${diffPct.toFixed(2)}% (${isPos ? '+' : ''}${diff}G)`;
                this.detailedModalChange.className = `detail-price-change ${isPos ? 'gainer' : 'loser'}`;
            }

            if (this.detailedModalHigh) this.detailedModalHigh.textContent = `${maxPrice.toLocaleString()}G`;
            if (this.detailedModalLow) this.detailedModalLow.textContent = `${minPrice.toLocaleString()}G`;
            if (this.detailedModalAvg) this.detailedModalAvg.textContent = `${avgPrice.toLocaleString()}G`;

            this.detailedChartRenderer.render(displayHistory, isPos, stock);
        }

        openNewsDetailModal(newsId) {
            const newsItem = marketEngine.news.find(n => n.id === newsId);
            if (!newsItem) return;

            this.selectedNewsId = newsId;
            this.selectedStockId = newsItem.stockId;

            if (this.newsDetailType) {
                this.newsDetailType.textContent = newsItem.type;
                this.newsDetailType.className = `news-type-tag ${newsItem.type === '찌라시' ? 'type-rumor' : 'type-news'}`;
            }

            if (this.newsDetailStockBadge) {
                const stock = marketEngine.stocks.get(newsItem.stockId);
                const stockName = stock ? stock.name : newsItem.stockId;
                this.newsDetailStockBadge.textContent = `${stockName} (${newsItem.stockId})`;
            }

            if (this.newsDetailTime) this.newsDetailTime.textContent = newsItem.time;
            if (this.newsDetailTitle) this.newsDetailTitle.textContent = newsItem.title;
            if (this.newsDetailContent) this.newsDetailContent.textContent = newsItem.content;

            if (this.newsDetailImpact) {
                this.newsDetailImpact.textContent = `예상 파급력: ${newsItem.impact}`;
                this.newsDetailImpact.className = `impact-tag ${newsItem.isPositive ? 'gainer' : 'loser'}`;
            }

            if (this.newsDetailCredibility) this.newsDetailCredibility.textContent = newsItem.credibility || 'High';
            if (this.newsDetailComment) this.newsDetailComment.textContent = `💡 분석가 의견: ${newsItem.analystComment || '시장 반응주시 필요.'}`;

            this.newsDetailModal.classList.remove('hidden');
        }

        updateTradeModal() {
            const stock = marketEngine.stocks.get(this.selectedStockId);
            if (!stock) return;

            const diff = stock.price - stock.prevPrice;
            const diffPct = stock.prevPrice > 0 ? (diff / stock.prevPrice) * 100 : 0;
            const isPositive = diff >= 0;

            if (this.modalStockName) this.modalStockName.textContent = stock.name;
            if (this.modalStockCode) this.modalStockCode.textContent = stock.id;
            if (this.modalStockSector) {
                const sec = SECTORS[stock.sector] || { name: stock.sector, color: '#00e5ff' };
                this.modalStockSector.textContent = sec.name;
                this.modalStockSector.style.color = sec.color;
                this.modalStockSector.style.background = sec.bg || 'rgba(0, 229, 255, 0.15)';
            }

            if (this.modalStockPrice) this.modalStockPrice.textContent = `${stock.price.toLocaleString()} Gold`;
            if (this.modalStockChange) {
                this.modalStockChange.textContent = `${isPositive ? '+' : ''}${diffPct.toFixed(2)}% (${diff > 0 ? '+' : ''}${diff}G)`;
                this.modalStockChange.className = `price-change-tag ${isPositive ? 'gainer' : 'loser'}`;
            }

            if (this.tradeSubtabChartContent.classList.contains('active')) {
                const history = marketEngine.priceHistory.get(this.selectedStockId) || [stock.price];
                this.chartRenderer?.render(history, isPositive);

                const ob = marketEngine.getOrderBook(this.selectedStockId);
                this.renderOrderbook(ob);
            } else {
                this.updateStockInfoPanel();
            }

            this.updateFavoriteBtnState();
            this.updateTradeModalCalculations();
        }

        updateStockInfoPanel() {
            const stock = marketEngine.stocks.get(this.selectedStockId);
            if (!stock) return;

            if (this.infoRichDesc) this.infoRichDesc.textContent = stock.richDesc || stock.desc;
            if (this.infoPER) this.infoPER.textContent = `${stock.per || 15.0} 배`;
            if (this.infoPBR) this.infoPBR.textContent = `${stock.pbr || 2.0} 배`;
            if (this.infoROE) this.infoROE.textContent = `${stock.roe || 12.0} %`;
            if (this.infoDividend) this.infoDividend.textContent = `${((stock.dividend || 0.02) * 100).toFixed(1)} %`;
            if (this.infoMarketCap) this.infoMarketCap.textContent = stock.marketCap || `${(stock.price * 1000000).toLocaleString()}G`;
            if (this.infoHighLow) this.infoHighLow.textContent = `${stock.high52 || Math.round(stock.price * 1.2)}G / ${stock.low52 || Math.round(stock.price * 0.8)}G`;
            if (this.infoRisk) this.infoRisk.textContent = stock.risk || 'Low';
            if (this.infoTier) this.infoTier.textContent = `Tier ${stock.tier || 'C'}`;

            const relatedNews = marketEngine.news.filter(n => n.stockId === this.selectedStockId);
            if (this.infoRelatedNews) {
                if (relatedNews.length === 0) {
                    this.infoRelatedNews.innerHTML = `<div class="item-desc" style="padding:10px; text-align:center;">최근 노출된 관련 뉴스가 없습니다.</div>`;
                } else {
                    this.infoRelatedNews.innerHTML = relatedNews.map(n => `
                        <div class="news-card" data-news-id="${n.id}">
                            <div class="news-header">
                                <span class="news-type-tag ${n.type === '찌라시' ? 'type-rumor' : 'type-news'}">${n.type}</span>
                                <span class="news-time">${n.time}</span>
                            </div>
                            <div class="news-title">${n.title}</div>
                        </div>
                    `).join('');

                    this.infoRelatedNews.querySelectorAll('.news-card').forEach(c => {
                        c.addEventListener('click', () => this.openNewsDetailModal(c.dataset.newsId));
                    });
                }
            }
        }

        renderOrderbook(ob) {
            if (!this.orderbookRows) return;
            let html = '';

            ob.asks.forEach(item => {
                html += `
                    <div class="ob-row ask">
                        <div class="ob-fill" style="width: ${item.pct}%;"></div>
                        <span class="ob-price">${item.price.toLocaleString()}</span>
                        <span class="ob-vol">${item.vol}</span>
                    </div>
                `;
            });

            ob.bids.forEach(item => {
                html += `
                    <div class="ob-row bid">
                        <div class="ob-fill" style="width: ${item.pct}%;"></div>
                        <span class="ob-price">${item.price.toLocaleString()}</span>
                        <span class="ob-vol">${item.vol}</span>
                    </div>
                `;
            });

            this.orderbookRows.innerHTML = html;
        }

        updateTradeModalCalculations() {
            const stock = marketEngine.stocks.get(this.selectedStockId);
            if (stock && this.modalTotalCost) {
                const totalMargin = Math.round((stock.price * this.tradeQty) / this.selectedLeverage);
                const modeStr = this.isShortMode ? '공매도' : '현물 매수';
                this.modalTotalCost.textContent = `${totalMargin.toLocaleString()} Gold (${modeStr} ${this.selectedLeverage}x)`;
            }
        }

        render(state) {
            if (this.headerDayBadge) this.headerDayBadge.textContent = `Day ${state.day} / ${state.maxDays}`;

            // Top Main Status HUD Updates
            if (this.hudDayVal) this.hudDayVal.textContent = state.day;
            if (this.hudCashVal) this.hudCashVal.textContent = `${state.cash.toLocaleString()} G`;
            if (this.hudTotalAssetVal) this.hudTotalAssetVal.textContent = `${state.totalNetWorth.toLocaleString()} G`;
            
            if (this.hudPnlVal) {
                const isPos = state.totalProfitLoss >= 0;
                const pct = state.totalNetWorth > 0 ? (state.totalProfitLoss / (state.initialCash || 5000000)) * 100 : 0;
                this.hudPnlVal.textContent = `${isPos ? '+' : ''}${state.totalProfitLoss.toLocaleString()} G (${isPos ? '+' : ''}${pct.toFixed(2)}%)`;
                this.hudPnlVal.className = `asset-val pnl ${isPos ? 'positive' : 'negative'}`;
            }

            if (this.homeNetWorth) this.homeNetWorth.textContent = `${state.totalNetWorth.toLocaleString()} Gold`;
            if (this.homeCash) this.homeCash.textContent = `${state.cash.toLocaleString()}G`;
            if (this.homePortfolioVal) this.homePortfolioVal.textContent = `${state.portfolioValue.toLocaleString()}G`;
            
            if (this.homeProfitLoss) {
                const isPos = state.totalProfitLoss >= 0;
                const pct = state.totalNetWorth > 0 ? (state.totalProfitLoss / 5000) * 100 : 0;
                this.homeProfitLoss.textContent = `${isPos ? '+' : ''}${state.totalProfitLoss.toLocaleString()}G (${isPos ? '+' : ''}${pct.toFixed(1)}%)`;
                this.homeProfitLoss.className = `stat-val ${isPos ? 'gainer' : 'loser'}`;
            }

            if (this.settlementDDay) this.settlementDDay.textContent = `정산 D-${state.maxDays - state.day + 1}`;

            const rentPct = Math.min(100, Math.max(0, (state.totalNetWorth / state.targetRent) * 100));
            if (this.rentGoalText) this.rentGoalText.textContent = `${state.totalNetWorth.toLocaleString()}G 중 ${state.targetRent.toLocaleString()}G`;
            if (this.rentProgressFill) this.rentProgressFill.style.width = `${rentPct}%`;

            this.renderTickerMarquee(state.cipherIndex);
            this.renderRecentlyViewedStocks(state.stocks);
            this.renderStockList(state.stocks);
            this.renderNews(state.news);
            this.renderPortfolio(state.portfolio);
            this.renderSectorAllocation(state.portfolio);

            if (!this.tradeModal.classList.contains('hidden')) {
                this.updateTradeModal();
            }
            if (this.detailedChartModal && !this.detailedChartModal.classList.contains('hidden')) {
                this.updateDetailedChartModal();
            }
        }

        renderTickerMarquee(cipherIndex) {
            if (!this.tickerMarquee || !cipherIndex) return;
            const isPos = cipherIndex.diffPct >= 0;
            const sign = isPos ? '▲+' : '▼';

            const itemHtml = `
                <div class="ticker-item index-item">
                    <span class="ticker-index-label">🌐 글로벌 사이퍼 지수</span>
                    <span class="ticker-index-val ${isPos ? 'gainer' : 'loser'}">${cipherIndex.val} ${cipherIndex.unit}</span>
                    <span class="ticker-index-pct ${isPos ? 'gainer' : 'loser'}">(${sign}${cipherIndex.diffPct.toFixed(2)}%)</span>
                </div>
            `;
            this.tickerMarquee.innerHTML = itemHtml.repeat(6);
        }

        renderRecentlyViewedStocks(stocks) {
            const grid = this.recentStocksGrid || this.hotStocksGrid;
            if (!grid) return;
            const stockMap = new Map(stocks.map(s => [s.id, s]));
            let items = (this.recentlyViewedIds || []).map(id => stockMap.get(id)).filter(Boolean);
            if (items.length < 4) {
                for (const s of stocks) {
                    if (items.length >= 4) break;
                    if (!items.find(x => x.id === s.id)) items.push(s);
                }
            }

            grid.innerHTML = items.slice(0, 4).map(s => {
                const diff = s.price - s.prevPrice;
                const diffPct = s.prevPrice > 0 ? (diff / s.prevPrice) * 100 : 0;
                const isPos = diff >= 0;
                const sec = SECTORS[s.sector] || { name: s.sector, color: '#00e5ff' };

                return `
                    <div class="hot-stock-card" data-id="${s.id}">
                        <div class="hot-card-top">
                            <span class="hot-stock-name">${s.name}</span>
                            <span class="sector-tag" style="background:${sec.bg}; color:${sec.color}">${sec.name}</span>
                        </div>
                        <div class="hot-card-price">${s.price.toLocaleString()}G</div>
                        <div class="hot-card-change ${isPos ? 'gainer' : 'loser'}">
                            ${isPos ? '▲' : '▼'} ${Math.abs(diffPct).toFixed(2)}%
                        </div>
                    </div>
                `;
            }).join('');

            grid.querySelectorAll('.hot-stock-card').forEach(card => {
                card.addEventListener('click', () => this.openTradeModal(card.dataset.id));
            });
        }

        renderStockList(stocks) {
            if (!this.stockListContainer) return;
            const query = (this.searchInput?.value || '').toLowerCase().trim();

            const filtered = stocks.filter(s => {
                const matchSector = this.selectedSector === 'FAV'
                    ? (this.favorites && this.favorites.has(s.id))
                    : (this.selectedSector === 'ALL' || s.sector === this.selectedSector);
                const matchQuery = !query || s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query);
                return matchSector && matchQuery;
            });

            const sortMode = this.selectedSortMode || 'POPULAR';
            filtered.sort((a, b) => {
                const diffPctA = a.prevPrice > 0 ? Math.abs((a.price - a.prevPrice) / a.prevPrice) * 100 : 0;
                const diffPctB = b.prevPrice > 0 ? Math.abs((b.price - b.prevPrice) / b.prevPrice) * 100 : 0;

                if (sortMode === 'POPULAR') {
                    const favA = (this.favorites && this.favorites.has(a.id)) ? 1000 : 0;
                    const favB = (this.favorites && this.favorites.has(b.id)) ? 1000 : 0;
                    const recA = (this.recentlyViewedIds && this.recentlyViewedIds.includes(a.id)) ? 500 : 0;
                    const recB = (this.recentlyViewedIds && this.recentlyViewedIds.includes(b.id)) ? 500 : 0;
                    const scoreA = favA + recA + diffPctA * 100 + (a.price / 10);
                    const scoreB = favB + recB + diffPctB * 100 + (b.price / 10);
                    return scoreB - scoreA;
                } else if (sortMode === 'CHANGE') {
                    return diffPctB - diffPctA;
                } else if (sortMode === 'PRICE') {
                    return b.price - a.price;
                } else if (sortMode === 'NAME') {
                    return a.name.localeCompare(b.name, 'ko');
                }
                return 0;
            });

            if (filtered.length === 0) {
                this.stockListContainer.innerHTML = `
                    <div class="empty-list-msg">
                        <span class="empty-icon">⭐</span>
                        <p>${this.selectedSector === 'FAV' ? '등록된 관심 종목이 없습니다.<br>종목 상단의 별(⭐) 아이콘을 눌러 관심 종목으로 등록해보세요!' : '검색 결과가 없습니다.'}</p>
                    </div>
                `;
                return;
            }

            this.stockListContainer.innerHTML = filtered.map(s => {
                const diff = s.price - s.prevPrice;
                const diffPct = s.prevPrice > 0 ? (diff / s.prevPrice) * 100 : 0;
                const isPos = diff >= 0;
                const sec = SECTORS[s.sector] || { name: s.sector, color: '#00e5ff' };
                const isFav = this.favorites && this.favorites.has(s.id);

                return `
                    <div class="stock-item-row" data-id="${s.id}">
                        <div class="item-left">
                            <div class="item-name-area">
                                <button class="item-fav-btn ${isFav ? 'active' : ''}" data-fav-id="${s.id}" title="관심 종목 등록/해제">⭐</button>
                                <span class="item-name">${s.name}</span>
                                <span class="item-code">${s.id}</span>
                                <span class="sector-tag" style="background:${sec.bg}; color:${sec.color}">${sec.name}</span>
                            </div>
                            <div class="item-desc">${s.desc}</div>
                        </div>
                        <div class="item-right">
                            <div class="item-price">${s.price.toLocaleString()}G</div>
                            <div class="item-change ${isPos ? 'gainer' : 'loser'}">
                                ${isPos ? '+' : ''}${diffPct.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            this.stockListContainer.querySelectorAll('.item-fav-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleFavorite(btn.dataset.favId);
                });
            });

            this.stockListContainer.querySelectorAll('.stock-item-row').forEach(row => {
                row.addEventListener('click', () => this.openTradeModal(row.dataset.id));
            });
        }

        renderNews(newsList) {
            if (!this.newsListContainer) return;
            this.newsListContainer.innerHTML = newsList.map(n => `
                <div class="news-card" data-news-id="${n.id}">
                    <div class="news-header">
                        <span class="news-type-tag ${n.type === '찌라시' ? 'type-rumor' : 'type-news'}">${n.type}</span>
                        <span class="news-time">${n.time}</span>
                    </div>
                    <div class="news-title">${n.title}</div>
                    <div class="news-content">${n.content}</div>
                    <div class="news-footer">
                        <span class="impact-tag ${n.isPositive ? 'gainer' : 'loser'}">예상 파급력: ${n.impact}</span>
                        <button class="news-trade-link" data-id="${n.stockId}">자세히 보기 ➔</button>
                    </div>
                </div>
            `).join('');

            this.newsListContainer.querySelectorAll('.news-card').forEach(card => {
                card.addEventListener('click', () => this.openNewsDetailModal(card.dataset.newsId));
            });
        }

        renderPortfolio(portfolio) {
            if (!this.portfolioListContainer) return;
            if (portfolio.length === 0) {
                this.portfolioListContainer.innerHTML = `<div class="item-desc" style="text-align:center; padding:20px;">보유 중인 주식이 없습니다.</div>`;
                return;
            }

            this.portfolioListContainer.innerHTML = portfolio.map(item => {
                const isPos = item.profitLoss >= 0;
                const modeTag = item.isShort ? '<span class="lock-tag" style="background:rgba(255,59,92,0.2); color:var(--accent-red)">공매도</span>' : '<span class="lock-tag" style="background:rgba(0,229,255,0.2); color:var(--accent-cyan)">매수</span>';
                const levTag = item.leverage > 1 ? `<span class="lock-tag" style="background:rgba(255,214,0,0.2); color:var(--accent-yellow)">${item.leverage}x</span>` : '';

                return `
                    <div class="portfolio-item clickable" data-id="${item.id}" title="${item.stock.name} 주문창으로 이동">
                        <div>
                            <div class="port-stock-name">${item.stock.name} (${item.id}) ${modeTag} ${levTag}</div>
                            <div class="port-stock-sub">수량: ${item.qty}주 • 진입가: ${item.avgPrice.toLocaleString()}G</div>
                        </div>
                        <div class="port-right">
                            <div class="port-val">${Math.round(item.currentVal).toLocaleString()}G</div>
                            <div class="port-pl ${isPos ? 'gainer' : 'loser'}">
                                ${isPos ? '+' : ''}${Math.round(item.profitLoss).toLocaleString()}G (${isPos ? '+' : ''}${item.profitLossPct.toFixed(1)}%)
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            this.portfolioListContainer.querySelectorAll('.portfolio-item').forEach(row => {
                row.addEventListener('click', () => this.openTradeModal(row.dataset.id));
            });
        }

        renderSectorAllocation(portfolio) {
            if (!this.sectorDonutChart || !this.allocationLegendList) return;

            const canvas = this.sectorDonutChart;
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            const cx = width / 2;
            const cy = height / 2;
            const outerRadius = 46;
            const innerRadius = 30;

            ctx.clearRect(0, 0, width, height);

            if (!portfolio || portfolio.length === 0) {
                ctx.beginPath();
                ctx.arc(cx, cy, (outerRadius + innerRadius) / 2, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = outerRadius - innerRadius;
                ctx.stroke();

                if (this.donutCenterVal) this.donutCenterVal.textContent = '0개';
                this.allocationLegendList.innerHTML = `<div class="item-desc" style="text-align:center; padding:12px; font-size:11px; color: var(--text-muted);">보유 중인 주식이 없습니다.</div>`;
                return;
            }

            const sectorTotals = {};
            let totalVal = 0;

            portfolio.forEach(item => {
                const val = Math.max(0, item.currentVal || 0);
                if (val <= 0) return;
                const secKey = item.stock?.sector || 'IT';
                if (!sectorTotals[secKey]) {
                    sectorTotals[secKey] = {
                        key: secKey,
                        name: SECTORS[secKey]?.name || secKey,
                        color: SECTORS[secKey]?.color || '#00e5ff',
                        val: 0
                    };
                }
                sectorTotals[secKey].val += val;
                totalVal += val;
            });

            const sectorList = Object.values(sectorTotals).sort((a, b) => b.val - a.val);

            if (totalVal === 0 || sectorList.length === 0) {
                ctx.beginPath();
                ctx.arc(cx, cy, (outerRadius + innerRadius) / 2, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = outerRadius - innerRadius;
                ctx.stroke();

                if (this.donutCenterVal) this.donutCenterVal.textContent = '0개';
                this.allocationLegendList.innerHTML = `<div class="item-desc" style="text-align:center; padding:12px; font-size:11px; color: var(--text-muted);">보유 중인 주식이 없습니다.</div>`;
                return;
            }

            if (this.donutCenterVal) {
                this.donutCenterVal.textContent = `${sectorList.length}개`;
            }

            let startAngle = -Math.PI / 2;
            const gapAngle = sectorList.length > 1 ? 0.05 : 0;

            sectorList.forEach(sec => {
                sec.pct = (sec.val / totalVal) * 100;
                const sliceAngle = (sec.val / totalVal) * Math.PI * 2;
                const endAngle = startAngle + sliceAngle - gapAngle;

                ctx.beginPath();
                ctx.arc(cx, cy, outerRadius, startAngle, Math.max(startAngle, endAngle));
                ctx.arc(cx, cy, innerRadius, Math.max(startAngle, endAngle), startAngle, true);
                ctx.closePath();
                ctx.fillStyle = sec.color;
                ctx.shadowColor = sec.color;
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.shadowBlur = 0;

                startAngle += sliceAngle;
            });

            this.allocationLegendList.innerHTML = sectorList.map(sec => `
                <div class="legend-item">
                    <div class="legend-left">
                        <span class="legend-dot" style="background: ${sec.color}; box-shadow: 0 0 6px ${sec.color}aa;"></span>
                        <span class="legend-name">${sec.name}</span>
                    </div>
                    <div class="legend-right">
                        <span style="font-weight:700; color: ${sec.color}">${sec.pct.toFixed(1)}%</span>
                        <span style="color:var(--text-muted); font-size:10px;">(${Math.round(sec.val).toLocaleString()}G)</span>
                    </div>
                </div>
            `).join('');
        }

        showSettlementModal() {
            const state = marketEngine.getState();
            const finalRemain = state.totalNetWorth - state.targetRent;
            const isSuccess = finalRemain >= 0;

            if (this.settleCash) this.settleCash.textContent = `${state.cash.toLocaleString()} G`;
            if (this.settlePortfolio) this.settlePortfolio.textContent = `${state.portfolioValue.toLocaleString()} G`;
            if (this.settleTotalWorth) this.settleTotalWorth.textContent = `${state.totalNetWorth.toLocaleString()} G`;
            if (this.settleRentDeduction) this.settleRentDeduction.textContent = `-${state.targetRent.toLocaleString()} G`;
            if (this.settleFinalRemain) this.settleFinalRemain.textContent = `${finalRemain.toLocaleString()} G`;

            if (this.resultStamp) {
                this.resultStamp.textContent = isSuccess ? 'SUCCESS' : 'BANKRUPT';
                this.resultStamp.style.color = isSuccess ? 'var(--accent-cyan)' : 'var(--accent-red)';
                this.resultStamp.style.borderColor = isSuccess ? 'var(--accent-cyan)' : 'var(--accent-red)';
            }

            if (this.resultGrade) {
                let grade = 'Grade B';
                if (finalRemain >= 10000) grade = 'Grade S+ (최고 성과)';
                else if (finalRemain >= 5000) grade = 'Grade S (우수 성과)';
                else if (finalRemain >= 2000) grade = 'Grade A (안정적)';
                else if (!isSuccess) grade = 'Grade F (조기 파산)';

                this.resultGrade.textContent = grade;
                this.resultGrade.style.color = isSuccess ? 'var(--accent-yellow)' : 'var(--accent-red)';
            }

            this.settlementModal.classList.remove('hidden');
        }

        showToast(message, isSuccess = true) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.style.borderColor = isSuccess ? 'var(--accent-cyan)' : 'var(--accent-red)';
            toast.textContent = message;

            const container = document.getElementById('toastContainer');
            if (container) {
                container.appendChild(toast);
                setTimeout(() => toast.remove(), 2500);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.stockWarsApp = new StockWarsApp();
        });
    } else {
        window.stockWarsApp = new StockWarsApp();
    }
})();
