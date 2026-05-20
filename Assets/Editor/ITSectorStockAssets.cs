using UnityEditor;
using UnityEngine;
using StockWars.Core;
using static StockWars.EditorScripts.StockAssetCreatorUtil;

namespace StockWars.EditorScripts
{
    /// <summary>
    /// IT 섹터 전체 9종 StockDataSO 에셋 자동 생성기.
    ///   Low  3종: 클라우드 베리, 시냅스 망, 테크 돔
    ///   Mid  3종: 모모 솔루션, 코드 마스터, 아이언 브레인
    ///   High 3종: 패치워크, 고스트 쉘, 제로 픽셀
    ///
    /// 사용법: 상단 메뉴 StockWars > Create Stock Assets > IT Sector 전체 9종
    /// </summary>
    public static class ITSectorStockAssets
    {
        private const string TAG = "[IT]";

        [MenuItem("StockWars/Create Stock Assets/IT Sector 전체 9종")]
        public static void Create()
        {
            EnsureFolder();

            int created = 0;
            int skipped = 0;

            // ════════════════════════════════════════════════════════════════
            // Low / VolatilityTier.C — 대형 우량주, 배당주
            // ════════════════════════════════════════════════════════════════

            created += CreateAsset(new StockProfile
            {
                stockId            = "CLOUDBERRY",
                companyName        = "클라우드 베리",
                description        = "암호화된 분산 서버 공급 업체. 'No-Log' 정책으로 다크넷 유저들 사이에서 " +
                                     "신뢰도가 높으며, 시장 독점적 지위를 가진 우량주입니다.",
                sector             = StockSector.IT,
                riskLevel          = RiskLevel.Low,
                totalSupply        = 1_000_000L,
                listingPrice       = 850L,
                weeklyDividendRate = 0.030f,
                volatilityTier     = VolatilityTier.C,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "SYNAPSENET",
                companyName        = "시냅스 망",
                description        = "도시 전역의 뉴럴 링크 인프라를 구축하는 기업. " +
                                     "안정적인 구독 수익을 기반으로 하는 IT 섹터의 새로운 배당주입니다.",
                sector             = StockSector.IT,
                riskLevel          = RiskLevel.Low,
                totalSupply        = 1_200_000L,
                listingPrice       = 890L,
                weeklyDividendRate = 0.031f,
                volatilityTier     = VolatilityTier.C,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "TECHDOME",
                companyName        = "테크 돔",
                description        = "차세대 운영체제(OS) '돔 OS'의 개발사. " +
                                     "모든 가전과 단말기를 연결하는 에코시스템을 독점하고 있는 대형주입니다.",
                sector             = StockSector.IT,
                riskLevel          = RiskLevel.Low,
                totalSupply        = 1_500_000L,
                listingPrice       = 910L,
                weeklyDividendRate = 0.032f,
                volatilityTier     = VolatilityTier.C,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // ════════════════════════════════════════════════════════════════
            // Mid / VolatilityTier.B — 중형 성장주
            // ════════════════════════════════════════════════════════════════

            created += CreateAsset(new StockProfile
            {
                stockId            = "MOMOSOLUTION",
                companyName        = "모모 솔루션",
                description        = "전역 AI 비서 엔진 및 자동화 툴 개발사. " +
                                     "유저의 스마트폰 인터페이스를 공급하는 핵심 인프라 기업입니다.",
                sector             = StockSector.IT,
                riskLevel          = RiskLevel.Mid,
                totalSupply        = 300_000L,
                listingPrice       = 320L,
                weeklyDividendRate = 0.015f,
                volatilityTier     = VolatilityTier.B,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "CODEMASTER",
                companyName        = "코드 마스터",
                description        = "전 세계 개발자들의 필수 플랫폼 '코드 허브' 운영사. " +
                                     "기술 트렌드 변화에 따른 도구 수요에 민감하게 반응합니다.",
                sector             = StockSector.IT,
                riskLevel          = RiskLevel.Mid,
                totalSupply        = 450_000L,
                listingPrice       = 380L,
                weeklyDividendRate = 0.017f,
                volatilityTier     = VolatilityTier.B,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "IRONBRAIN",
                companyName        = "아이언 브레인",
                description        = "고성능 AI 연산용 특수 하드웨어 제조사. " +
                                     "반도체 수급 불균형 뉴스에 따라 주가가 급변하는 특징이 있습니다.",
                sector             = StockSector.IT,
                riskLevel          = RiskLevel.Mid,
                totalSupply        = 400_000L,
                listingPrice       = 410L,
                weeklyDividendRate = 0.016f,
                volatilityTier     = VolatilityTier.B,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // ════════════════════════════════════════════════════════════════
            // High — 소형 고변동성 테마주
            // ════════════════════════════════════════════════════════════════

            created += CreateAsset(new StockProfile
            {
                stockId            = "PATCHWORK",
                companyName        = "패치워크",
                description        = "시스템 버그와 글리치를 전문적으로 수선하는 소형 보안 업체. " +
                                     "기술력은 높으나 변동성이 매우 큰 하이테크 테마주입니다.",
                sector             = StockSector.IT,
                riskLevel          = RiskLevel.High,
                totalSupply        = 100_000L,
                listingPrice       = 110L,
                weeklyDividendRate = 0.002f,
                volatilityTier     = VolatilityTier.A,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "GHOSTSHELL",
                companyName        = "고스트 쉘",
                description        = "양자 암호화 기술을 이용한 절대 보안 솔루션 제공업체. " +
                                     "해킹 사고 뉴스 하나에 상한가와 하한가를 오가는 고위험 종목입니다.",
                sector             = StockSector.IT,
                riskLevel          = RiskLevel.High,
                totalSupply        = 120_000L,
                listingPrice       = 130L,
                weeklyDividendRate = 0.001f,
                volatilityTier     = VolatilityTier.A,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "ZEROPIXEL",
                companyName        = "제로 픽셀",
                description        = "초저지연 메타버스 렌더링 엔진 개발사. " +
                                     "가상 세계 프로젝트의 성패에 따라 기업 가치가 극단적으로 결정됩니다.",
                sector             = StockSector.IT,
                riskLevel          = RiskLevel.High,
                totalSupply        = 150_000L,
                listingPrice       = 150L,
                weeklyDividendRate = 0.000f,
                volatilityTier     = VolatilityTier.S,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            string msg = $"IT 섹터 9종 에셋 생성 결과\n\n✅ 신규 생성: {created}개\n⏭ 이미 존재(건너뜀): {skipped}개\n\n경로: {OUTPUT_PATH}";
            Debug.Log($"{TAG} 완료 — {msg}");
            EditorUtility.DisplayDialog("IT Sector 에셋 생성 완료", msg, "확인");
        }
    }
}
