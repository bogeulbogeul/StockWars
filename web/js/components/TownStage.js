/**
 * TownStage Component
 * Unity equivalent: TownScene / TownGroundController.cs / TownCameraController.cs
 * Renders the 2D Side-Scrolling Public Town Stage with smooth camera panning,
 * parallax background, ground platform, modular building asset slots, and character movement.
 */

export class TownStage {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;

        // Town World Geometry & Bounds (Spacious Boulevard & Plazas)
        this.worldWidth = 5900; // Expanded track width for 10 spacious buildings + 2 benches + 1 billboard
        this.viewportWidth = window.innerWidth;
        this.charPosX = 260; // 2D Side-view X coordinate in front of Home Officetel
        this.charFacing = 1; // 1: right, -1: left
        this.isMoving = false;
        this.walkPhase = 0;
        this.isResting = false;

        // Camera Tracking
        this.cameraX = 0; // Viewport horizontal offset
        this.targetCameraX = 0;
        this.smoothTime = 0.12;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartCamX = 0;

        // Input Tracking
        this.keysHeld = new Set();
        this.animFrameId = null;
        this.billboardTimer = null;
        this.billboardSlideIdx = 0;
        this.lastTimestamp = performance.now();
        this.activeChannel = '타운 2';
        this.activeNearbyObject = null;

        // 10 GDD Canonical Town Buildings (Spaciously arranged with 260px~460px open plazas)
        this.buildings = [
            {
                id: 'home_office_tower',
                name: '홈 오피스텔',
                sign: '홈 오피스텔',
                category: '레지던스',
                icon: '🏢',
                x: 150,
                width: 280,
                height: 350,
                colorTheme: 'home-officetel',
                desc: '파트너 안나가 상주하는 나만의 오피스텔 펜트하우스 트레이딩 룸입니다.',
                actionText: '내 오피스 들어가기',
                isOfficetel: true
            },
            {
                id: 'bit_logistics',
                name: '비트 물류센터',
                sign: '비트 물류',
                category: '물류 / 노동',
                icon: '📦',
                x: 720,
                width: 280,
                height: 230,
                colorTheme: 'yellow',
                desc: '초기 시드머니 확보를 위한 60초 화물 운송 노동소 (관리소장 박씨)',
                actionText: '물류창고 진입'
            },
            {
                id: 'vivian_store',
                name: '비비안 잡화점',
                sign: '비비안 잡화점',
                category: '잡화 / 소모품',
                icon: '🏪',
                x: 1280,
                width: 240,
                height: 210,
                colorTheme: 'green',
                desc: '에너지 드링크(기력 회복) 및 데모 편의 소모품 구매 (상점주 비비안)',
                actionText: '잡화점 입장'
            },
            {
                id: 'julian_furniture',
                name: '모던 프레임 가구점',
                sign: '모던 프레임',
                category: '가구 / 인테리어',
                icon: '🛋️',
                x: 1860,
                width: 250,
                height: 230,
                colorTheme: 'amber',
                desc: '8x8 오피스 맞춤형 가구, 책상 및 인테리어 데코 쇼룸 (디자이너 줄리안 & 레오)',
                actionText: '가구점 입장'
            },
            {
                id: 'claire_apparel',
                name: '테일러드 의상실',
                sign: '테일러드',
                category: '의상 / 스타일',
                icon: '👗',
                x: 2370,
                width: 240,
                height: 230,
                colorTheme: 'magenta',
                desc: '트레이더 전용 스탯 의상 및 명품 커스텀 코스튬 (디자이너 클레어)',
                actionText: '의상실 입장'
            },
            {
                id: 'data_ink_bookstore',
                name: '데이터 잉크 서점',
                sign: '데이터 잉크',
                category: '서점 / 지식',
                icon: '📚',
                x: 2870,
                width: 240,
                height: 220,
                colorTheme: 'indigo',
                desc: '영구 스탯 강화 전문 도서 및 섹터별 인사이트 리포트 (사서 소피아)',
                actionText: '서점 입장'
            },
            {
                id: 'cipher_securities',
                name: '사이퍼 증권 본점',
                sign: '사이퍼 증권',
                category: '금융 / 트레이딩',
                icon: '🏛️',
                x: 3570,
                width: 440,
                height: 360,
                isMainLandmark: true,
                colorTheme: 'violet',
                desc: '중앙 거대 객장, 실시간 전광판 틱 시세판, 아레나 배틀룸 및 서밋 라운지 (에이전트 K)',
                actionText: '증권사 객장 입장'
            },
            {
                id: 'node_finance',
                name: '노드 파이낸스 은행',
                sign: '노드 파이낸스',
                category: '은행 / 금융',
                icon: '🏦',
                x: 4390,
                width: 300,
                height: 260,
                colorTheme: 'blue',
                desc: '4주 정기 적금, 긴급 신용 대출 및 부채 자산 관리 (지점장 샤일록)',
                actionText: '은행 창구 이용'
            },
            {
                id: 'midnight_pub',
                name: '미드나잇 펍',
                sign: '미드나잇 펍',
                category: '사교 / 정보',
                icon: '🍸',
                x: 4970,
                width: 260,
                height: 230,
                colorTheme: 'purple',
                desc: '확정형 고급 찌라시 정보 거래, 지하 정통 블랙잭 테이블 (브로커 안드레)',
                actionText: '펍 입장'
            },
        // Interactive Town Props (2 Recovery Benches + 1 News/Ad LED Billboard)
        this.interactiveProps = [
            {
                id: 'bench_west',
                type: 'bench',
                name: '서부 공원 힐링 벤치',
                icon: '🪑',
                x: 1590,
                width: 100,
                height: 52,
                desc: '도심 속 녹음이 어우러진 휴식 공간입니다. 잠시 앉아 피로와 기력/체력을 100% 충전할 수 있습니다.',
                actionText: '벤치에 앉아 체력 회복'
            },
            {
                id: 'billboard_central',
                type: 'billboard',
                name: '사이퍼 센트럴 미디어 전광판',
                icon: '📺',
                x: 3200,
                width: 260,
                height: 275,
                desc: '실시간 긴급 뉴스 속보, 상점 특별 할인 광고 및 아레나 대회 공지가 송출되는 타운 대형 LED 전광판입니다.',
                actionText: '실시간 속보 & 광고 브리핑'
            },
            {
                id: 'bench_east',
                type: 'bench',
                name: '동부 광장 쉼터 벤치',
                icon: '🪑',
                x: 4130,
                width: 100,
                height: 52,
                desc: '증권가와 은행가 사이 위치한 휴식 벤치입니다. 지친 트레이더들의 체력과 기력을 빠르게 회복시킵니다.',
                actionText: '벤치에 앉아 체력 회복'
            }
        ];

        // Street Lamps, Planters & City Decors
        this.streetLamps = [80, 480, 1060, 1530, 1750, 2190, 2690, 3140, 3500, 4060, 4290, 4770, 5320, 5800];
        this.urbanTrees = [580, 1720, 2260, 3120, 4230, 5380];
        this.directionSigns = [
            { x: 490, text: '← 홈 오피스텔 | 센트럴 상점가 →' },
            { x: 3500, text: '← 데이터 서점 | 증권사 • 금융가 →' }
        ];

        // Billboard News & Ad Items
        this.billboardNews = [
            { badge: '🔥 긴급 속보', type: 'breaking', text: '바이오닉스, 차세대 AI 신약 임상 3상 돌파 루머에 거래량 폭증!' },
            { badge: '📢 상점 특가', type: 'ad', text: '비비안 잡화점: 오늘 하루 몬스터 에너지 드링크 20% 특별 타임세일!' },
            { badge: '📈 시장 시황', type: 'market', text: '코스닥 반도체 & AI 테마주 일제히 급등... 외인 대규모 순매수 유입' },
            { badge: '🏆 아레나 공지', type: 'event', text: '사이퍼 증권배 실전투자대회 시즌 1 참가자 접수 중! (총상금 10억 크레딧)' },
            { badge: '🛋️ 가구 신상', type: 'ad', text: '모던 프레임 가구점: 8x8 오피스 맞춤형 사이버 트레이딩 데스크 세트 입고' }
        ];

        this.render();
        this.initDOM();
        this.initEventListeners();
        this.startLoop();
        this.startBillboardCarousel();
    }

    render() {
        const html = `
            <div id="townStageContainer" class="town-stage-container hidden">
                <!-- Town Top Info Header -->
                <div class="town-channel-header-hud">
                    <div class="town-hud-left">
                        <span class="town-hud-badge">🏙️ PUBLIC TOWN</span>
                        <span class="town-channel-name" id="townActiveChannelText">채널: 타운 2 (원활 • 14ms)</span>
                    </div>
                    <div class="town-hud-right">
                        <button class="town-return-btn" id="btnTownReturnOffice" title="오피스로 돌아가기">
                            <span>🏢 오피스로 복귀</span>
                        </button>
                    </div>
                </div>

                <!-- Town Side-Scrolling Controls Hint -->
                <div class="town-controls-hint" id="townControlsHint">
                    <span class="hint-icon">🎮</span>
                    <span class="hint-text">마을 탐색: <b>A, D / 좌우 방향키</b> 이동 • <b>마우스 드래그 / 휠</b> 카메라 스크롤 • <b>F키</b> 상호작용</span>
                </div>

                <!-- Main Town Viewport & Camera Stage -->
                <div class="town-viewport" id="townViewport">
                    <!-- Parallax Background Layer -->
                    <div class="town-parallax-bg" id="townParallaxBg">
                        <div class="parallax-skyline"></div>
                        <div class="parallax-stars"></div>
                        <div class="parallax-clouds">
                            <span class="p-cloud c-1">☁️</span>
                            <span class="p-cloud c-2">☁️</span>
                            <span class="p-cloud c-3">☁️</span>
                        </div>
                    </div>

                    <!-- Town World Scroll Track -->
                    <div class="town-world-track" id="townWorldTrack" style="width: ${this.worldWidth}px;">
                        
                        <!-- Buildings Row Layer -->
                        <div class="town-buildings-layer">
                            ${this.renderBuildings()}
                        </div>

                        <!-- Interactive Props Layer (Benches & Electronic Billboard) -->
                        <div class="town-interactive-props-layer">
                            ${this.renderInteractiveProps()}
                        </div>

                        <!-- Decorative Street Props & Lamps Layer -->
                        <div class="town-street-props">
                            ${this.renderStreetProps()}
                        </div>

                        <!-- 2D Side-View Player Character -->
                        <div class="town-player-character" id="townPlayerChar" style="left: ${this.charPosX}px;">
                            <div class="town-char-nametag" id="townPlayerNametag">사이퍼 트레이더</div>
                            <!-- 3D/2D Character Body -->
                            <div class="town-char-body" id="townCharBody">
                                <div class="char-face-front">
                                    <span class="char-eye left"></span>
                                    <span class="char-eye right"></span>
                                    <span class="char-smile"></span>
                                    <span class="char-badge-pip"></span>
                                </div>
                            </div>
                            <div class="town-char-shadow"></div>
                        </div>

                        <!-- Ground Platform (Sidewalk & Asphalt Road) -->
                        <div class="town-ground-platform" id="townGroundPlatform">
                            <div class="ground-sidewalk-top"></div>
                            <div class="ground-pavement-body">
                                <div class="road-dashed-line"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Proximity Action Prompt Overlay -->
                <div class="town-building-prompt hidden" id="townBuildingPrompt">
                    <span class="prompt-icon" id="promptIcon">🏛️</span>
                    <div class="prompt-info">
                        <span class="prompt-building-title" id="promptBuildingTitle">사이퍼 증권사 본점</span>
                        <span class="prompt-building-desc" id="promptBuildingDesc">증권사 객장 입장</span>
                    </div>
                    <span class="prompt-hotkey-btn">F</span>
                </div>

                <!-- Electronic Billboard News & Ad Interactive Modal -->
                ${this.renderBillboardModal()}
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    renderBuildings() {
        return this.buildings.map(b => `
            <div class="town-building-box theme-${b.colorTheme} ${b.isMainLandmark ? 'landmark-main' : ''} ${b.isOfficetel ? 'building-officetel' : ''}" 
                 id="building_${b.id}"
                 data-building-id="${b.id}"
                 data-building-name="${b.name}"
                 data-building-desc="${b.desc}"
                 data-action-text="${b.actionText}"
                 style="left: ${b.x}px; width: ${b.width}px; height: ${b.height}px;">
                
                <!-- Architectural Rooftop Parapet / Header Plate -->
                <div class="building-roof-parapet">
                    <div class="parapet-header-bar">
                        <span class="building-category-tag">${b.category}</span>
                        <span class="building-name-plate">${b.name}</span>
                    </div>
                    ${b.isOfficetel ? '<div class="officetel-penthouse-top"><span class="penthouse-window"></span><span class="penthouse-window"></span></div>' : ''}
                </div>

                <!-- Modular Architectural Asset Slot -->
                <div class="building-asset-slot" data-slot-id="${b.id}">
                    <div class="building-wireframe-facade">
                        <div class="building-windows-grid">
                            ${this.renderMockWindows(b.width, b.height, b.isOfficetel)}
                        </div>
                        <div class="building-entrance-gate">
                            <span class="entrance-door-light"></span>
                            <span class="entrance-text">${b.name} 출입구</span>
                        </div>
                    </div>
                </div>

                <!-- Ground Shadow Base -->
                <div class="building-base-shadow"></div>
            </div>
        `).join('');
    }

    renderInteractiveProps() {
        return this.interactiveProps.map(p => {
            if (p.type === 'bench') {
                return `
                    <div class="town-bench-prop" id="prop_${p.id}" data-prop-id="${p.id}" style="left: ${p.x}px; width: ${p.width}px;">
                        <div class="bench-aura-glow"></div>
                        <div class="bench-structure">
                            <div class="bench-backrest">
                                <span class="bench-slat"></span>
                                <span class="bench-slat"></span>
                            </div>
                            <div class="bench-seat">
                                <span class="bench-slat"></span>
                                <span class="bench-slat"></span>
                            </div>
                            <div class="bench-armrests">
                                <span class="arm-left"></span>
                                <span class="arm-right"></span>
                            </div>
                            <div class="bench-legs">
                                <span class="leg-left"></span>
                                <span class="leg-right"></span>
                            </div>
                        </div>
                        <div class="bench-name-tag">🪑 힐링 벤치</div>
                        <div class="bench-shadow"></div>
                    </div>
                `;
            } else if (p.type === 'billboard') {
                return `
                    <div class="town-billboard-prop" id="prop_${p.id}" data-prop-id="${p.id}" style="left: ${p.x}px; width: ${p.width}px; height: ${p.height}px;">
                        <!-- Steel Pylons Support Truss -->
                        <div class="billboard-pylons">
                            <div class="pylon-leg left"></div>
                            <div class="pylon-leg right"></div>
                            <div class="pylon-cross-bracing"></div>
                        </div>
                        <!-- LED Display Enclosure -->
                        <div class="billboard-screen-frame">
                            <div class="billboard-top-status">
                                <span class="live-dot-pulse"></span>
                                <span class="live-title">LIVE NEWS & AD</span>
                                <span class="live-tag">CYPER CENTRAL</span>
                            </div>
                            <!-- Screen Content Area -->
                            <div class="billboard-main-screen">
                                <div class="screen-scanlines"></div>
                                <div class="billboard-slides-container" id="townBillboardSlides">
                                    ${this.billboardNews.map((news, idx) => `
                                        <div class="billboard-news-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                                            <div class="news-badge-row">
                                                <span class="news-badge badge-${news.type}">${news.badge}</span>
                                            </div>
                                            <p class="news-body-text">${news.text}</p>
                                        </div>
                                    `).join('')}
                                </div>
                                <!-- Bottom Live Stock Ticker -->
                                <div class="billboard-ticker-tape">
                                    <div class="ticker-text-track">
                                        <span>⚡ 코스닥 912.45 (+2.6%)</span>
                                        <span>• 비트코인 $96,400 (+4.2%)</span>
                                        <span>• 이더리움 $3,850 (+2.8%)</span>
                                        <span>• 사이퍼 증권 객장 수수료 0.01% 우대 적용 중!</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="billboard-base-shadow"></div>
                    </div>
                `;
            }
            return '';
        }).join('');
    }

    renderStreetProps() {
        let html = '';
        // Street Lamps
        this.streetLamps.forEach(x => {
            html += `
                <div class="street-lamp" style="left: ${x}px;">
                    <div class="lamp-head"></div>
                    <div class="lamp-light"></div>
                    <div class="lamp-base"></div>
                </div>
            `;
        });
        // Urban Trees & Planters
        this.urbanTrees.forEach(x => {
            html += `
                <div class="town-urban-tree" style="left: ${x}px;">
                    <div class="tree-foliage">
                        <span class="foliage-layer layer-1"></span>
                        <span class="foliage-layer layer-2"></span>
                    </div>
                    <div class="tree-trunk"></div>
                    <div class="tree-planter-pot"></div>
                </div>
            `;
        });
        // Direction Signs
        this.directionSigns.forEach(sign => {
            html += `
                <div class="town-direction-sign" style="left: ${sign.x}px;">
                    <div class="sign-plate">${sign.text}</div>
                    <div class="sign-pole"></div>
                </div>
            `;
        });
        return html;
    }

    renderBillboardModal() {
        return `
            <div class="town-billboard-modal-overlay hidden" id="townBillboardModal">
                <div class="town-billboard-modal-dialog">
                    <div class="billboard-modal-header">
                        <div class="modal-title-group">
                            <span class="modal-title-icon">📺</span>
                            <div>
                                <h3 class="modal-title-text">사이퍼 센트럴 미디어 뉴스 & 광고 브리핑</h3>
                                <p class="modal-subtitle-text">실시간 속보 찌라시 • 상점 특가 이벤트 • 증시 종합 시황</p>
                            </div>
                        </div>
                        <button class="modal-close-btn" id="btnBillboardClose">✕</button>
                    </div>
                    <div class="billboard-modal-body">
                        <div class="briefing-section">
                            <h4 class="section-title">🔥 실시간 긴급 속보 & 찌라시</h4>
                            <div class="news-list-grid">
                                <div class="news-card-item breaking">
                                    <span class="news-card-badge">속보</span>
                                    <div class="news-card-content">
                                        <div class="news-card-headline">바이오닉스, 차세대 AI 신약 임상 3상 돌파 루머</div>
                                        <div class="news-card-detail">FDA 승인 임박 소식과 함께 장외 거래량 500% 급증. 제약/바이오 섹터 강력한 수급 유입 중.</div>
                                    </div>
                                </div>
                                <div class="news-card-item market">
                                    <span class="news-card-badge">시황</span>
                                    <div class="news-card-content">
                                        <div class="news-card-headline">코스닥 반도체 & 친환경 테마주 외인 대량 순매수</div>
                                        <div class="news-card-detail">기술주 중심의 강한 반등 랠리 지속. 주간 누적 수익률 상위 트레이더 다수 배출.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="briefing-section">
                            <h4 class="section-title">📢 타운 상점 특별 프로모션</h4>
                            <div class="ad-list-grid">
                                <div class="ad-card-item shop">
                                    <span class="ad-card-badge">잡화점</span>
                                    <div class="ad-card-content">
                                        <div class="ad-card-title">비비안 잡화점: 몬스터 에너지 드링크 20% 타임 세일</div>
                                        <div class="ad-card-desc">기력 회복 소모품 전 품목 특별 할인! 데모 기간 한정 특가 제공 중.</div>
                                    </div>
                                </div>
                                <div class="ad-card-item furniture">
                                    <span class="ad-card-badge">가구점</span>
                                    <div class="ad-card-content">
                                        <div class="ad-card-title">모던 프레임: 오피스텔 8x8 전용 사이버 데스크 입고</div>
                                        <div class="ad-card-desc">홈 오피스 인테리어를 업그레이드할 신상 트레이딩 스테이션 쇼룸 전시 중.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderMockWindows(w, h, isOfficetel = false) {
        const colWidth = isOfficetel ? 45 : 55;
        const rowHeight = isOfficetel ? 40 : 50;
        const cols = Math.max(3, Math.floor(w / colWidth));
        const rows = Math.max(3, Math.floor((h - 80) / rowHeight));
        let windowsHtml = '';
        for (let i = 0; i < cols * rows; i++) {
            const isLit = Math.random() > 0.45;
            windowsHtml += `<div class="mock-window-pane ${isLit ? 'lit' : ''} ${isOfficetel ? 'officetel-window' : ''}"></div>`;
        }
        return windowsHtml;
    }

    initDOM() {
        this.townContainer = document.getElementById('townStageContainer');
        this.viewport = document.getElementById('townViewport');
        this.worldTrack = document.getElementById('townWorldTrack');
        this.parallaxBg = document.getElementById('townParallaxBg');
        this.playerChar = document.getElementById('townPlayerChar');
        this.charBody = document.getElementById('townCharBody');
        this.playerNametag = document.getElementById('townPlayerNametag');
        this.activeChannelText = document.getElementById('townActiveChannelText');
        this.btnReturnOffice = document.getElementById('btnTownReturnOffice');
        this.promptBox = document.getElementById('townBuildingPrompt');
        this.promptIcon = document.getElementById('promptIcon');
        this.promptTitle = document.getElementById('promptBuildingTitle');
        this.promptDesc = document.getElementById('promptBuildingDesc');
        this.billboardModal = document.getElementById('townBillboardModal');
        this.btnBillboardClose = document.getElementById('btnBillboardClose');
    }

    initEventListeners() {
        // Return to Office button
        this.btnReturnOffice?.addEventListener('click', () => {
            if (this.callbacks.onReturnOffice) {
                this.callbacks.onReturnOffice();
            }
        });

        // Billboard modal close
        this.btnBillboardClose?.addEventListener('click', () => {
            this.closeBillboardModal();
        });
        this.billboardModal?.addEventListener('click', (e) => {
            if (e.target === this.billboardModal) {
                this.closeBillboardModal();
            }
        });

        // Click on ground/track or props to walk & interact
        this.viewport?.addEventListener('click', (e) => {
            if (this.isDragging) return;
            
            // Check building click
            const targetBuilding = e.target.closest('.town-building-box');
            if (targetBuilding) {
                const bId = targetBuilding.dataset.buildingId;
                const building = this.buildings.find(b => b.id === bId);
                if (building) {
                    this.charPosX = building.x + building.width / 2;
                    this.checkProximity();
                    this.triggerAction(building);
                }
                return;
            }

            // Check interactive prop click (Bench, Billboard)
            const targetProp = e.target.closest('.town-bench-prop, .town-billboard-prop');
            if (targetProp) {
                const pId = targetProp.dataset.propId;
                const prop = this.interactiveProps.find(p => p.id === pId);
                if (prop) {
                    this.charPosX = prop.x + prop.width / 2;
                    this.checkProximity();
                    this.triggerAction(prop);
                }
                return;
            }

            const rect = this.viewport.getBoundingClientRect();
            const clickWorldX = e.clientX - rect.left + this.cameraX;
            this.charPosX = Math.max(80, Math.min(this.worldWidth - 80, clickWorldX));
            if (this.isResting) {
                this.isResting = false;
                this.playerChar?.classList.remove('resting');
            }
            this.checkProximity();
        });

        // Mouse Drag to Scroll Camera
        this.viewport?.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            this.isDragging = false;
            this.dragStartX = e.clientX;
            this.dragStartCamX = this.cameraX;

            const onMouseMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - this.dragStartX;
                if (Math.abs(deltaX) > 5) {
                    this.isDragging = true;
                    this.setCameraX(this.dragStartCamX - deltaX);
                }
            };

            const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                setTimeout(() => { this.isDragging = false; }, 50);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });

        // Mouse Wheel Horizontal Scroll
        this.viewport?.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
            this.setCameraX(this.cameraX + delta * 0.8);
        }, { passive: false });

        // Keyboard Controls (A/D, Arrows, F for Interaction)
        window.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
            if (this.townContainer?.classList.contains('hidden')) return;

            const key = e.key.toLowerCase();
            const movementKeys = ['a', 'd', 'arrowleft', 'arrowright'];

            if (movementKeys.includes(key)) {
                e.preventDefault();
                this.keysHeld.add(key);
                if (this.isResting) {
                    this.isResting = false;
                    this.playerChar?.classList.remove('resting');
                }
            } else if (key === 'f' || key === 'enter') {
                if (this.activeNearbyObject) {
                    e.preventDefault();
                    this.triggerAction(this.activeNearbyObject);
                }
            } else if (key === 'escape') {
                if (this.billboardModal && !this.billboardModal.classList.contains('hidden')) {
                    this.closeBillboardModal();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keysHeld.delete(key);
        });

        window.addEventListener('resize', () => {
            this.viewportWidth = window.innerWidth;
            this.setCameraX(this.cameraX);
        });

        // Prompt Click
        this.promptBox?.addEventListener('click', () => {
            if (this.activeNearbyObject) {
                this.triggerAction(this.activeNearbyObject);
            }
        });
    }

    setCameraX(newX) {
        const maxCamX = Math.max(0, this.worldWidth - (this.viewport?.clientWidth || window.innerWidth));
        this.cameraX = Math.max(0, Math.min(maxCamX, newX));
        this.applyCameraTransform();
    }

    applyCameraTransform() {
        if (this.worldTrack) {
            this.worldTrack.style.transform = `translateX(-${this.cameraX.toFixed(2)}px)`;
        }
        if (this.parallaxBg) {
            // Parallax factor 0.35
            this.parallaxBg.style.transform = `translateX(-${(this.cameraX * 0.35).toFixed(2)}px)`;
        }
    }

    startLoop() {
        const loop = (timestamp) => {
            this.update(timestamp);
            this.animFrameId = requestAnimationFrame(loop);
        };
        this.animFrameId = requestAnimationFrame(loop);
    }

    startBillboardCarousel() {
        if (this.billboardTimer) clearInterval(this.billboardTimer);
        this.billboardTimer = setInterval(() => {
            const slides = document.querySelectorAll('.billboard-news-slide');
            if (!slides || slides.length === 0) return;
            slides[this.billboardSlideIdx]?.classList.remove('active');
            this.billboardSlideIdx = (this.billboardSlideIdx + 1) % slides.length;
            slides[this.billboardSlideIdx]?.classList.add('active');
        }, 4000);
    }

    update(now) {
        if (this.townContainer?.classList.contains('hidden')) return;

        const dt = Math.min(0.06, (now - this.lastTimestamp) / 1000);
        this.lastTimestamp = now;

        let moveX = 0;
        if (this.keysHeld.has('a') || this.keysHeld.has('arrowleft')) moveX -= 1;
        if (this.keysHeld.has('d') || this.keysHeld.has('arrowright')) moveX += 1;

        const speed = 340; // Pixels per second

        if (moveX !== 0) {
            if (this.isResting) {
                this.isResting = false;
                this.playerChar?.classList.remove('resting');
            }
            this.charPosX += moveX * speed * dt;
            this.charPosX = Math.max(80, Math.min(this.worldWidth - 80, this.charPosX));
            this.charFacing = moveX > 0 ? 1 : -1;
            this.isMoving = true;
            this.walkPhase += dt * 14;

            // Camera Smooth Follow
            const halfView = (this.viewport?.clientWidth || window.innerWidth) / 2;
            const desiredCamX = this.charPosX - halfView;
            this.setCameraX(this.cameraX + (desiredCamX - this.cameraX) * 0.1);

            this.checkProximity();
        } else {
            this.isMoving = false;
        }

        this.renderCharacterFrame();
    }

    renderCharacterFrame() {
        if (!this.playerChar) return;

        let bobY = 0;
        if (this.isMoving) {
            bobY = -Math.abs(Math.sin(this.walkPhase)) * 8;
        } else if (this.isResting) {
            bobY = 12; // Sitting lower on bench
        }

        this.playerChar.style.left = `${this.charPosX.toFixed(1)}px`;
        this.playerChar.style.transform = `translateY(${bobY.toFixed(1)}px)`;

        if (this.charBody) {
            this.charBody.style.transform = `scaleX(${this.charFacing})`;
        }
    }

    checkProximity() {
        let nearby = null;
        
        // 1. Check interactive props (Benches & Billboard)
        for (const p of this.interactiveProps) {
            const pCenter = p.x + p.width / 2;
            if (Math.abs(this.charPosX - pCenter) <= p.width / 2 + 50) {
                nearby = { ...p, isProp: true };
                break;
            }
        }

        // 2. Check buildings if no prop nearby
        if (!nearby) {
            for (const b of this.buildings) {
                const bCenter = b.x + b.width / 2;
                if (Math.abs(this.charPosX - bCenter) <= b.width / 2 + 50) {
                    nearby = { ...b, isBuilding: true };
                    break;
                }
            }
        }

        if (nearby?.id !== this.activeNearbyObject?.id) {
            this.activeNearbyObject = nearby;
            if (nearby) {
                if (this.promptIcon) this.promptIcon.textContent = nearby.icon || '🏛️';
                if (this.promptTitle) this.promptTitle.textContent = nearby.name;
                if (this.promptDesc) this.promptDesc.textContent = `${nearby.actionText} [F]`;
                this.promptBox?.classList.remove('hidden');
            } else {
                this.promptBox?.classList.add('hidden');
            }
        }
    }

    triggerAction(obj) {
        if (!obj) return;
        if (obj.isProp || obj.type === 'bench' || obj.type === 'billboard') {
            if (obj.type === 'bench') {
                this.restOnBench(obj);
            } else if (obj.type === 'billboard') {
                this.openBillboardModal();
            }
        } else {
            this.triggerBuildingAction(obj);
        }
    }

    restOnBench(bench) {
        this.charPosX = bench.x + bench.width / 2;
        this.isResting = true;
        this.playerChar?.classList.add('resting');
        this.renderCharacterFrame();

        // Spawn floating recovery sparkles
        this.spawnHealEffect();

        // Show Toast Notification
        this.showToast(`☕ [휴식 완료] ${bench.name}에 앉아 피로를 풀고 체력과 기력을 100% 완충했습니다! ✨`);
    }

    spawnHealEffect() {
        const sparkle = document.createElement('div');
        sparkle.className = 'town-heal-sparkle';
        sparkle.innerHTML = '<span>✨ 💚 체력 & 기력 100% 회복! ✨</span>';
        sparkle.style.left = `${this.charPosX - 70}px`;
        this.worldTrack?.appendChild(sparkle);
        setTimeout(() => {
            sparkle.remove();
        }, 2200);
    }

    openBillboardModal() {
        this.billboardModal?.classList.remove('hidden');
    }

    closeBillboardModal() {
        this.billboardModal?.classList.add('hidden');
    }

    showToast(message) {
        const existing = document.getElementById('townFloatingToast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'townFloatingToast';
        toast.className = 'town-floating-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }

    triggerBuildingAction(building) {
        if (building.id === 'home_office_tower') {
            if (this.callbacks.onReturnOffice) {
                this.callbacks.onReturnOffice();
            }
        } else if (building.id === 'bit_logistics') {
            if (this.callbacks.onOpenLogistics) {
                this.callbacks.onOpenLogistics();
            }
        } else if (building.id === 'vivian_store') {
            if (this.callbacks.onOpenStore) {
                this.callbacks.onOpenStore();
            }
        } else if (building.id === 'julian_furniture') {
            if (this.callbacks.onOpenFurniture) {
                this.callbacks.onOpenFurniture();
            }
        } else if (building.id === 'claire_apparel') {
            if (this.callbacks.onOpenApparel) {
                this.callbacks.onOpenApparel();
            }
        } else if (building.id === 'data_ink_bookstore') {
            if (this.callbacks.onOpenBookstore) {
                this.callbacks.onOpenBookstore();
            }
        } else if (building.id === 'cipher_securities') {
            if (this.callbacks.onOpenSecurities) {
                this.callbacks.onOpenSecurities();
            }
        } else if (building.id === 'node_finance') {
            if (this.callbacks.onOpenBank) {
                this.callbacks.onOpenBank();
            }
        } else if (building.id === 'midnight_pub') {
            if (this.callbacks.onOpenPub) {
                this.callbacks.onOpenPub();
            }
        } else if (building.id === 'the_barter') {
            if (this.callbacks.onOpenBarter) {
                this.callbacks.onOpenBarter();
            }
        }
    }

    show(channel = { name: '타운 2', ping: 14 }) {
        if (!this.townContainer) return;
        this.activeChannel = channel.name || '타운 2';
        if (this.activeChannelText) {
            this.activeChannelText.textContent = `채널: ${this.activeChannel} (원활 • ${channel.ping || 14}ms)`;
        }
        this.townContainer.classList.remove('hidden');
        document.body.classList.add('town-mode-active');
        this.setCameraX(this.cameraX);
    }

    hide() {
        if (!this.townContainer) return;
        this.townContainer.classList.add('hidden');
        document.body.classList.remove('town-mode-active');
    }

    updateUserProfile(profile) {
        if (!profile) return;
        if (this.playerNametag) {
            this.playerNametag.textContent = profile.nickname || '사이퍼 트레이더';
        }
    }
}
