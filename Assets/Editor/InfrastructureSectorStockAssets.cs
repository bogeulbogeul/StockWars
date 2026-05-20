using UnityEditor;
using UnityEngine;
using StockWars.Core;
using static StockWars.EditorScripts.StockAssetCreatorUtil;

namespace StockWars.EditorScripts
{
    /// <summary>
    /// 인프라 섹터 9종 StockDataSO 에셋 자동 생성기.
    ///   Low  3종: S-커넥트, 메트로 링크, 글로벌 루트
    ///   Mid  3종: 에어 링크, 시티 가드, 파이프 라인
    ///   High 3종: 웨이브 통신, 시그널 제로, 라스트 마일
    ///
    /// 사용법: StockWars > Create Stock Assets > Infrastructure Sector 전체 9종
    /// </summary>
    public static class InfrastructureSectorStockAssets
    {
        private const string TAG = "[Infrastructure]";

        [MenuItem("StockWars/Create Stock Assets/Infrastructure Sector 전체 9종")]
        public static void Create()
        {
            EnsureFolder();

            int created = 0;
            int skipped = 0;

            // ── Low / VolatilityTier.C ── 초대형 기간망 국영주 ───────────────

            created += CreateAsset(new StockProfile
            {
                stockId            = "SCONNECT",
                companyName        = "S-커넥트",
                description        = "도시 전체의 초고속 광통신망을 관리하는 국영 기반 기업. " +
                                     "발행량이 가장 많고 변동성이 적어 자산 보존용으로 선호됩니다.",
                sector             = StockSector.Infrastructure,
                riskLevel          = RiskLevel.Low,
                totalSupply        = 2_000_000L,
                listingPrice       = 920L,
                weeklyDividendRate = 0.032f,
                volatilityTier     = VolatilityTier.C,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "METROLINK",
                companyName        = "메트로 링크",
                description        = "대중교통 통합 결제 시스템 및 자율주행 도로망 운영사. " +
                                     "공공 요금 인상 뉴스에 주가가 점진적으로 상승합니다.",
                sector             = StockSector.Infrastructure,
                riskLevel          = RiskLevel.Low,
                totalSupply        = 1_800_000L,
                listingPrice       = 880L,
                weeklyDividendRate = 0.030f,
                volatilityTier     = VolatilityTier.C,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "GLOBALROUTE",
                companyName        = "글로벌 루트",
                description        = "국가 간 해저 광케이블 및 데이터 고속도로 관리사. " +
                                     "국제 정세 변화에 따라 주가가 민감하게 반응하는 우량주입니다.",
                sector             = StockSector.Infrastructure,
                riskLevel          = RiskLevel.Low,
                totalSupply        = 2_500_000L,
                listingPrice       = 940L,
                weeklyDividendRate = 0.033f,
                volatilityTier     = VolatilityTier.C,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // ── Mid / VolatilityTier.B ── 중형 인프라 구축주 ────────────────

            created += CreateAsset(new StockProfile
            {
                stockId            = "AIRLINK",
                companyName        = "에어 링크",
                description        = "도심형 항공 모빌리티(UAM) 관제 시스템 운영사. " +
                                     "정지 궤도 위성과의 연동 실패 뉴스에 취약한 중형주입니다.",
                sector             = StockSector.Infrastructure,
                riskLevel          = RiskLevel.Mid,
                totalSupply        = 500_000L,
                listingPrice       = 410L,
                weeklyDividendRate = 0.018f,
                volatilityTier     = VolatilityTier.B,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "CITYGUARD",
                companyName        = "시티 가드",
                description        = "스마트 시티 전체의 보안 카메라 및 관제 AI 솔루션 제공사. " +
                                     "정부 수주 소식에 따라 주가가 계단식으로 상승합니다.",
                sector             = StockSector.Infrastructure,
                riskLevel          = RiskLevel.Mid,
                totalSupply        = 450_000L,
                listingPrice       = 360L,
                weeklyDividendRate = 0.015f,
                volatilityTier     = VolatilityTier.B,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "PIPELINE",
                companyName        = "파이프 라인",
                description        = "에너지와 물자 수송을 위한 지하 파이프 네트워크 관리 기업. " +
                                     "유지보수 이슈와 독점 지위가 공존하는 안정주입니다.",
                sector             = StockSector.Infrastructure,
                riskLevel          = RiskLevel.Mid,
                totalSupply        = 400_000L,
                listingPrice       = 390L,
                weeklyDividendRate = 0.016f,
                volatilityTier     = VolatilityTier.B,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // ── High ── 소형 고변동 위성·6G 테마주 ──────────────────────────

            created += CreateAsset(new StockProfile
            {
                stockId            = "WAVECOMM",
                companyName        = "웨이브 통신",
                description        = "위성 통신 및 전역 무선 주파수 경매 사업 추진사. " +
                                     "위성 발사 성공 여부에 따라 주가가 널뛰는 특징이 있습니다.",
                sector             = StockSector.Infrastructure,
                riskLevel          = RiskLevel.High,
                totalSupply        = 200_000L,
                listingPrice       = 190L,
                weeklyDividendRate = 0.005f,
                volatilityTier     = VolatilityTier.A,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "SIGNALZERO",
                companyName        = "시그널 제로",
                description        = "차세대 6G 표준 기술을 연구하는 벤처 기업. " +
                                     "표준 선점 뉴스에 따라 단기 폭등이 가능한 하이리스크 종목입니다.",
                sector             = StockSector.Infrastructure,
                riskLevel          = RiskLevel.High,
                totalSupply        = 150_000L,
                listingPrice       = 140L,
                weeklyDividendRate = 0.001f,
                volatilityTier     = VolatilityTier.A,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            created += CreateAsset(new StockProfile
            {
                stockId            = "LASTMILE",
                companyName        = "라스트 마일",
                description        = "드론 전용 비행로 및 배송 인프라 운영사. " +
                                     "규제 완화 소식 하나에 기업 가치가 재평가되는 고변동 종목입니다.",
                sector             = StockSector.Infrastructure,
                riskLevel          = RiskLevel.High,
                totalSupply        = 120_000L,
                listingPrice       = 110L,
                weeklyDividendRate = 0.000f,
                volatilityTier     = VolatilityTier.S,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            string msg = $"인프라 섹터 9종 에셋 생성 결과\n\n✅ 신규 생성: {created}개\n⏭ 이미 존재(건너뜀): {skipped}개\n\n경로: {OUTPUT_PATH}";
            Debug.Log($"{TAG} 완료 — {msg}");
            EditorUtility.DisplayDialog("Infrastructure Sector 에셋 생성 완료", msg, "확인");
        }
    }
}
