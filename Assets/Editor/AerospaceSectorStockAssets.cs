using UnityEditor;
using UnityEngine;
using StockWars.Core;
using static StockWars.EditorScripts.StockAssetCreatorUtil;

namespace StockWars.EditorScripts
{
    /// <summary>
    /// 항공우주 섹터 9종 StockDataSO 에셋 자동 생성기.
    ///   Low  3종: 윙스 로지스, 스카이 넷, 에어 캐리어
    ///   Mid  3종: 블루 스카이, 오비탈 테크, 젯 스트림
    ///   High 3종: 오로라 에어로, 코스모스 X, 갤럭시 마이닝
    ///
    /// 사용법: StockWars > Create Stock Assets > Aerospace Sector 전체 9종
    /// </summary>
    public static class AerospaceSectorStockAssets
    {
        private const string TAG = "[Aerospace]";

        [MenuItem("StockWars/Create Stock Assets/Aerospace Sector 전체 9종")]
        public static void Create()
        {
            EnsureFolder();

            int created = 0;
            int skipped = 0;

            // ── Low / VolatilityTier.C ── 대형 물류·항공 우량주 ─────────────

            // 윙스 로지스: 저궤도 위성 물류 혁신주
            created += CreateAsset(new StockProfile
            {
                stockId            = "WINGSLOGIS",
                companyName        = "윙스 로지스",
                description        = "저궤도 위성을 활용한 글로벌 초고속 배송 업체. " +
                                     "물류 혁신을 주도하며 실적 기반의 완만한 성장을 보입니다.",
                sector             = StockSector.Aerospace,
                riskLevel          = RiskLevel.Low,
                totalSupply        = 1_000_000L,
                listingPrice       = 720L,
                weeklyDividendRate = 0.027f,
                volatilityTier     = VolatilityTier.C,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // 스카이 넷: 위성 통신망 스카이 링크 운영사
            created += CreateAsset(new StockProfile
            {
                stockId            = "SKYNET",
                companyName        = "스카이 넷",
                description        = "지구 전역을 커버하는 위성 통신망 '스카이 링크' 운영사. " +
                                     "통신 사각지대 해소 뉴스에 따라 주가가 상승합니다.",
                sector             = StockSector.Aerospace,
                riskLevel          = RiskLevel.Low,
                totalSupply        = 1_200_000L,
                listingPrice       = 750L,
                weeklyDividendRate = 0.028f,
                volatilityTier     = VolatilityTier.C,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // 에어 캐리어: 초대형 화물·여객 항공사
            created += CreateAsset(new StockProfile
            {
                stockId            = "AIRCARRIER",
                companyName        = "에어 캐리어",
                description        = "초대형 화물 수송기 및 여객 항공사. " +
                                     "유가 하락과 여행 수요 증가 시 섹터 내에서 가장 먼저 반응합니다.",
                sector             = StockSector.Aerospace,
                riskLevel          = RiskLevel.Low,
                totalSupply        = 1_500_000L,
                listingPrice       = 790L,
                weeklyDividendRate = 0.030f,
                volatilityTier     = VolatilityTier.C,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // ── Mid / VolatilityTier.B ── 중형 LCC·발사체 성장주 ────────────

            // 블루 스카이: LCC 및 소형 제트기 렌탈 서비스
            created += CreateAsset(new StockProfile
            {
                stockId            = "BLUESKY",
                companyName        = "블루 스카이",
                description        = "저가 항공사(LCC) 및 소형 제트기 렌탈 서비스. " +
                                     "유가 및 국제 정세(날씨 효과)에 가장 민감하게 반응합니다.",
                sector             = StockSector.Aerospace,
                riskLevel          = RiskLevel.Mid,
                totalSupply        = 400_000L,
                listingPrice       = 340L,
                weeklyDividendRate = 0.013f,
                volatilityTier     = VolatilityTier.B,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // 오비탈 테크: 민간 로켓 발사 대행 및 위성 사후 관리
            created += CreateAsset(new StockProfile
            {
                stockId            = "ORBITALTECH",
                companyName        = "오비탈 테크",
                description        = "민간 로켓 발사 대행 및 저궤도 위성 사후 관리 기업. " +
                                     "발사 성공률 지표에 따라 주가가 계단식으로 상승합니다.",
                sector             = StockSector.Aerospace,
                riskLevel          = RiskLevel.Mid,
                totalSupply        = 350_000L,
                listingPrice       = 380L,
                weeklyDividendRate = 0.015f,
                volatilityTier     = VolatilityTier.B,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // 젯 스트림: 차세대 항공기 엔진 추진체 개발사
            created += CreateAsset(new StockProfile
            {
                stockId            = "JETSTREAM",
                companyName        = "젯 스트림",
                description        = "차세대 항공기 엔진 및 이온 추진체 전문 개발사. " +
                                     "기술 수출 소식에 따라 단기적인 주가 상승 모멘텀을 가집니다.",
                sector             = StockSector.Aerospace,
                riskLevel          = RiskLevel.Mid,
                totalSupply        = 300_000L,
                listingPrice       = 410L,
                weeklyDividendRate = 0.016f,
                volatilityTier     = VolatilityTier.B,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // ── High ── 소형 우주 탐사·채굴 테마주 ──────────────────────────

            // 오로라 에어로: 민간 우주 관광 기업 — VolatilityTier.A
            created += CreateAsset(new StockProfile
            {
                stockId            = "AURORAAERO",
                companyName        = "오로라 에어로",
                description        = "민간 우주 관광 및 화성 거주지 모듈 개발사. " +
                                     "꿈을 파는 기업으로 불리며 실적보다는 뉴스 한 줄에 주가가 폭등락합니다.",
                sector             = StockSector.Aerospace,
                riskLevel          = RiskLevel.High,
                totalSupply        = 150_000L,
                listingPrice       = 160L,
                weeklyDividendRate = 0.000f,
                volatilityTier     = VolatilityTier.A,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // 코스모스 X: 심우주 탐사 전문 연구소 — VolatilityTier.A
            created += CreateAsset(new StockProfile
            {
                stockId            = "COSMOSX",
                companyName        = "코스모스 X",
                description        = "심우주 탐사 및 외계 자원 분석 전문 연구소. " +
                                     "탐사선 착륙 성공 소식에 따라 전설적인 수익률을 기록하기도 합니다.",
                sector             = StockSector.Aerospace,
                riskLevel          = RiskLevel.High,
                totalSupply        = 120_000L,
                listingPrice       = 130L,
                weeklyDividendRate = 0.000f,
                volatilityTier     = VolatilityTier.A,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // 갤럭시 마이닝: 소행성 광물 채굴 초고위험 종목 — VolatilityTier.S
            created += CreateAsset(new StockProfile
            {
                stockId            = "GALAXYMINING",
                companyName        = "갤럭시 마이닝",
                description        = "소행성 광물 채굴 및 희토류 대체재 연구사. " +
                                     "채굴권 확보 소식 하나에 상한가를 기록하는 초고위험 종목입니다.",
                sector             = StockSector.Aerospace,
                riskLevel          = RiskLevel.High,
                totalSupply        = 100_000L,
                listingPrice       = 110L,
                weeklyDividendRate = 0.000f,
                volatilityTier     = VolatilityTier.S,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            string msg = $"항공우주 섹터 9종 에셋 생성 결과\n\n✅ 신규 생성: {created}개\n⏭ 이미 존재(건너뜀): {skipped}개\n\n경로: {OUTPUT_PATH}";
            Debug.Log($"{TAG} 완료 — {msg}");
            EditorUtility.DisplayDialog("Aerospace Sector 에셋 생성 완료", msg, "확인");
        }
    }
}
