/**
 * StockWars Web Demo - Stock Dataset & Initial State
 * Extracted from StockWars C# MarketManager & GDD Specification
 * Contains all 72 GDD Stocks (9 Stocks x 8 Sectors)
 */

export const SECTORS = {
    IT: { name: 'IT/기술', color: '#00e5ff', bg: 'rgba(0, 229, 255, 0.15)', icon: '💻' },
    Entertainment: { name: '엔터/미디어', color: '#ff4081', bg: 'rgba(255, 64, 129, 0.15)', icon: '🎬' },
    Infrastructure: { name: '인프라/통신', color: '#e0a96d', bg: 'rgba(224, 169, 109, 0.15)', icon: '🏗️' },
    Bio: { name: '바이오/제약', color: '#00e676', bg: 'rgba(0, 230, 118, 0.15)', icon: '🧬' },
    Aerospace: { name: '우주/항공', color: '#b388ff', bg: 'rgba(179, 136, 255, 0.15)', icon: '🚀' },
    Retail: { name: '유통/소비재', color: '#1de9b6', bg: 'rgba(29, 233, 182, 0.15)', icon: '🛍️' },
    Energy: { name: '에너지/친환경', color: '#ffd600', bg: 'rgba(255, 214, 0, 0.15)', icon: '⚡' },
    Finance: { name: '금융/핀테크', color: '#ff9100', bg: 'rgba(255, 145, 0, 0.15)', icon: '💳' }
};

export const INITIAL_STOCKS = [
    // 1. IT Sector (9 Stocks)
    { id: 'CLOUDBERRY', name: '클라우드 베리', sector: 'IT', price: 850, prevPrice: 850, risk: 'Low', desc: '암호화된 분산 서버 공급 업체. 시장 독점 우량주.', richDesc: '도심 스마트 인프라 및 정부 부처에 암호화 분산 데이터 센터를 공급하는 독점 기업입니다.', tier: 'C', dividend: 0.03, per: 14.2, pbr: 1.8, roe: 12.7, marketCap: '8,500만 Gold', totalSupply: '1,000,000 주', high52: 920, low52: 780 },
    { id: 'SYNAPSENET', name: '시냅스 망', sector: 'IT', price: 890, prevPrice: 875, risk: 'Low', desc: '도시 전역 신경 링크 통신 인프라 구축사.', richDesc: '초고속 가상 신경망 통신 인프라를 건설하는 대형 기간 주식입니다.', tier: 'C', dividend: 0.031, per: 15.8, pbr: 2.1, roe: 13.5, marketCap: '10,680만 Gold', totalSupply: '1,200,000 주', high52: 950, low52: 810 },
    { id: 'TECHDOME', name: '테크 돔', sector: 'IT', price: 910, prevPrice: 910, risk: 'Low', desc: '차세대 보안 운영체제 "Dome OS" 독점 공급사.', richDesc: '스마트 단말용 차세대 보안 OS 개발사로 라이선스 수수료를 수취합니다.', tier: 'C', dividend: 0.032, per: 16.4, pbr: 2.3, roe: 14.1, marketCap: '13,650만 Gold', totalSupply: '1,500,000 주', high52: 980, low52: 840 },
    { id: 'MOMOSOLUTION', name: '모모 솔루션', sector: 'IT', price: 320, prevPrice: 310, risk: 'Mid', desc: 'AI 자산 관리 비서 엔진 및 자동매매 개발사.', richDesc: 'AI 자산 관리 비서 MOMO 엔진을 개발하는 핀테크/IT 통합 기업입니다.', tier: 'B', dividend: 0.015, per: 22.5, pbr: 3.4, roe: 15.2, marketCap: '960만 Gold', totalSupply: '300,000 주', high52: 410, low52: 240 },
    { id: 'PATCHWORK', name: '패치워크', sector: 'IT', price: 110, prevPrice: 118, risk: 'High', desc: '사이버 보안 및 해킹 글리치 긴급 수리 벤처.', richDesc: '네트워크 위기 수리를 전담하는 사이버 보안 벤처 기업입니다.', tier: 'A', dividend: 0.002, per: 38.1, pbr: 4.8, roe: 8.9, marketCap: '110만 Gold', totalSupply: '100,000 주', high52: 180, low52: 85 },
    { id: 'CYPHERLINK', name: '사이퍼 링크', sector: 'IT', price: 620, prevPrice: 610, risk: 'Mid', desc: '암호화 블록체인 노드 보안 검증 기술사.', richDesc: '분산 암호 노드 보안 검증 알고리즘 특허를 다수 보유한 IT 전문주입니다.', tier: 'B', dividend: 0.018, per: 20.1, pbr: 2.7, roe: 12.4, marketCap: '3,100만 Gold', totalSupply: '500,000 주', high52: 740, low52: 520 },
    { id: 'BYTECORE', name: '바이트 코어', sector: 'IT', price: 450, prevPrice: 440, risk: 'Mid', desc: '초고속 데이터 압축 및 캐싱 가속 모듈 제조.', richDesc: '서버 가속용 데이터 압축 반도체 칩을 제조하는 IT 성장주입니다.', tier: 'B', dividend: 0.016, per: 19.4, pbr: 2.6, roe: 11.9, marketCap: '2,250만 Gold', totalSupply: '500,000 주', high52: 540, low52: 360 },
    { id: 'DATAFORT', name: '데이터 포트', sector: 'IT', price: 780, prevPrice: 770, risk: 'Low', desc: '금융 기관 전용 클라우드 데이터 요새 공급사.', richDesc: '대 금융권 통합 데이터 뱅크 보안 요새 시스템 구축 독점 기업입니다.', tier: 'C', dividend: 0.029, per: 15.2, pbr: 2.0, roe: 13.8, marketCap: '6,240만 Gold', totalSupply: '800,000 주', high52: 860, low52: 700 },
    { id: 'NEXUSSOFT', name: '넥서스 소프트', sector: 'IT', price: 280, prevPrice: 270, risk: 'High', desc: '자율주행 소프트웨어 및 랭기지 모델 벤처.', richDesc: '자율주행 비전 AI 랭기지 엔진을 공급하는 고위험 벤처기업입니다.', tier: 'A', dividend: 0.005, per: 31.0, pbr: 4.1, roe: 9.4, marketCap: '840만 Gold', totalSupply: '300,000 주', high52: 370, low52: 190 },

    // 2. Entertainment Sector (9 Stocks)
    { id: 'STARDUST', name: '스타더스트', sector: 'Entertainment', price: 780, prevPrice: 760, risk: 'Low', desc: '글로벌 가상 아이돌 및 IP 매니지먼트사.', richDesc: '버추얼 가상 아이돌 콘서트 IP를 독점 소유한 엔터 공룡 기업입니다.', tier: 'C', dividend: 0.028, per: 18.3, pbr: 2.5, roe: 14.8, marketCap: '7,800만 Gold', totalSupply: '1,000,000 주', high52: 860, low52: 690 },
    { id: 'STUDIOLUNA', name: '스튜디오 루나', sector: 'Entertainment', price: 290, prevPrice: 298, risk: 'Mid', desc: '흥행작 전문 인디 게임 및 애니메이션 제작사.', richDesc: '레트로 인디 게임 및 글로벌 서브컬처 IP 제작사입니다.', tier: 'B', dividend: 0.012, per: 24.1, pbr: 3.1, roe: 13.0, marketCap: '870만 Gold', totalSupply: '300,000 주', high52: 380, low52: 210 },
    { id: 'NEXTONE', name: '넥스트원', sector: 'Entertainment', price: 510, prevPrice: 500, risk: 'Mid', desc: '버추얼 아티스트 및 메타버스 미디어 플랫폼.', richDesc: '가상 아티스트 전용 글로벌 스트리밍 플랫폼을 운영합니다.', tier: 'B', dividend: 0.014, per: 22.8, pbr: 3.0, roe: 12.1, marketCap: '2,550만 Gold', totalSupply: '500,000 주', high52: 620, low52: 410 },
    { id: 'ROYALMEDIA', name: '로열 미디어', sector: 'Entertainment', price: 840, prevPrice: 830, risk: 'Low', desc: '글로벌 방송 채널 및 블록버스터 드라마 배급사.', richDesc: '글로벌 OTT 플랫폼 1위 진입 오리지널 드라마 배급사입니다.', tier: 'C', dividend: 0.033, per: 15.4, pbr: 1.9, roe: 14.2, marketCap: '8,400만 Gold', totalSupply: '1,000,000 주', high52: 920, low52: 760 },
    { id: 'CINEMAHOLIC', name: '시네마 홀릭', sector: 'Entertainment', price: 360, prevPrice: 350, risk: 'Mid', desc: '멀티플렉스 체인 및 영화 투자 배급사.', richDesc: '전국 영화관 멀티플렉스 체인 및 텐트폴 영화 배급사입니다.', tier: 'B', dividend: 0.015, per: 19.8, pbr: 2.4, roe: 11.5, marketCap: '1,800만 Gold', totalSupply: '500,000 주', high52: 450, low52: 280 },
    { id: 'POPCORE', name: '팝 코어', sector: 'Entertainment', price: 420, prevPrice: 410, risk: 'Mid', desc: 'K-POP 음원 및 글로벌 팬덤 커뮤니티 개발사.', richDesc: '글로벌 팬 소통 앱 및 음원 라이선스 징수 기업입니다.', tier: 'B', dividend: 0.017, per: 21.0, pbr: 2.8, roe: 13.2, marketCap: '2,100만 Gold', totalSupply: '500,000 주', high52: 520, low52: 330 },
    { id: 'VISUALART', name: '비주얼 아트', sector: 'Entertainment', price: 670, prevPrice: 660, risk: 'Low', desc: '3D VFX 시각효과 및 그래픽 엔진 전문사.', richDesc: '영화 및 AAA급 게임 시각 효과(VFX) 스튜디오 대표주입니다.', tier: 'C', dividend: 0.026, per: 17.5, pbr: 2.2, roe: 12.9, marketCap: '5,360만 Gold', totalSupply: '800,000 주', high52: 750, low52: 590 },
    { id: 'DARKHORSE', name: '다크 호스', sector: 'Entertainment', price: 230, prevPrice: 220, risk: 'High', desc: '스팀 메가 히트 인디 게임 전용 배급사.', richDesc: '스팀 글로벌 1위 인디 게임을 배급한 핫한 엔터 테마주입니다.', tier: 'A', dividend: 0.004, per: 33.2, pbr: 4.5, roe: 8.7, marketCap: '690만 Gold', totalSupply: '300,000 주', high52: 320, low52: 150 },
    { id: 'SOCIALMIX', name: '소셜 믹스', sector: 'Entertainment', price: 160, prevPrice: 150, risk: 'High', desc: '숏폼 트렌딩 미디어 소셜 네트워크.', richDesc: 'MZ세대를 겨냥한 숏폼 미디어 바이럴 네트워크 플랫폼입니다.', tier: 'S', dividend: 0.002, per: 45.2, pbr: 5.2, roe: 6.4, marketCap: '288만 Gold', totalSupply: '180,000 주', high52: 290, low52: 95 },

    // 3. Infrastructure Sector (9 Stocks)
    { id: 'SCONNECT', name: 'S-커넥트', sector: 'Infrastructure', price: 740, prevPrice: 740, risk: 'Low', desc: '도심 초고속 광케이블 망 독점 구축사.', richDesc: '도심 전역 지하 초고속 케이블망을 관리하는 국가 기간 기업입니다.', tier: 'C', dividend: 0.038, per: 12.4, pbr: 1.5, roe: 12.1, marketCap: '7,400만 Gold', totalSupply: '1,000,000 주', high52: 810, low52: 690 },
    { id: 'WAVECOMM', name: '웨이브 통신', sector: 'Infrastructure', price: 420, prevPrice: 410, risk: 'Mid', desc: '위성-지상 파동 통신망 전용 단말 벤처.', richDesc: '위성 및 기지국 하이브리드 파동 신호 변환 모듈 제조사입니다.', tier: 'B', dividend: 0.021, per: 19.5, pbr: 2.4, roe: 11.8, marketCap: '2,100만 Gold', totalSupply: '500,000 주', high52: 520, low52: 360 },
    { id: 'AIRLINK', name: '에어 링크', sector: 'Infrastructure', price: 680, prevPrice: 670, risk: 'Low', desc: '도심 무선 데이터 전송 기지국 인프라사.', richDesc: '도심 전역 5G/6G 무선 기지국 타워 및 망 관리를 전담합니다.', tier: 'C', dividend: 0.035, per: 14.1, pbr: 1.8, roe: 13.0, marketCap: '5,440만 Gold', totalSupply: '800,000 주', high52: 760, low52: 600 },
    { id: 'HYPERLOOP', name: '하이퍼 루프', sector: 'Infrastructure', price: 310, prevPrice: 300, risk: 'High', desc: '초고속 자기부상 지하 수송 허브 건설사.', richDesc: '도시 간 자기부상 진공 수송 허브를 건설하는 미래 인프라 벤처입니다.', tier: 'A', dividend: 0.008, per: 28.4, pbr: 3.8, roe: 9.1, marketCap: '930만 Gold', totalSupply: '300,000 주', high52: 420, low52: 220 },
    { id: 'CITYGRID', name: '시티 그리드', sector: 'Infrastructure', price: 890, prevPrice: 880, risk: 'Low', desc: '도심 지능형 스마트 교통 제어 전력망 운영.', richDesc: '스마트 시티 신호 및 지능형 신호망을 제어하는 인프라 대장주입니다.', tier: 'C', dividend: 0.041, per: 11.9, pbr: 1.4, roe: 14.5, marketCap: '8,900만 Gold', totalSupply: '1,000,000 주', high52: 970, low52: 810 },
    { id: 'NEXUSBRIDGE', name: '넥서스 브릿지', sector: 'Infrastructure', price: 530, prevPrice: 520, risk: 'Mid', desc: '국가 대도시 간 해저 광케이블 연계 사업자.', richDesc: '해저 초고속 케이블 매설 및 국제 데이터 허브망을 관리합니다.', tier: 'B', dividend: 0.025, per: 17.8, pbr: 2.1, roe: 12.3, marketCap: '3,180만 Gold', totalSupply: '600,000 주', high52: 630, low52: 440 },
    { id: 'METROHUB', name: '메트로 허브', sector: 'Infrastructure', price: 620, prevPrice: 610, risk: 'Low', desc: '도심 복합 환승 센터 및 임대 시설 관리사.', richDesc: '지하 상업 시설 및 환승 터미널 타워 수입 우량 인프라주입니다.', tier: 'C', dividend: 0.032, per: 15.0, pbr: 1.9, roe: 12.8, marketCap: '4,960만 Gold', totalSupply: '800,000 주', high52: 700, low52: 550 },
    { id: 'SKYNET', name: '스카이넷', sector: 'Infrastructure', price: 240, prevPrice: 230, risk: 'High', desc: '저궤도 군집 통신 위성망 이용 테마주.', richDesc: '글로벌 커버리지 군집 위성망을 이용하는 위성 인프라 벤처입니다.', tier: 'A', dividend: 0.003, per: 36.1, pbr: 4.9, roe: 7.8, marketCap: '720만 Gold', totalSupply: '300,000 주', high52: 330, low52: 170 },
    { id: 'COREPIPE', name: '코어 파이프', sector: 'Infrastructure', price: 460, prevPrice: 450, risk: 'Mid', desc: '도심 광역 지하 수열 메인 배관 제공자.', richDesc: '도시 난방 및 냉각 수열 에너지 배관망을 제공 관리합니다.', tier: 'B', dividend: 0.022, per: 18.2, pbr: 2.2, roe: 11.7, marketCap: '2,300만 Gold', totalSupply: '500,000 주', high52: 540, low52: 380 },

    // 4. Bio Sector (9 Stocks)
    { id: 'FORESTLAB', name: '포레스트 랩', sector: 'Bio', price: 650, prevPrice: 650, risk: 'Low', desc: '천연물질 가공 바이오 헬스케어 대형주.', richDesc: '천연물 가공 바이오 헬스케어 및 시약 보급 대형 제약사입니다.', tier: 'C', dividend: 0.025, per: 13.9, pbr: 1.6, roe: 11.5, marketCap: '5,200만 Gold', totalSupply: '800,000 주', high52: 720, low52: 590 },
    { id: 'LIFECURE', name: '라이프 케어', sector: 'Bio', price: 120, prevPrice: 115, risk: 'High', desc: '희귀병 표적 항암제 임상 3상 급등주.', richDesc: '임상 3상을 앞둔 초고위험 표적 바이오 신약 벤처주입니다.', tier: 'A', dividend: 0.0, per: 98.0, pbr: 8.4, roe: -4.2, marketCap: '120만 Gold', totalSupply: '100,000 주', high52: 240, low52: 70 },
    { id: 'BIONICS', name: '바이오닉스', sector: 'Bio', price: 540, prevPrice: 530, risk: 'High', desc: '3세대 인공 신경 이식 및 생체 칩 개발사.', richDesc: '3세대 인공 신경 및 생체 이식 칩 개발 대표 바이오 벤처입니다.', tier: 'A', dividend: 0.0, per: 64.2, pbr: 5.8, roe: 7.2, marketCap: '2,700만 Gold', totalSupply: '500,000 주', high52: 680, low52: 410 },
    { id: 'NEURONBIO', name: '뉴런 바이오', sector: 'Bio', price: 430, prevPrice: 420, risk: 'Mid', desc: '뇌신경 전달 물질 제어 치매 치료제 신약.', richDesc: '퇴행성 뇌질환 수용체 치료제 신약 개발을 주력으로 합니다.', tier: 'B', dividend: 0.008, per: 35.0, pbr: 4.2, roe: 8.5, marketCap: '1,720만 Gold', totalSupply: '400,000 주', high52: 530, low52: 340 },
    { id: 'GENEFORCE', name: '진 포스', sector: 'Bio', price: 710, prevPrice: 700, risk: 'Low', desc: '유전자 교정 및 맞춤형 신약 진단 키트 제조.', richDesc: '유전자 가위 기술 및 암 맞춤 진단 키트를 공급합니다.', tier: 'C', dividend: 0.028, per: 16.2, pbr: 2.0, roe: 13.1, marketCap: '5,680만 Gold', totalSupply: '800,000 주', high52: 790, low52: 630 },
    { id: 'CELLHEALTH', name: '셀 포스', sector: 'Bio', price: 320, prevPrice: 310, risk: 'Mid', desc: '줄기세포 배양 기반 장기 재생 치료제사.', richDesc: '줄기세포 배양액 및 세포 재생 배양액 개발사입니다.', tier: 'B', dividend: 0.012, per: 26.5, pbr: 3.3, roe: 10.4, marketCap: '1,280만 Gold', totalSupply: '400,000 주', high52: 410, low52: 240 },
    { id: 'VITALMED', name: '바이오 메드', sector: 'Bio', price: 860, prevPrice: 850, risk: 'Low', desc: '수술용 자동 로봇 및 첨단 의료기기 우량주.', richDesc: '수술용 정밀 정형외과 로봇 및 수술대 독점 공급사입니다.', tier: 'C', dividend: 0.034, per: 14.8, pbr: 1.8, roe: 14.0, marketCap: '8,600만 Gold', totalSupply: '1,000,000 주', high52: 940, low52: 780 },
    { id: 'PHARMAX', name: '파맥스', sector: 'Bio', price: 210, prevPrice: 200, risk: 'High', desc: '심혈관 질환 치료제 바이오 시밀러 전문주.', richDesc: '특허 만료 신약 복제 복제약 바이오 시밀러 제조사입니다.', tier: 'A', dividend: 0.002, per: 42.0, pbr: 5.1, roe: 6.9, marketCap: '630만 Gold', totalSupply: '300,000 주', high52: 290, low52: 140 },
    { id: 'ORGANICLAB', name: '오가닉 랩', sector: 'Bio', price: 490, prevPrice: 480, risk: 'Mid', desc: '유기농 생물 추출 면역 증진 건강 식품사.', richDesc: '천연 면역 강화 추출물 및 원료 시약을 제조합니다.', tier: 'B', dividend: 0.020, per: 19.1, pbr: 2.3, roe: 11.8, marketCap: '2,450만 Gold', totalSupply: '500,000 주', high52: 580, low52: 400 },

    // 5. Aerospace Sector (9 Stocks)
    { id: 'AURORAAERO', name: '오로라 에어로', sector: 'Aerospace', price: 160, prevPrice: 152, risk: 'High', desc: '민간 우주 호텔 1호기 발사 추진 테마주.', richDesc: '민간 우주 호텔 1호기 테스트 발사를 추진하는 우주 테마주입니다.', tier: 'A', dividend: 0.0, per: 55.4, pbr: 6.1, roe: 5.1, marketCap: '240만 Gold', totalSupply: '150,000 주', high52: 310, low52: 110 },
    { id: 'WINGSLOGIS', name: '윙스 로지스', sector: 'Aerospace', price: 680, prevPrice: 670, risk: 'Mid', desc: '도심 에어 택시(UAV) 및 드론 화물 수송 선두.', richDesc: '도심 무인 항공 화물 및 에어 택시 관련 인프라사입니다.', tier: 'B', dividend: 0.022, per: 21.4, pbr: 2.9, roe: 12.5, marketCap: '4,080만 Gold', totalSupply: '600,000 주', high52: 780, low52: 580 },
    { id: 'ORBITALTECH', name: '오비탈 테크', sector: 'Aerospace', price: 820, prevPrice: 810, risk: 'Low', desc: '초고고도 인공위성 프레임 및 추진체 제조.', richDesc: '위성용 티타늄 프레임 및 이온 추진체를 생산합니다.', tier: 'C', dividend: 0.031, per: 15.6, pbr: 2.0, roe: 13.7, marketCap: '6,560만 Gold', totalSupply: '800,000 주', high52: 900, low52: 740 },
    { id: 'COSMOSX', name: '코스모스 X', sector: 'Aerospace', price: 470, prevPrice: 460, risk: 'Mid', desc: '우주 자원 탐사 및 광물 채굴 로봇 벤처.', richDesc: '소행성 자원 탐사 로버 및 샘플 채취 로봇 기술사입니다.', tier: 'B', dividend: 0.010, per: 29.0, pbr: 3.7, roe: 9.8, marketCap: '1,880만 Gold', totalSupply: '400,000 주', high52: 580, low52: 380 },
    { id: 'SKYLINE', name: '스카이 라인', sector: 'Aerospace', price: 590, prevPrice: 580, risk: 'Mid', desc: '초음속 여객기 엔진 기술 및 부품 장치사.', richDesc: '마하 3급 도시간 이동 초음속 엔진 개발사입니다.', tier: 'B', dividend: 0.019, per: 20.3, pbr: 2.6, roe: 12.0, marketCap: '2,950만 Gold', totalSupply: '500,000 주', high52: 690, low52: 490 },
    { id: 'AEROCORE', name: '에어로 코어', sector: 'Aerospace', price: 730, prevPrice: 720, risk: 'Low', desc: '항공 우주 방산 소재 및 내열 합금 제련.', richDesc: '발사체 재돌입용 탄소 복합재 및 특수 합금 생산업체입니다.', tier: 'C', dividend: 0.033, per: 14.2, pbr: 1.7, roe: 13.9, marketCap: '5,840만 Gold', totalSupply: '800,000 주', high52: 820, low52: 650 },
    { id: 'STARJET', name: '스타 제트', sector: 'Aerospace', price: 340, prevPrice: 330, risk: 'High', desc: '소형 로켓 전용 3D 프린팅 엔진 제조사.', richDesc: '3D 프린팅 일체형 연소 로켓 엔진 제조업체입니다.', tier: 'A', dividend: 0.003, per: 37.5, pbr: 4.9, roe: 7.9, marketCap: '1,020만 Gold', totalSupply: '300,000 주', high52: 430, low52: 250 },
    { id: 'GRAVITY', name: '그래비티', sector: 'Aerospace', price: 260, prevPrice: 250, risk: 'High', desc: '무중력 실험용 우주 모듈 렌탈 벤처.', richDesc: '제약/소재 연구용 단기 무중력 캡슐 서비스 기업입니다.', tier: 'A', dividend: 0.002, per: 41.2, pbr: 5.3, roe: 6.8, marketCap: '780만 Gold', totalSupply: '300,000 주', high52: 350, low52: 180 },
    { id: 'LUNARBASE', name: '루나 베이스', sector: 'Aerospace', price: 910, prevPrice: 900, risk: 'Low', desc: '달 탐사 건설 인프라 국책 컨소시엄 대형.', richDesc: '달 정주 기지 차세대 건설 인프라 총괄 주식입니다.', tier: 'C', dividend: 0.038, per: 13.0, pbr: 1.5, roe: 14.8, marketCap: '9,100만 Gold', totalSupply: '1,000,000 주', high52: 990, low52: 830 },

    // 6. Retail Sector (9 Stocks)
    { id: 'MORNINGBREW', name: '모닝 브루', sector: 'Retail', price: 380, prevPrice: 380, risk: 'Low', desc: '24시간 자율 카페 로봇 프랜차이즈 1위.', richDesc: '전국 1,500개 무인 커피 카페 로봇 프랜차이즈 기업입니다.', tier: 'B', dividend: 0.024, per: 16.8, pbr: 2.0, roe: 13.4, marketCap: '1,900만 Gold', totalSupply: '500,000 주', high52: 440, low52: 320 },
    { id: 'SWEETBAKERY', name: '스윗 베이커리', sector: 'Retail', price: 210, prevPrice: 205, risk: 'Mid', desc: '스마트 구독형 수제 베이커리 체인.', richDesc: '직장인 아침 구독형 수제 디저트 베이커리 체인입니다.', tier: 'B', dividend: 0.018, per: 21.3, pbr: 2.8, roe: 10.9, marketCap: '840만 Gold', totalSupply: '400,000 주', high52: 280, low52: 170 },
    { id: 'ORGANICTABLE', name: '오가닉 테이블', sector: 'Retail', price: 520, prevPrice: 510, risk: 'Low', desc: '친환경 무농약 유기농 신선 식품 유통사.', richDesc: '유기농 농산물 직거래 새벽 정기 배송 플랫폼입니다.', tier: 'C', dividend: 0.030, per: 15.1, pbr: 1.9, roe: 13.2, marketCap: '3,120만 Gold', totalSupply: '600,000 주', high52: 610, low52: 430 },
    { id: 'QUICKDELIVERY', name: '퀵 드리버리', sector: 'Retail', price: 640, prevPrice: 630, risk: 'Mid', desc: '30분 바로 배송 도심형 물류 체인.', richDesc: '마이크로 풀필먼트 센터 기반 Quick 커머스 대표주입니다.', tier: 'B', dividend: 0.021, per: 19.0, pbr: 2.5, roe: 12.7, marketCap: '4,480만 Gold', totalSupply: '700,000 주', high52: 730, low52: 550 },
    { id: 'FRESHMARKET', name: '프레시 마켓', sector: 'Retail', price: 750, prevPrice: 740, risk: 'Low', desc: '전국 마트 네트워크 및 새벽 배송 인프라.', richDesc: '전국 온오프라인 병행 신선 식품 하이퍼마켓 주식입니다.', tier: 'C', dividend: 0.036, per: 13.5, pbr: 1.6, roe: 14.1, marketCap: '6,000만 Gold', totalSupply: '800,000 주', high52: 830, low52: 670 },
    { id: 'CITYMART', name: '시티 마트', sector: 'Retail', price: 880, prevPrice: 870, risk: 'Low', desc: '초대형 스마트 하이퍼마켓 대표 주식.', richDesc: '전국 최대 매장 면적과 물류망을 보유한 유통 우량주입니다.', tier: 'C', dividend: 0.040, per: 12.1, pbr: 1.4, roe: 15.0, marketCap: '8,800만 Gold', totalSupply: '1,000,000 주', high52: 960, low52: 800 },
    { id: 'BOXHUB', name: '박스 허브', sector: 'Retail', price: 430, prevPrice: 420, risk: 'Mid', desc: '무인 도심형 자율 보관 상자 물류 네트워크.', richDesc: '아파트 및 빌딩 보관용 무인 자동화 네트워크입니다.', tier: 'B', dividend: 0.019, per: 22.0, pbr: 2.7, roe: 11.8, marketCap: '2,150만 Gold', totalSupply: '500,000 주', high52: 510, low52: 350 },
    { id: 'LIFESTYLE', name: '라이프 스타일', sector: 'Retail', price: 310, prevPrice: 300, risk: 'Mid', desc: '감성 리빙 및 가구 굿즈 인테리어 유통.', richDesc: '모던 홈 가구 및 인테리어 라이프스타일 브랜드 유통사입니다.', tier: 'B', dividend: 0.014, per: 24.5, pbr: 3.1, roe: 10.6, marketCap: '1,240만 Gold', totalSupply: '400,000 주', high52: 390, low52: 230 },
    { id: 'STOREMASTER', name: '스토어 마스터', sector: 'Retail', price: 190, prevPrice: 180, risk: 'High', desc: '소상공인 재고 분석 솔루션 핀테크 유통.', richDesc: '소상공인 맞춤 POS 및 발주 자동화 소프트웨어사입니다.', tier: 'A', dividend: 0.003, per: 39.0, pbr: 4.8, roe: 7.5, marketCap: '570만 Gold', totalSupply: '300,000 주', high52: 270, low52: 120 },

    // 7. Energy Sector (9 Stocks)
    { id: 'ECOBATTERY', name: '에코 배터리', sector: 'Energy', price: 210, prevPrice: 220, risk: 'High', desc: '차세대 주력 전고체 전해질 배터리 소재.', richDesc: '전기 항공기 및 자율주행 차세대 전고체 전해질 소재사입니다.', tier: 'A', dividend: 0.003, per: 32.1, pbr: 4.2, roe: 9.8, marketCap: '420만 Gold', totalSupply: '200,000 주', high52: 340, low52: 160 },
    { id: 'WINDHILL', name: '윈드 힐', sector: 'Energy', price: 460, prevPrice: 450, risk: 'Low', desc: '해상 풍력 발전 터빈 및 재생 에너지 생산.', richDesc: '해안 3개 해상 풍력 단지 전력을 도심망에 공급합니다.', tier: 'C', dividend: 0.034, per: 14.5, pbr: 1.7, roe: 11.2, marketCap: '3,680만 Gold', totalSupply: '800,000 주', high52: 530, low52: 400 },
    { id: 'SUNLIGHT', name: '선 라이트', sector: 'Energy', price: 630, prevPrice: 620, risk: 'Low', desc: '초고효율 페로브스카이트 태양광 셀.', richDesc: '차세대 텐덤 태양광 패널 양산독점 기술 기업입니다.', tier: 'C', dividend: 0.031, per: 15.8, pbr: 2.0, roe: 13.4, marketCap: '5,040만 Gold', totalSupply: '800,000 주', high52: 720, low52: 550 },
    { id: 'HYDROGENX', name: '하이드로젠 X', sector: 'Energy', price: 370, prevPrice: 360, risk: 'Mid', desc: '청정 수소 연료 전지 및 충전소 인프라.', richDesc: '액화 수소 저장 탱크 및 연료 전지 스택 제조업체입니다.', tier: 'B', dividend: 0.015, per: 23.4, pbr: 3.2, roe: 10.8, marketCap: '1,850만 Gold', totalSupply: '500,000 주', high52: 470, low52: 290 },
    { id: 'GREENPOWER', name: '그린 파워', sector: 'Energy', price: 790, prevPrice: 780, risk: 'Low', desc: '전역 친환경 그리드 전력망 통합 관리자.', richDesc: '스마트 전력 저장 시스템(ESS) 구축 및 송전 우량주입니다.', tier: 'C', dividend: 0.039, per: 12.8, pbr: 1.5, roe: 14.3, marketCap: '7,900만 Gold', totalSupply: '1,000,000 주', high52: 870, low52: 710 },
    { id: 'NUCLEARPLUS', name: '뉴클리어 플러스', sector: 'Energy', price: 850, prevPrice: 840, risk: 'Low', desc: '소형 모듈 원자로(SMR) 기술 구축 및 제어.', richDesc: '차세대 SMR 격리 용기 및 자동 제어 시스템 공급사입니다.', tier: 'C', dividend: 0.037, per: 13.4, pbr: 1.6, roe: 14.6, marketCap: '8,500만 Gold', totalSupply: '1,000,000 주', high52: 930, low52: 770 },
    { id: 'SOLARGRID', name: '솔라 그리드', sector: 'Energy', price: 510, prevPrice: 500, risk: 'Mid', desc: '빌딩 일체형 태양광(BIPV) 창호 발전 시스템.', richDesc: '건물 외벽 유리형 스마트 창호 발전 시스템사입니다.', tier: 'B', dividend: 0.022, per: 18.5, pbr: 2.4, roe: 12.1, marketCap: '2,550만 Gold', totalSupply: '500,000 주', high52: 600, low52: 420 },
    { id: 'THERMOCORE', name: '써모 코어', sector: 'Energy', price: 280, prevPrice: 270, risk: 'High', desc: '지열 및 해해 수열 발전 부품 특허주.', richDesc: '고온 지열 발전 터빈용 이중 열교환기 벤처입니다.', tier: 'A', dividend: 0.006, per: 32.8, pbr: 4.2, roe: 8.4, marketCap: '840만 Gold', totalSupply: '300,000 주', high52: 360, low52: 190 },
    { id: 'CLEANENERGY', name: '클린 에너지', sector: 'Energy', price: 420, prevPrice: 410, risk: 'Mid', desc: '폐기물 에너지화 및 탄소 포집 기술사.', richDesc: '도심 탄소 포집(CCUS) 플랜트 제공 대표 기술주입니다.', tier: 'B', dividend: 0.018, per: 20.2, pbr: 2.5, roe: 11.9, marketCap: '2,100만 Gold', totalSupply: '500,000 주', high52: 510, low52: 330 },

    // 8. Finance Sector (9 Stocks)
    { id: 'COZYPAY', name: '코지 페이', sector: 'Finance', price: 900, prevPrice: 890, risk: 'Low', desc: '전 국민 점유 1위 간편 결제 페이 기반 핀테크.', richDesc: '대표 간편 결제 1위 플랫폼으로 막대한 수수료 수입을 얻습니다.', tier: 'C', dividend: 0.035, per: 15.1, pbr: 1.9, roe: 15.6, marketCap: '10,800만 Gold', totalSupply: '1,200,000 주', high52: 960, low52: 830 },
    { id: 'MINTASSET', name: '민트 자산운용', sector: 'Finance', price: 820, prevPrice: 810, risk: 'Low', desc: '사이버 시티 최대 규모 알고리즘 자산 운용사.', richDesc: 'AI 대표 투자를 전담하는 초대형 금융 기관 대표주입니다.', tier: 'C', dividend: 0.042, per: 11.8, pbr: 1.4, roe: 16.5, marketCap: '8,200만 Gold', totalSupply: '1,000,000 주', high52: 890, low52: 750 },
    { id: 'GOLDPOCKET', name: '골드 포켓', sector: 'Finance', price: 610, prevPrice: 600, risk: 'Mid', desc: '소상공인 펀딩 및 초단기 저금리 대출 금융.', richDesc: '자영업자 및 소상공인 매출 연계 신용 대출 금융사입니다.', tier: 'B', dividend: 0.026, per: 16.5, pbr: 2.0, roe: 13.8, marketCap: '3,660만 Gold', totalSupply: '600,000 주', high52: 700, low52: 520 },
    { id: 'SAFEBANK', name: '세이프 뱅크', sector: 'Finance', price: 950, prevPrice: 940, risk: 'Low', desc: '수신 수액 1위의 대형 상업 은행 대표 주식.', richDesc: '전국 1위 예수금 규모를 보유한 상업 은행 대장주입니다.', tier: 'C', dividend: 0.045, per: 10.5, pbr: 1.2, roe: 17.1, marketCap: '14,250만 Gold', totalSupply: '1,500,000 주', high52: 1020, low52: 880 },
    { id: 'CIPHERCAPITAL', name: '사이퍼 캐피탈', sector: 'Finance', price: 730, prevPrice: 720, risk: 'Low', desc: '첨단 벤처 투자 및 IB 기업 금융 거두 공룡.', richDesc: '테크 벤처 IPO 주간사 및 인수 합병 IB 투자 금융사입니다.', tier: 'C', dividend: 0.038, per: 13.2, pbr: 1.6, roe: 15.2, marketCap: '7,300만 Gold', totalSupply: '1,000,000 주', high52: 810, low52: 650 },
    { id: 'WEALTHMAN', name: '웰스 매니지먼트', sector: 'Finance', price: 540, prevPrice: 530, risk: 'Mid', desc: '고액 자산가 패밀리 오피스 종합 프라이빗 뱅킹.', richDesc: '자산가 전용 프라이빗 뱅킹 및 부동산 신탁 자문사입니다.', tier: 'B', dividend: 0.024, per: 18.0, pbr: 2.2, roe: 13.0, marketCap: '2,700만 Gold', totalSupply: '500,000 주', high52: 630, low52: 450 },
    { id: 'SMARTINVEST', name: '스마트 인베스트', sector: 'Finance', price: 460, prevPrice: 450, risk: 'Mid', desc: '로보어드바이저 자동 포트폴리오 리밸런싱.', richDesc: '스마트폰 전용 자동 자산 배분 알고리즘 투자사입니다.', tier: 'B', dividend: 0.020, per: 20.5, pbr: 2.6, roe: 12.4, marketCap: '2,300만 Gold', totalSupply: '500,000 주', high52: 550, low52: 380 },
    { id: 'TRUSTBANK', name: '트러스트 뱅크', sector: 'Finance', price: 880, prevPrice: 870, risk: 'Low', desc: '신탁 및 부동산 자산 담보 전용 금융 기관.', richDesc: '부동산 프로젝트 파이낸싱 및 담보 신탁 은행입니다.', tier: 'C', dividend: 0.041, per: 11.2, pbr: 1.3, roe: 16.0, marketCap: '8,800만 Gold', totalSupply: '1,000,000 주', high52: 960, low52: 800 },
    { id: 'PAYONE', name: '페이 원', sector: 'Finance', price: 310, prevPrice: 300, risk: 'High', desc: '글로벌 통화 송금 및 암호화 환전 핀테크.', richDesc: '수수료 제로 해외 실시간 통화 송금 핀테크 벤처입니다.', tier: 'A', dividend: 0.005, per: 32.0, pbr: 4.1, roe: 8.8, marketCap: '930만 Gold', totalSupply: '300,000 주', high52: 410, low52: 220 }
];

export const INITIAL_NEWS = [
    {
        id: 'NEWS_01',
        title: '클라우드 베리, 전역 차세대 데이터 센터 4기 증설 수주 공식 체결',
        sector: 'IT',
        stockId: 'CLOUDBERRY',
        time: '10분 전',
        content: '클라우드 베리가 스마트 시티 공공 데이터 센터 4기 공급 계약(총액 1,200만 Gold 규모)을 최종 체결했습니다.',
        source: '클라우드 베리 · 기업 공시',
        body: [
            '클라우드 베리는 스마트 시티 공공 데이터 센터 4기 공급 계약을 최종 체결했다고 공시했다. 계약 규모는 총 1,200만 Gold로, 공공 데이터 처리 시설을 늘리는 차세대 인프라 구축 사업이다.',
            '이번 계약은 스마트 시티 전역에서 발생하는 행정·공공 서비스 데이터를 처리할 시설을 확충하는 데 목적이 있다. 클라우드 베리는 계약에 따라 신규 데이터 센터 공급을 담당한다.',
            '계약 체결 금액 전체가 즉시 매출에 반영되는 것은 아니다. 사업 진행과 납품에 따라 실적에 반영되는 시점이 달라질 수 있다.',
            '센터별 공급 일정과 운영 개시 시점, 후속 유지·관리 계약 여부는 이번 발표에 포함되지 않았다. 추가 사업의 규모와 조건 역시 아직 공개되지 않았다.'
        ],
        impact: '+5.2%',
        isPositive: true,
        type: '공시',
        credibility: 'High (공식 공시 확인 완료)',
        analystComment: 'B2G 계약에 따른 안정적 실현 매출 확정. 주가 상방 압력 우세.'
    },
    {
        id: 'RUMOR_01',
        title: '[찌라시] 오로라 에어로, 민간 궤도 호텔 1호기 테스트 발사 성공 임박',
        sector: 'Aerospace',
        stockId: 'AURORAAERO',
        time: '32분 전',
        content: '익명의 우주항공 연구원 관계자에 따르면 오로라 에어로의 민간 우주 호텔 1호기 발사 무인 테스트가 성공적으로 마무리 단계에 진입했다고 합니다.',
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
        content: '희귀 금속 광산 파업 여파로 전고체 배터리 핵심 전해질 소재 공급망 차질이 가시화되었습니다.',
        source: '사이퍼 경제 · 산업부',
        body: [
            '희귀 금속 광산의 파업 여파가 배터리 소재 공급망으로 번지고 있다. 전고체 배터리를 생산하는 에코 배터리도 핵심 전해질 소재 수급에 차질을 겪으면서 3분기 실적에 대한 우려가 나오고 있다.',
            '전해질은 전고체 배터리 생산에 필요한 주요 소재다. 원료 공급이 지연되면 생산 일정을 조정하거나 대체 물량을 확보해야 할 수 있다. 대체 조달에 드는 비용도 향후 수익성을 좌우할 변수다.',
            '현재 공개된 내용만으로는 공급 차질이 실제 생산량에 얼마나 영향을 줄지 확인하기 어렵다. 보유 재고로 대응할 수 있는 기간과 다른 공급처를 통한 조달 가능성도 구체적으로 알려지지 않았다.',
            '3분기 실적 감소가 확정된 것은 아니다. 광산 파업의 지속 기간과 소재 공급 재개 시점, 회사의 후속 생산 안내가 이번 사태의 영향을 가늠할 주요 확인 사항으로 남아 있다.'
        ],
        impact: '-4.8%',
        isPositive: false,
        type: '뉴스',
        credibility: 'High (팩트 확인 완료)',
        analystComment: '공급망 해소 전까지 단기 조정을 피하기 어렵다.'
    },
    {
        id: 'RUMOR_02',
        title: '[찌라시] 코지 페이, 세이프 뱅크와의 메가 핀테크 지분 교환 타진',
        sector: 'Finance',
        stockId: 'COZYPAY',
        time: '2시간 전',
        content: '금융권 찌라시 채널에 따르면 코지 페이가 상업 은행 1위 세이프 뱅크와의 지분 교환을 통한 거대 핀테크 유니콘 연합체 출범을 논의 중입니다.',
        impact: '+8.1%',
        isPositive: true,
        type: '찌라시',
        credibility: 'Tier 1 Rumor (시장 주목도 최상)',
        analystComment: '합병 타진 성공 시 금융 섹터 지각 변동 예상.'
    },
    {
        id: 'NEWS_03',
        title: '스튜디오 루나, 차기 신작 힐링 RPG 사전예약 유저 500만 명 돌파',
        sector: 'Entertainment',
        stockId: 'STUDIOLUNA',
        time: '3시간 전',
        content: '인디 흥행 제작사 스튜디오 루나의 사전 예약 수가 500만 명을 돌파했습니다.',
        source: '사이퍼 경제 · 문화산업부',
        body: [
            '스튜디오 루나의 차기 힐링 RPG 사전예약 참여자가 500만 명을 넘어섰다. 인디 게임 흥행작을 선보였던 제작사의 후속 신작에 출시 전부터 이용자들의 관심이 모이고 있다.',
            '사전예약은 정식 서비스에 앞서 이용자의 참여 의사를 접수하는 절차다. 이번 수치는 신작에 대한 초기 관심을 보여주지만, 실제 접속자 수나 유료 이용자 수를 의미하지는 않는다.',
            '흥행이 실적으로 이어지는지는 출시 이후 확인될 전망이다. 정식 서비스의 안정성과 콘텐츠에 대한 반응, 이용자가 얼마나 오래 게임을 즐기는지가 장기 성과를 판단할 요소로 꼽힌다.',
            '이번 발표에는 사전예약 참여자의 지역별 구성이나 예상 매출이 포함되지 않았다. 스튜디오 루나의 신작 성과는 향후 출시 일정과 서비스 운영 소식을 통해 보다 구체적으로 드러날 것으로 보인다.'
        ],
        impact: '+6.5%',
        isPositive: true,
        type: '뉴스',
        credibility: 'High (사전예약 공시)',
        analystComment: '신작 기대감 반영으로 실적 개선세 가속화.'
    }
];
