using UnityEditor;
using UnityEngine;
using StockWars.Core;
using static StockWars.EditorScripts.StockAssetCreatorUtil;

namespace StockWars.EditorScripts
{
    /// <summary>
    /// 엔터테인먼트 섹터 9종 StockDataSO 에셋 자동 생성기.
    ///   Low  3종: 스타더스트, 로열 미디어, 시네마 홀릭
    ///   Mid  3종: 스튜디오 루나, 팝 코어, 비주얼 아트
    ///   High 3종: 넥스트 원, 다크 호스, 소셜 믹스
    ///
    /// 사용법: StockWars > Create Stock Assets > Entertainment Sector 전체 9종
    /// </summary>
    public static class EntertainmentSectorStockAssets
    {
        private const string TAG = "[Entertainment]";

        [MenuItem("StockWars/Create Stock Assets/Entertainment Sector 전체 9종")]
        public static void Create()
        {
            EnsureFolder();

            int created = 0;
            int skipped = 0;

            // ── Low / VolatilityTier.C ── 대형 IP 보유 우량주 ──────────────

            created += CreateAsset(new StockProfile
            {
                stockId            = "STARDUST",
                companyName        = "스타더스트",
                description        = "글로벌 가상 아이돌 및 IP 매니지먼트사. " +
                                     "팬덤 기반의 안정적인 수익 구조를 가진 섹터 대장주입니다.",
                sector             = StockSector.Entertainment,
                riskLevel          = RiskLevel.Low,
                totalSupply        = 1_000_000L,
                listingPrice       = 780L,
                weeklyDividendRate = 0.028f,
                volatilityTier     = VolatilityTier.C,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "ROYALMEDIA",
                companyName        = "로열 미디어",
                description        = "전역 공중파 채널 및 OTT 플랫폼을 운영하는 거대 미디어 그룹. " +
                                     "광고 단가와 시청률 지표에 주가가 연동됩니다.",
                sector             = StockSector.Entertainment,
                riskLevel          = RiskLevel.Low,
                totalSupply        = 1_100_000L,
                listingPrice       = 810L,
                weeklyDividendRate = 0.029f,
                volatilityTier     = VolatilityTier.C,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "CINEMAHOLIC",
                companyName        = "시네마 홀릭",
                description        = "글로벌 영화 제작 및 배급 체인. " +
                                     "대작 블록버스터의 흥행 여부에 따라 분기 실적이 크게 요동칩니다.",
                sector             = StockSector.Entertainment,
                riskLevel          = RiskLevel.Low,
                totalSupply        = 900_000L,
                listingPrice       = 750L,
                weeklyDividendRate = 0.027f,
                volatilityTier     = VolatilityTier.C,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // ── Mid / VolatilityTier.B ── 중형 콘텐츠 성장주 ────────────────

            created += CreateAsset(new StockProfile
            {
                stockId            = "STUDIOLUNA",
                companyName        = "스튜디오 루나",
                description        = "고퀄리티 픽셀 애니메이션 및 게임 제작사. " +
                                     "차기작 발표 일정에 따라 주가가 극명하게 갈리는 이벤트형 종목입니다.",
                sector             = StockSector.Entertainment,
                riskLevel          = RiskLevel.Mid,
                totalSupply        = 300_000L,
                listingPrice       = 290L,
                weeklyDividendRate = 0.012f,
                volatilityTier     = VolatilityTier.B,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "POPCORE",
                companyName        = "팝 코어",
                description        = "AI 기반의 음원 생성 및 스트리밍 서비스. " +
                                     "저작권 관련 법안이나 신규 음원 차트 진입 시기에 민감합니다.",
                sector             = StockSector.Entertainment,
                riskLevel          = RiskLevel.Mid,
                totalSupply        = 350_000L,
                listingPrice       = 340L,
                weeklyDividendRate = 0.014f,
                volatilityTier     = VolatilityTier.B,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "VISUALART",
                companyName        = "비주얼 아트",
                description        = "전 세계 대작 게임과 영화의 CG/VFX를 전담하는 제작사. " +
                                     "기술 시연회 소식에 주가가 반응하는 경향이 있습니다.",
                sector             = StockSector.Entertainment,
                riskLevel          = RiskLevel.Mid,
                totalSupply        = 400_000L,
                listingPrice       = 380L,
                weeklyDividendRate = 0.015f,
                volatilityTier     = VolatilityTier.B,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // ── High ── 소형 고변동 테마주 ───────────────────────────────────

            created += CreateAsset(new StockProfile
            {
                stockId            = "NEXTONE",
                companyName        = "넥스트 원",
                description        = "홀로그램 공연 및 메타버스 이벤트 기획사. " +
                                     "기술적 결함 소식에 민감하게 반응하는 고위험 종목입니다.",
                sector             = StockSector.Entertainment,
                riskLevel          = RiskLevel.High,
                totalSupply        = 150_000L,
                listingPrice       = 140L,
                weeklyDividendRate = 0.000f,
                volatilityTier     = VolatilityTier.A,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "DARKHORSE",
                companyName        = "다크 호스",
                description        = "인디 게임 개발자들을 위한 퍼블리싱 플랫폼. " +
                                     "기발한 아이디어의 흥행 성공 시 텐배거(10배 수익)가 가능한 하이리스크 종목입니다.",
                sector             = StockSector.Entertainment,
                riskLevel          = RiskLevel.High,
                totalSupply        = 100_000L,
                listingPrice       = 110L,
                weeklyDividendRate = 0.000f,
                volatilityTier     = VolatilityTier.A,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "SOCIALMIX",
                companyName        = "소셜 믹스",
                description        = "숏폼 영상 기반의 차세대 소셜 네트워크 서비스. " +
                                     "유저 이탈률 뉴스와 광고 수익 구조 변화에 따라 변동성이 극대화됩니다.",
                sector             = StockSector.Entertainment,
                riskLevel          = RiskLevel.High,
                totalSupply        = 180_000L,
                listingPrice       = 160L,
                weeklyDividendRate = 0.002f,
                volatilityTier     = VolatilityTier.S,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            string msg = $"엔터테인먼트 섹터 9종 에셋 생성 결과\n\n✅ 신규 생성: {created}개\n⏭ 이미 존재(건너뜀): {skipped}개\n\n경로: {OUTPUT_PATH}";
            Debug.Log($"{TAG} 완료 — {msg}");
            EditorUtility.DisplayDialog("Entertainment Sector 에셋 생성 완료", msg, "확인");
        }
    }
}
