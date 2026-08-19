using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 96개 주식 종목(72개 기본 상장 종목 + 24개 예비 IPO 대기 종목)의 런타임 인스턴스를 관리하고,
    /// 실시간 주가, 호가 유동 잔량, 정산용 데이터 및 세이브 파일과의 입출력을 바인딩하는 코어 주식 시장 매니저.
    /// </summary>
    public class MarketManager : Singleton<MarketManager>
    {
        // 96개 전종목의 런타임 상태를 들고 있는 마스터 딕셔너리
        private Dictionary<string, StockInstance> _stockInstances = new Dictionary<string, StockInstance>();

        /// <summary>
        /// 초기 로드 또는 에셋 분실 시 자동으로 96개 주식 종목을 메모리 상에 완전 동적 생성하기 위한 마스터 메타 정보
        /// </summary>
        private struct FallbackProfile
        {
            public string id;
            public string name;
            public string desc;
            public StockSector sector;
            public RiskLevel risk;
            public long supply;
            public long listPrice;
            public float dividend;
            public VolatilityTier tier;
            public bool isIpoCandidate;

            public FallbackProfile(string id, string name, string desc, StockSector sector, RiskLevel risk, long supply, long listPrice, float dividend, VolatilityTier tier, bool isIpoCandidate = false)
            {
                this.id = id;
                this.name = name;
                this.desc = desc;
                this.sector = sector;
                this.risk = risk;
                this.supply = supply;
                this.listPrice = listPrice;
                this.dividend = dividend;
                this.tier = tier;
                this.isIpoCandidate = isIpoCandidate;
            }
        }

        // GDD v5.0 완벽 고증 96개 종목 원본 소스
        private readonly FallbackProfile[] _fallbackProfiles = new FallbackProfile[]
        {
            #region IT Sector (9 Basic + 3 IPO)
            new FallbackProfile("CLOUDBERRY", "클라우드 베리", "암호화된 분산 서버 공급 업체. 시장 독점 우량주.", StockSector.IT, RiskLevel.Low, 1000000, 850, 0.030f, VolatilityTier.C),
            new FallbackProfile("SYNAPSENET", "시냅스 망", "도시 전역의 뉴럴 링크 인프라 구축 기업.", StockSector.IT, RiskLevel.Low, 1200000, 890, 0.031f, VolatilityTier.C),
            new FallbackProfile("TECHDOME", "테크 돔", "차세대 운영체제 '돔 OS' 독점 공급사.", StockSector.IT, RiskLevel.Low, 1500000, 910, 0.032f, VolatilityTier.C),
            new FallbackProfile("MOMOSOLUTION", "모모 솔루션", "전역 AI 비서 엔진 및 자동화 툴 개발사.", StockSector.IT, RiskLevel.Mid, 300000, 320, 0.015f, VolatilityTier.B),
            new FallbackProfile("CODEMASTER", "코드 마스터", "글로벌 개발 허브 및 툴킷 전문 개발사.", StockSector.IT, RiskLevel.Mid, 450000, 380, 0.017f, VolatilityTier.B),
            new FallbackProfile("IRONBRAIN", "아이언 브레인", "고성능 AI 연산용 특수 하드웨어 제조사.", StockSector.IT, RiskLevel.Mid, 400000, 410, 0.016f, VolatilityTier.B),
            new FallbackProfile("PATCHWORK", "패치워크", "시스템 글리치 및 보안 취약점 패치 소형주.", StockSector.IT, RiskLevel.High, 100000, 110, 0.002f, VolatilityTier.A),
            new FallbackProfile("GHOSTSHELL", "고스트 쉘", "양자 암호화 기술 기반 보안 솔루션 제공사.", StockSector.IT, RiskLevel.High, 120000, 130, 0.001f, VolatilityTier.A),
            new FallbackProfile("ZEROPIXEL", "제로 픽셀", "초저지연 가상 렌더링 엔진 공급 벤처 주식.", StockSector.IT, RiskLevel.High, 150000, 150, 0.000f, VolatilityTier.S),
            new FallbackProfile("PIXELCLOUD", "픽셀 클라우드", "클라우드 렌더링 인프라 구축 IPO 대기주.", StockSector.IT, RiskLevel.High, 100000, 120, 0.000f, VolatilityTier.S, true),
            new FallbackProfile("DATASPARK", "데이터 스파크", "실시간 빅데이터 분석 알고리즘 IPO 대기주.", StockSector.IT, RiskLevel.Mid, 300000, 350, 0.012f, VolatilityTier.B, true),
            new FallbackProfile("CODENEXUS", "코드 넥서스", "분산형 개발 생산성 솔루션 IPO 대기주.", StockSector.IT, RiskLevel.Low, 1000000, 800, 0.025f, VolatilityTier.C, true),
            #endregion

            #region Entertainment Sector (9 Basic + 3 IPO)
            new FallbackProfile("STARDUST", "스타더스트", "글로벌 가상 아이돌 및 IP 매니지먼트사.", StockSector.Entertainment, RiskLevel.Low, 1000000, 780, 0.028f, VolatilityTier.C),
            new FallbackProfile("ROYALMEDIA", "로열 미디어", "전역 공중파 채널 및 거대 OTT 미디어 그룹.", StockSector.Entertainment, RiskLevel.Low, 1100000, 810, 0.029f, VolatilityTier.C),
            new FallbackProfile("CINEMAHOLIC", "시네마 홀릭", "글로벌 영화관 체인 및 대작 전문 배급사.", StockSector.Entertainment, RiskLevel.Low, 900000, 750, 0.027f, VolatilityTier.C),
            new FallbackProfile("STUDIOLUNA", "스튜디오 루나", "픽셀 아트 기반 흥행작 전문 인디 제작사.", StockSector.Entertainment, RiskLevel.Mid, 300000, 290, 0.012f, VolatilityTier.B),
            new FallbackProfile("POPCORE", "팝 코어", "AI 맞춤형 디지털 음원 공급 및 스트리밍.", StockSector.Entertainment, RiskLevel.Mid, 350000, 340, 0.014f, VolatilityTier.B),
            new FallbackProfile("VISUALART", "비주얼 아트", "대작 게임 및 영화 CG 전문 기술 공급사.", StockSector.Entertainment, RiskLevel.Mid, 400000, 380, 0.015f, VolatilityTier.B),
            new FallbackProfile("NEXTONE", "넥스트 원", "홀로그램 기반 글로벌 타겟 가상 엔터사.", StockSector.Entertainment, RiskLevel.High, 150000, 140, 0.000f, VolatilityTier.A),
            new FallbackProfile("DARKHORSE", "다크 호스", "서브컬처 인디 게임 유통 퍼블리싱 명가.", StockSector.Entertainment, RiskLevel.High, 100000, 110, 0.000f, VolatilityTier.A),
            new FallbackProfile("SOCIALMIX", "소셜 믹스", "짧은 영상 중심 고속 급성장 소셜 네트워크.", StockSector.Entertainment, RiskLevel.High, 180000, 160, 0.002f, VolatilityTier.S),
            new FallbackProfile("VMUSE", "브이 뮤즈", "버추얼 유튜버 네트워크 전문 MCN IPO 대기주.", StockSector.Entertainment, RiskLevel.High, 120000, 150, 0.000f, VolatilityTier.S, true),
            new FallbackProfile("DEEPRECORD", "딥 레코드", "차세대 입체 음향 기술 보유 IPO 대기주.", StockSector.Entertainment, RiskLevel.Mid, 320000, 300, 0.010f, VolatilityTier.B, true),
            new FallbackProfile("STARIDOL", "스타 아이돌", "메타버스 전용 인공지능 아이돌 IPO 대기주.", StockSector.Entertainment, RiskLevel.Low, 950000, 720, 0.024f, VolatilityTier.C, true),
            #endregion

            #region Infrastructure Sector (9 Basic + 3 IPO)
            new FallbackProfile("SCONNECT", "S-커넥트", "초고속 무선 광통신망을 관리하는 기간망 국영 기업.", StockSector.Infrastructure, RiskLevel.Low, 2000000, 920, 0.032f, VolatilityTier.C),
            new FallbackProfile("METROLINK", "메트로 링크", "대중교통 시스템 및 자율주행 지능 인프라.", StockSector.Infrastructure, RiskLevel.Low, 1800000, 880, 0.030f, VolatilityTier.C),
            new FallbackProfile("GLOBALROUTE", "글로벌 루트", "해저 광케이블망 및 국경간 데이터 수송 통제.", StockSector.Infrastructure, RiskLevel.Low, 2500000, 940, 0.033f, VolatilityTier.C),
            new FallbackProfile("AIRLINK", "에어 링크", "도심형 항공 관제망 중심 UAM 인프라 선구자.", StockSector.Infrastructure, RiskLevel.Mid, 500000, 410, 0.018f, VolatilityTier.B),
            new FallbackProfile("CITYGUARD", "시티 가드", "관제 AI 폐쇄회로 카메라 스마트 시티 방어.", StockSector.Infrastructure, RiskLevel.Mid, 450000, 360, 0.015f, VolatilityTier.B),
            new FallbackProfile("PIPELINE", "파이프 라인", "물자 자원 수송 지하 파이프라인 관리 독점주.", StockSector.Infrastructure, RiskLevel.Mid, 400000, 390, 0.016f, VolatilityTier.B),
            new FallbackProfile("WAVECOMM", "웨이브 통신", "위성 중계 및 주파수 독점 사업권 확보 종목.", StockSector.Infrastructure, RiskLevel.High, 200000, 190, 0.005f, VolatilityTier.A),
            new FallbackProfile("SIGNALZERO", "시그널 제로", "차세대 초소형 6G 핵심 칩셋 연구 개발 벤처.", StockSector.Infrastructure, RiskLevel.High, 150000, 140, 0.001f, VolatilityTier.A),
            new FallbackProfile("LASTMILE", "라스트 마일", "자율 드론 물류 노선 전문 운항 인프라 시스템.", StockSector.Infrastructure, RiskLevel.High, 120000, 110, 0.000f, VolatilityTier.S),
            new FallbackProfile("HYPERLOOP", "하이퍼 루프", "초고속 자기부상 진공 터널 건설 IPO 대기주.", StockSector.Infrastructure, RiskLevel.High, 130000, 130, 0.000f, VolatilityTier.S, true),
            new FallbackProfile("URBANGRID", "어반 그리드", "스마트 시티 분산형 전력 분배망 IPO 대기주.", StockSector.Infrastructure, RiskLevel.Mid, 480000, 380, 0.014f, VolatilityTier.B, true),
            new FallbackProfile("SMARTPIPE", "스마트 파이프", "자동 누수 탐지 센싱 지하 파이프 IPO 대기주.", StockSector.Infrastructure, RiskLevel.Low, 1900000, 870, 0.029f, VolatilityTier.C, true),
            #endregion

            #region Bio Sector (9 Basic + 3 IPO)
            new FallbackProfile("FORESTLAB", "포레스트 랩", "천연물질 가공 기초 바이오 의약 연구 우량주.", StockSector.Bio, RiskLevel.Low, 800000, 650, 0.025f, VolatilityTier.C),
            new FallbackProfile("WHITEMEDI", "화이트 메디", "국가지정 필수 백신 유통 위탁 CMO 전문사.", StockSector.Bio, RiskLevel.Low, 900000, 680, 0.026f, VolatilityTier.C),
            new FallbackProfile("PURESCIENCE", "퓨어 사이언스", "진단 검사 및 정밀 시약 시장 독점 납품사.", StockSector.Bio, RiskLevel.Low, 1000000, 720, 0.027f, VolatilityTier.C),
            new FallbackProfile("NEURONBIO", "뉴런 바이오", "뇌 신경망 인터페이스 BCI 칩 임상 수행 기업.", StockSector.Bio, RiskLevel.Mid, 250000, 380, 0.010f, VolatilityTier.B),
            new FallbackProfile("GENEMATRIX", "진 매트릭스", "유전자 조작 맞춤형 희귀 유전병 절단 가위 기술.", StockSector.Bio, RiskLevel.Mid, 300000, 420, 0.013f, VolatilityTier.B),
            new FallbackProfile("CELLEFFECT", "셀 이펙트", "성체 줄기세포 치료 및 인공 피부 배양 개발.", StockSector.Bio, RiskLevel.Mid, 350000, 450, 0.014f, VolatilityTier.B),
            new FallbackProfile("LIFECURE", "라이프 큐어", "난치성 표적 항암제 후보 물질 보유 고위험군.", StockSector.Bio, RiskLevel.High, 100000, 120, 0.000f, VolatilityTier.A),
            new FallbackProfile("VIRUSX", "바이러스 X", "신종 면역체 결핍 치료 유전자 합성 연구소.", StockSector.Bio, RiskLevel.High, 130000, 140, 0.000f, VolatilityTier.A),
            new FallbackProfile("BIOSYNC", "바이오 싱크", "바이오 인공 장기 인공 근섬유 특화 하이테크.", StockSector.Bio, RiskLevel.High, 110000, 110, 0.000f, VolatilityTier.S),
            new FallbackProfile("NANOCURE", "나노 큐어", "체내 침투형 약물 전달 나노 봇 IPO 대기주.", StockSector.Bio, RiskLevel.High, 105000, 130, 0.000f, VolatilityTier.S, true),
            new FallbackProfile("GENEZIN", "젠 진", "희귀 질환 유전자 백신 치료제 개발 IPO 대기주.", StockSector.Bio, RiskLevel.Mid, 280000, 400, 0.011f, VolatilityTier.B, true),
            new FallbackProfile("BIOBLOOM", "바이오 블룸", "면역 증강 맞춤 천연 건강 솔루션 IPO 대기주.", StockSector.Bio, RiskLevel.Low, 850000, 640, 0.023f, VolatilityTier.C, true),
            #endregion

            #region Aerospace Sector (9 Basic + 3 IPO)
            new FallbackProfile("WINGSLOGIS", "윙스 로지스", "저궤도 배송 위성 물류 공급망 분야의 혁신주.", StockSector.Aerospace, RiskLevel.Low, 1000000, 720, 0.027f, VolatilityTier.C),
            new FallbackProfile("SKYNET", "스카이 넷", "지구 전역 정밀 인프라 통신 스카이링크 운영.", StockSector.Aerospace, RiskLevel.Low, 1200000, 750, 0.028f, VolatilityTier.C),
            new FallbackProfile("AIRCARRIER", "에어 캐리어", "초대형 글로벌 여객 운항 및 항공 수송 거점.", StockSector.Aerospace, RiskLevel.Low, 1500000, 790, 0.030f, VolatilityTier.C),
            new FallbackProfile("BLUESKY", "블루 스카이", "LCC 실용성 기반 및 개인 자율 렌탈 서비스.", StockSector.Aerospace, RiskLevel.Mid, 400000, 340, 0.013f, VolatilityTier.B),
            new FallbackProfile("ORBITALTECH", "오비탈 테크", "민간 발사 대행업 및 위성 궤도 수정 모듈.", StockSector.Aerospace, RiskLevel.Mid, 350000, 380, 0.015f, VolatilityTier.B),
            new FallbackProfile("JETSTREAM", "젯 스트림", "항공용 특수 추진체 이온 가열 보조 엔진.", StockSector.Aerospace, RiskLevel.Mid, 300000, 410, 0.016f, VolatilityTier.B),
            new FallbackProfile("AURORAAERO", "오로라 에어로", "민간 우주 체류 및 지구 궤도 호텔 패키지.", StockSector.Aerospace, RiskLevel.High, 150000, 160, 0.000f, VolatilityTier.A),
            new FallbackProfile("COSMOSX", "코스모스 X", "심우주 탐색 무인 비행 및 자원 성분 연구.", StockSector.Aerospace, RiskLevel.High, 120000, 130, 0.000f, VolatilityTier.A),
            new FallbackProfile("GALAXYMINING", "갤럭시 마이닝", "소행성 궤도 추적 및 우주 자원 광물 수집.", StockSector.Aerospace, RiskLevel.High, 100000, 110, 0.000f, VolatilityTier.S),
            new FallbackProfile("STARTAXI", "스타 택시", "도심 상공 개인 단거리 에어택시 IPO 대기주.", StockSector.Aerospace, RiskLevel.High, 110000, 150, 0.000f, VolatilityTier.S, true),
            new FallbackProfile("OBITLINK", "오빗 링크", "초정밀 인공위성 중계 관제 시스템 IPO 대기주.", StockSector.Aerospace, RiskLevel.Mid, 380000, 360, 0.012f, VolatilityTier.B, true),
            new FallbackProfile("COMETEXP", "코멧 익스프레스", "대형 여객 로켓 부품 고속 공급망 IPO 대기주.", StockSector.Aerospace, RiskLevel.Low, 1100000, 700, 0.025f, VolatilityTier.C, true),
            #endregion

            #region Retail Sector (9 Basic + 3 IPO)
            new FallbackProfile("MORNINGBREW", "모닝 브루", "전국적 카페 프랜차이즈 식음료 종합 대중주.", StockSector.Retail, RiskLevel.Low, 1500000, 880, 0.030f, VolatilityTier.C),
            new FallbackProfile("EVERYMART", "에브리 마트", "대형 유통 거점 및 소비 지표 밀착형 우량주.", StockSector.Retail, RiskLevel.Low, 2000000, 920, 0.032f, VolatilityTier.C),
            new FallbackProfile("RETAILPRO", "리테일 프로", "자동화 편의 유통망 보유 1위 캐시카우 종목.", StockSector.Retail, RiskLevel.Low, 1800000, 900, 0.031f, VolatilityTier.C),
            new FallbackProfile("ORGANICTABLE", "오가닉 테이블", "친환경 신선 식품 고소득층 겨냥 고마진 배달.", StockSector.Retail, RiskLevel.Mid, 400000, 310, 0.014f, VolatilityTier.B),
            new FallbackProfile("FASHIONWEEK", "패션 위크", "통합 디지털 의류 멀티 브랜드 유통 플랫폼.", StockSector.Retail, RiskLevel.Mid, 350000, 350, 0.016f, VolatilityTier.B),
            new FallbackProfile("SMARTHOME", "스마트 홈", "공간 가구 인프라 및 홈 오피스 가구 공급.", StockSector.Retail, RiskLevel.Mid, 300000, 380, 0.017f, VolatilityTier.B),
            new FallbackProfile("SWEETBAKERY", "스윗 베이커리", "글로벌 디저트 시장 프랜차이즈 급속 팽창.", StockSector.Retail, RiskLevel.High, 150000, 130, 0.001f, VolatilityTier.A),
            new FallbackProfile("LUXURYBEAN", "럭셔리 빈", "고가 명품 사치 식자재 다국적 수입 통제사.", StockSector.Retail, RiskLevel.High, 120000, 220, 0.005f, VolatilityTier.A),
            new FallbackProfile("LASTDEAL", "라스트 딜", "한정판 사치재 2차 리셀 중개 플랫폼 운영.", StockSector.Retail, RiskLevel.High, 100000, 110, 0.000f, VolatilityTier.S),
            new FallbackProfile("ALLEYCAFE", "골목 다방", "로컬 골목길 전통 차 복고 프랜차이즈 IPO 대기주.", StockSector.Retail, RiskLevel.High, 110000, 120, 0.000f, VolatilityTier.S, true),
            new FallbackProfile("FRESHMART", "프레시 마트", "중소도시 분산형 고속 신선식품 마트 IPO 대기주.", StockSector.Retail, RiskLevel.Mid, 390000, 320, 0.013f, VolatilityTier.B, true),
            new FallbackProfile("QUICKDELIVERY", "퀵 딜리버리", "전국망 라스트마일 마이크로 터미널 IPO 대기주.", StockSector.Retail, RiskLevel.Low, 1400000, 820, 0.026f, VolatilityTier.C, true),
            #endregion

            #region Energy Sector (9 Basic + 3 IPO)
            new FallbackProfile("WINDHILL", "윈드 힐", "대형 풍력 발전 터빈 기지 구축 및 수력 보조.", StockSector.Energy, RiskLevel.Low, 1000000, 750, 0.029f, VolatilityTier.C),
            new FallbackProfile("SOLARFUTURE", "솔라 퓨처", "광범위 태양에너지 저장 ESS 기지 인프라.", StockSector.Energy, RiskLevel.Low, 1200000, 780, 0.030f, VolatilityTier.C),
            new FallbackProfile("AQUAENERGY", "아쿠아 에너지", "조력 파동 발전 전원망 국토 안심 인프라.", StockSector.Energy, RiskLevel.Low, 900000, 720, 0.027f, VolatilityTier.C),
            new FallbackProfile("SUNLIGHT", "선 라이트", "가정용 보급형 초소형 태양열 복사 패널.", StockSector.Energy, RiskLevel.Mid, 450000, 360, 0.016f, VolatilityTier.B),
            new FallbackProfile("FUSIONLAB", "핵 융합 랩", "꿈의 청정 핵융합 상용 특이점 연구 개발사.", StockSector.Energy, RiskLevel.Mid, 300000, 450, 0.018f, VolatilityTier.B),
            new FallbackProfile("GREENGAS", "그린 가스", "수소 이온화 동력 변환 충전 기지 구축.", StockSector.Energy, RiskLevel.Mid, 400000, 390, 0.017f, VolatilityTier.B),
            new FallbackProfile("ECOBATTERY", "에코 배터리", "차세대 주력 전고체 전해질 배터리 전용 소재.", StockSector.Energy, RiskLevel.High, 200000, 210, 0.003f, VolatilityTier.A),
            new FallbackProfile("CARBONZERO", "카본 제로", "탄소 포집 수치 대폭 감소 고성능 필터 벤처.", StockSector.Energy, RiskLevel.High, 150000, 180, 0.001f, VolatilityTier.A),
            new FallbackProfile("SUNPOWER", "썬 파워", "우주 태양광 집속 조사 초단파 유도 송전망.", StockSector.Energy, RiskLevel.High, 120000, 150, 0.000f, VolatilityTier.S),
            new FallbackProfile("FUSIONCORE", "퓨전 코어", "대형 토카막 핵융합 자기장 정밀 소자 IPO 대기주.", StockSector.Energy, RiskLevel.High, 130000, 160, 0.000f, VolatilityTier.S, true),
            new FallbackProfile("SOLARWAVE", "솔라 웨이브", "고효율 유기물 박막 태양전지 솔루션 IPO 대기주.", StockSector.Energy, RiskLevel.Mid, 420000, 380, 0.015f, VolatilityTier.B, true),
            new FallbackProfile("WINDBLADE", "윈드 블레이드", "해상 풍력 터빈 초대형 탄소 블레이드 IPO 대기주.", StockSector.Energy, RiskLevel.Low, 1100000, 730, 0.026f, VolatilityTier.C, true),
            #endregion

            #region Finance Sector (9 Basic + 3 IPO)
            new FallbackProfile("COZYPAY", "코지 페이", "전 국민 점유 간편 결제 페이 기반 핀테크 주식.", StockSector.Finance, RiskLevel.Low, 1200000, 900, 0.035f, VolatilityTier.C),
            new FallbackProfile("SAFEBANK", "세이프 뱅크", "가장 단단하고 압도적인 예치 자금 상업 은행.", StockSector.Finance, RiskLevel.Low, 2000000, 950, 0.036f, VolatilityTier.C),
            new FallbackProfile("ROYALCAPITAL", "로열 캐피탈", "기업 특별 융자 리스 종합 설비 할부 금융.", StockSector.Finance, RiskLevel.Low, 1500000, 920, 0.034f, VolatilityTier.C),
            new FallbackProfile("MINTASSET", "민트 자산운용", "해외 대형 주가지수 및 고품격 사모 자산 운용.", StockSector.Finance, RiskLevel.Mid, 400000, 420, 0.020f, VolatilityTier.B),
            new FallbackProfile("BLUEBOND", "블루 본드", "국가 및 공기업 특별 부채 채권 매매 중개소.", StockSector.Finance, RiskLevel.Mid, 350000, 450, 0.022f, VolatilityTier.B),
            new FallbackProfile("SMARTINSU", "스마트 인슈", "기초 재해 확률 머신러닝 최적 보험료 자동화.", StockSector.Finance, RiskLevel.Mid, 300000, 480, 0.023f, VolatilityTier.B),
            new FallbackProfile("GOLDPOCKET", "골드 포켓", "해외 파생 상품 마진 레버리지 극대화 투기 성향.", StockSector.Finance, RiskLevel.High, 150000, 250, 0.008f, VolatilityTier.A),
            new FallbackProfile("CRYPTOBANK", "크립토 뱅크", "분산 지갑 및 디지털 크로스 보더 결제 중개.", StockSector.Finance, RiskLevel.High, 100000, 180, 0.000f, VolatilityTier.A),
            new FallbackProfile("QUANTLAB", "퀀트 랩", "알고리즘 수백만 초단타 분산 차익 자동화 솔루션.", StockSector.Finance, RiskLevel.High, 120000, 210, 0.005f, VolatilityTier.S),
            new FallbackProfile("CRYPTONODE", "크립토 노드", "블록체인 분산 노드 및 디지털 자산 수탁 IPO 대기주.", StockSector.Finance, RiskLevel.High, 110000, 190, 0.000f, VolatilityTier.S, true),
            new FallbackProfile("SAFETRUST", "세이프 트러스트", "대부형 특수 담보 설정 신탁 관리 IPO 대기주.", StockSector.Finance, RiskLevel.Mid, 360000, 430, 0.018f, VolatilityTier.B, true),
            new FallbackProfile("NEOBANK", "네오 뱅크", "디지털 비대면 최적화 금리 강점 인터넷 은행 IPO 대기주.", StockSector.Finance, RiskLevel.Low, 1300000, 890, 0.030f, VolatilityTier.C, true)
            #endregion
        };

        protected override void Awake()
        {
            base.Awake();
            InitializeStocks();

            // 핵심 시간/주가 엔진 및 트레이더 강제 초기화 (이벤트 루프 기동)
            var tick = TickEngine.Instance;
            var price = PriceEngine.Instance;
            var tracker = PeakTracker.Instance;
            var ghost = GhostTrader.Instance;
        }

        /// <summary>
        /// 96개 주식 데이터를 Resources에서 탐색하고 없으면 Programmatic Fallback을 사용하여 강제 생성합니다.
        /// </summary>
        private void InitializeStocks()
        {
            _stockInstances.Clear();

            // 1. Resources 로드 시도
            StockDataSO[] loadedData = Resources.LoadAll<StockDataSO>("Stocks");
            Dictionary<string, StockDataSO> assetsMap = new Dictionary<string, StockDataSO>();
            if (loadedData != null)
            {
                foreach (var data in loadedData)
                {
                    if (data != null && !string.IsNullOrEmpty(data.stockId))
                    {
                        assetsMap[data.stockId.ToUpper()] = data;
                    }
                }
            }

            // 2. Programmatic Fallback 루프를 통한 96종 완전 로드 보장
            foreach (var profile in _fallbackProfiles)
            {
                StockDataSO finalData = null;
                string upperId = profile.id.ToUpper();

                if (assetsMap.TryGetValue(upperId, out var existingSO))
                {
                    finalData = existingSO;
                }
                else
                {
                    // 에셋 누락 시 메모리 상에 동적 생성 (Fail-safe)
                    finalData = ScriptableObject.CreateInstance<StockDataSO>();
                    finalData.stockId = profile.id;
                    finalData.companyName = profile.name;
                    finalData.description = profile.desc;
                    finalData.sector = profile.sector;
                    finalData.riskLevel = profile.risk;
                    finalData.totalSupply = profile.supply;
                    finalData.floatingSupply = (long)(profile.supply * 0.40f); // 40% 유동성 강제
                    finalData.listingPrice = profile.listPrice;
                    finalData.weeklyDividendRate = profile.dividend;
                    finalData.volatilityTier = profile.tier;
                    finalData.isIpoCandidate = profile.isIpoCandidate;
                }

                // 런타임 인스턴스 생성
                StockInstance instance = new StockInstance(finalData);
                _stockInstances[instance.StockId] = instance;
            }

            Debug.Log($"[MarketManager] Successfully initialized {_stockInstances.Count} stock instances (72 Basic, 24 IPO Candidates).");
        }

        #region Public APIs (종목 상태 조회용 인터페이스)

        /// <summary>
        /// ID 기반 특정 단일 주식 인스턴스 반환 (C++ 서버 틱 동적 코드 호환)
        /// </summary>
        public StockInstance GetStock(string stockId)
        {
            if (string.IsNullOrEmpty(stockId)) return null;
            string key = stockId.ToUpper();
            if (_stockInstances.TryGetValue(key, out var instance))
            {
                return instance;
            }

            // C++ 서버 틱 패킷(IT_01, ENT_01 등) 수신 시 자동 런타임 동적 생성 지원 (Fail-safe)
            StockDataSO dynamicSO = ScriptableObject.CreateInstance<StockDataSO>();
            dynamicSO.stockId = key;
            dynamicSO.companyName = GetDefaultNameByCode(key);
            dynamicSO.listingPrice = 50000;
            dynamicSO.floatingSupply = 100000;
            dynamicSO.isIpoCandidate = false;

            StockInstance newInstance = new StockInstance(dynamicSO);
            _stockInstances[key] = newInstance;
            return newInstance;
        }

        private string GetDefaultNameByCode(string code)
        {
            switch (code.ToUpper())
            {
                case "IT_01": return "사이퍼 테크";
                case "IT_02": return "네오 네트웍스";
                case "ENT_01": return "미드나잇 엔터";
                case "ENT_02": return "비트 메이커스";
                case "BIO_01": return "바이오 파마";
                case "FIN_01": return "노드 파이낸스";
                case "LOG_01": return "비트 물류";
                default: return code;
            }
        }

        /// <summary>
        /// 96개 전체 종목 인스턴스 반환
        /// </summary>
        public List<StockInstance> GetAllStocks()
        {
            return new List<StockInstance>(_stockInstances.Values);
        }

        /// <summary>
        /// 현재 시장에 상장(IsListed = true)되어 거래 중인 종목 리스트 반환
        /// </summary>
        public List<StockInstance> GetListedStocks()
        {
            List<StockInstance> listed = new List<StockInstance>();
            foreach (var instance in _stockInstances.Values)
            {
                if (instance.IsListed)
                {
                    listed.Add(instance);
                }
            }
            return listed;
        }

        /// <summary>
        /// 상장되지 않은 IPO 대기 리저브 종목 리스트 반환
        /// </summary>
        public List<StockInstance> GetIpoCandidates()
        {
            List<StockInstance> ipos = new List<StockInstance>();
            foreach (var instance in _stockInstances.Values)
            {
                if (instance.IsIpoReady && !instance.IsListed)
                {
                    ipos.Add(instance);
                }
            }
            return ipos;
        }

        /// <summary>
        /// 특정 섹터(산업군)에 소속된 상장 종목 리스트 반환
        /// </summary>
        public List<StockInstance> GetListedStocksBySector(StockSector sector)
        {
            List<StockInstance> sectorStocks = new List<StockInstance>();
            foreach (var instance in _stockInstances.Values)
            {
                if (instance.IsListed && instance.Data.sector == sector)
                {
                    sectorStocks.Add(instance);
                }
            }
            return sectorStocks;
        }

        #endregion

        #region Serialization & Persistence Sync (세이브/로드 무결성 복원 시스템)

        /// <summary>
        /// 세이브 파일 로드 성공 시 호출되어 96개 전종목의 런타임 상태를 복원합니다.
        /// 세이브 파일에 정보가 없다면 데이원 초기 규격으로 자동 마이그레이션합니다.
        /// </summary>
        public void LoadMarketState(Dictionary<string, StockStateDTO> marketState)
        {
            if (marketState == null || marketState.Count == 0)
            {
                // 데이원 최초 구동 스펙 강제 리셋
                Debug.LogWarning("[MarketManager] No persistent market state found. Executing Day-1 Default Listing Strategy.");
                ResetToDayOneDefault();
                return;
            }

            foreach (var instance in _stockInstances.Values)
            {
                if (marketState.TryGetValue(instance.StockId, out var state))
                {
                    instance.CurrentPrice = state.CurrentPrice;
                    instance.AvailableVolume = state.AvailableVolume;
                    instance.PeakPrice = state.PeakPrice;
                    instance.SplitCount = state.SplitCount;
                    instance.IsListed = state.IsListed;
                    instance.IsIpoReady = state.IsIpoReady;
                    instance.DailyHigh = state.DailyHigh == 0 ? state.CurrentPrice : state.DailyHigh;
                    instance.DailyLow = state.DailyLow == 0 ? state.CurrentPrice : state.DailyLow;
                    
                    instance.BelowOnePercentStartTimeUtc = state.BelowOnePercentStartTimeUtc;
                    instance.TradingHaltEndTimeUtc = state.TradingHaltEndTimeUtc;
                    instance.IsLiquidationPeriod = state.IsLiquidationPeriod;
                    instance.LiquidationEndTimeUtc = state.LiquidationEndTimeUtc;
                    
                    instance.PriceHistory.Clear();
                    instance.PriceHistory.AddRange(state.PriceHistory);
                }
                else
                {
                    // 예기치 않은 세이브 데이터 불일치 예방 (개별 예방 보정)
                    instance.IsListed = !instance.Data.isIpoCandidate;
                    instance.IsIpoReady = instance.Data.isIpoCandidate;
                    instance.CurrentPrice = instance.Data.listingPrice;
                    instance.AvailableVolume = instance.Data.floatingSupply;
                    instance.PeakPrice = instance.Data.listingPrice;
                    instance.DailyHigh = instance.Data.listingPrice;
                    instance.DailyLow = instance.Data.listingPrice;
                    instance.SplitCount = 0;
                    
                    instance.BelowOnePercentStartTimeUtc = null;
                    instance.TradingHaltEndTimeUtc = null;
                    instance.IsLiquidationPeriod = false;
                    instance.LiquidationEndTimeUtc = null;
                    
                    instance.PriceHistory.Clear();
                    instance.PriceHistory.Add(instance.CurrentPrice);
                }
            }
            Debug.Log($"[MarketManager] Successfully restored 96 stocks runtime states from save metadata.");
        }

        /// <summary>
        /// 세이브 작성 시 호출되어 96개 종목의 런타임 가변 가격/거래량 정보를 DTO 딕셔너리로 패키징합니다.
        /// </summary>
        public Dictionary<string, StockStateDTO> SaveMarketState()
        {
            var stateDict = new Dictionary<string, StockStateDTO>();
            foreach (var instance in _stockInstances.Values)
            {
                StockStateDTO dto = new StockStateDTO
                {
                    StockId = instance.StockId,
                    CurrentPrice = instance.CurrentPrice,
                    AvailableVolume = instance.AvailableVolume,
                    PeakPrice = instance.PeakPrice,
                    SplitCount = instance.SplitCount,
                    IsListed = instance.IsListed,
                    IsIpoReady = instance.IsIpoReady,
                    DailyHigh = instance.DailyHigh,
                    DailyLow = instance.DailyLow,
                    BelowOnePercentStartTimeUtc = instance.BelowOnePercentStartTimeUtc,
                    TradingHaltEndTimeUtc = instance.TradingHaltEndTimeUtc,
                    IsLiquidationPeriod = instance.IsLiquidationPeriod,
                    LiquidationEndTimeUtc = instance.LiquidationEndTimeUtc,
                    PriceHistory = instance.PriceHistory.ToList()
                };
                stateDict[instance.StockId] = dto;
            }
            return stateDict;
        }

        /// <summary>
        /// 72종 데이원 활성 상장 및 24종 IPO 봉인을 강제 세팅합니다. (최초 실행 스펙)
        /// </summary>
        public void ResetToDayOneDefault()
        {
            foreach (var instance in _stockInstances.Values)
            {
                instance.IsListed = !instance.Data.isIpoCandidate; // 기본 72종은 True, IPO 24종은 False
                instance.IsIpoReady = instance.Data.isIpoCandidate; // IPO 대기는 True

                // 초기 가격 밸런싱
                instance.CurrentPrice = instance.Data.listingPrice;
                instance.AvailableVolume = instance.Data.floatingSupply;
                instance.PeakPrice = instance.Data.listingPrice;
                instance.SplitCount = 0;
                instance.DailyHigh = instance.Data.listingPrice;
                instance.DailyLow = instance.Data.listingPrice;
                
                instance.BelowOnePercentStartTimeUtc = null;
                instance.TradingHaltEndTimeUtc = null;
                instance.IsLiquidationPeriod = false;
                instance.LiquidationEndTimeUtc = null;
                
                instance.PriceHistory.Clear();
                instance.AddPriceToHistory(instance.CurrentPrice);
            }
            Debug.Log("[MarketManager] Market reset to Day-1 state (72 Basic listed, 24 IPO reserved).");
        }

        #endregion
    }

    /// <summary>
    /// 단일 주식 종목의 실시간 가변 런타임 수치를 제어하는 상태 인스턴스 클래스.
    /// </summary>
    public class StockInstance
    {
        /// <summary>이 주식의 정적 속성 프로필 프로토타입</summary>
        public StockDataSO Data { get; private set; }

        public string StockId => Data.stockId.ToUpper();

        /// <summary>실시간 현재 가격 (Gold 단위)</summary>
        public long CurrentPrice;

        /// <summary>현재 유저 및 봇이 매수할 수 있는 남은 유동 주수 잔량</summary>
        public long AvailableVolume;

        /// <summary>역대 최고가 (ATH - All Time High)</summary>
        public long PeakPrice;

        /// <summary>당일 최고가</summary>
        public long DailyHigh;

        /// <summary>당일 최저가</summary>
        public long DailyLow;

        /// <summary>누적 주식 액면 분할 횟수 (최대 3회 제한)</summary>
        public int SplitCount;

        /// <summary>현재 거래 보드에 활성 상장되어 공개 거래되고 있는지 여부</summary>
        public bool IsListed;

        /// <summary>IPO 풀 내에서 대기하고 있는 상태인지 여부 (IsListed 활성화 시 False 전환)</summary>
        public bool IsIpoReady;

        /// <summary>최근 가격 변동 기록 (최대 168틱 = 7주간 보존)</summary>
        public CircularBuffer<long> PriceHistory = new CircularBuffer<long>(168);

        // --- 액면분할 및 상폐 정지 시간 런타임 데이터 ---
        public DateTime? BelowOnePercentStartTimeUtc;
        public DateTime? TradingHaltEndTimeUtc;
        public bool IsLiquidationPeriod;
        public DateTime? LiquidationEndTimeUtc;

        public StockInstance(StockDataSO data)
        {
            Data = data ?? throw new ArgumentNullException(nameof(data));
            CurrentPrice = data.listingPrice;
            AvailableVolume = data.floatingSupply;
            PeakPrice = data.listingPrice;
            DailyHigh = data.listingPrice;
            DailyLow = data.listingPrice;
            SplitCount = 0;
            IsListed = !data.isIpoCandidate;
            IsIpoReady = data.isIpoCandidate;
            
            BelowOnePercentStartTimeUtc = null;
            TradingHaltEndTimeUtc = null;
            IsLiquidationPeriod = false;
            LiquidationEndTimeUtc = null;

            PriceHistory.Clear();
            AddPriceToHistory(CurrentPrice);
        }

        /// <summary>
        /// 가격 변동 내역을 누적 저장하며, 최대 168틱 한계치를 넘는 데이터는 자동 덮어씁니다.
        /// </summary>
        public void AddPriceToHistory(long price)
        {
            PriceHistory.Add(price);
        }
    }
}
